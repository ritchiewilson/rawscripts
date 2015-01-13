import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
from google.appengine.dist import use_library
use_library('django', '1.2')
import wsgiref.handlers
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api.labs import taskqueue
from django.utils import simplejson
import models
import difflib
import logging
from datetime import datetime

class Migrate(webapp.RequestHandler):
    def get(self):
        query = models.MigrationCheck.all()
        results = query.fetch(None)
        diffing = 0
        checking = 0
        correct = 0
        errors = []
        for result in results:
            if result.diffing is True:
                diffing += 1
            elif result.checking is True:
                checking += 1
            elif result.correct is True:
                correct += 1
            else:
                error = {'resource_id': result.resource_id,
                         'message': result.text}
                errors.append(error)

        query = models.VersionErrors.all()
        results = query.fetch(None)
        num_version_errors = len(results)
        version_errors = []
        for result in results:
            error = {'resource_id': result.resource_id,
                     'message': result.version}
            version_errors.append(error)


        template_values = {
            'diffing': diffing,
            'checking': checking,
            'correct': correct,
            'failed': len(errors),
            'errors': errors,
            'num_version_errors': num_version_errors,
            'version_errors': version_errors
        }

        self.response.headers['Content-Type'] = 'text/html'
        path = os.path.join(os.path.dirname(__file__), 'html/migrate.html')
        self.response.out.write(template.render(path, template_values))

    def post(self):
        user = "rawilson52@gmail.com"
        # user = "tefst@example.com"
        query = db.GqlQuery("SELECT * FROM UsersScripts "+
                            "WHERE permission='owner'")
        query = db.GqlQuery("SELECT * FROM UsersScripts "+
                            "WHERE user='"+user+"'")
        results = query.fetch(100)
        for script in results:
            if not script.permission == "owner":
                continue
            params = {'resource_id': script.resource_id,
                      'start_version': 0}
            taskqueue.add(url="/migrate-script", params=params)
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write("all queued up")

class MigrateDelete(webapp.RequestHandler):
    def post(self):
        tables_to_clear = ["MigrationCheck", "Op",
                           "ResourceVersion", "VersionTag", "VersionErrors"]
        for table in tables_to_clear:
            query = db.GqlQuery("SELECT __key__ FROM "+ table)
            entries = query.fetch(10000)
            if len(entries) == 0:
                continue
            db.delete(entries)
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write("deleted everything")

class MigrateScript(webapp.RequestHandler):
    def post(self):
        VERSIONS_PER_REQUEST = 5
        resource_id = self.request.get('resource_id')
        start_version = int(self.request.get('start_version'))
        if start_version == 0:
            mc = models.MigrationCheck(key_name=resource_id,
                                       resource_id=resource_id,
                                       diffing=True,
                                       checking=False,
                                       correct=False)
            mc.put()
        query = models.ScriptData.all()
        query.filter('resource_id =', resource_id)
        query.filter('version >=', start_version)
        query.order('version')
        results = query.fetch(VERSIONS_PER_REQUEST)

        # no more work, so start checking everything
        if len(results) == 0:
            mc = models.MigrationCheck.get_by_key_name(resource_id)
            mc.diffing = False
            mc.checking = True
            mc.put()
            params = {'resource_id': resource_id}
            taskqueue.add(url="/migrate-check", params=params)
            return

        # first save is an anoying edge case
        if start_version == 0:
            first = results[0]
            rv = self.save_version(1, first.timestamp, bool(first.autosave), "", first.data)
            self.save_tags(first, rv)
        for snapshot1, snapshot2 in zip(results, results[1:]):
            version = snapshot2.version
            timestamp = snapshot2.timestamp
            autosave = bool(snapshot2.autosave)
            string0 = snapshot1.data
            string1 = snapshot2.data
            rv = self.save_version(version, timestamp, autosave, string0, string1)
            self.save_tags(snapshot2, rv)

        params = {'resource_id': resource_id,
                  'start_version': start_version + VERSIONS_PER_REQUEST - 1}
        taskqueue.add(url="/migrate-script", params=params)


    def save_version(self, version, timestamp, autosave, string0, string1):
        resource_id = self.request.get('resource_id')
        key_name = resource_id + "+" + str(version)
        rv = models.ResourceVersion(key_name=key_name,
                                    resource_id=resource_id,
                                    version=version,
                                    timestamp=timestamp,
                                    autosave=autosave)
        rv.put()
        diff = difflib.SequenceMatcher(None, string0, string1)
        application_index = 0
        for tag, i1, i2, j1, j2 in reversed(diff.get_opcodes()):
            if tag == "equal":
                continue
            op_key_name = key_name + "+" + str(application_index)
            op = models.Op(key_name=op_key_name, resource_version=rv,
                           offset=i1, application_index=application_index)
            op.action = ["insert", "delete", "replace"].index(tag)
            if tag == "delete":
                op.amount = (i2 - i1)
            elif tag == "insert":
                op.text = string1[j1:j2]
            elif tag == "replace":
                op.amount = (i2 - i1)
                op.text = string1[j1:j2]
            op.put()
            application_index += 1
        return rv

    # save all the email, export, and user defined tags
    def save_tags(self, snapshot, resource_version):
        if snapshot.tag != '':
            tag = models.VersionTag(resource_version=resource_version,
                                    _type='user',
                                    value=snapshot.tag,
                                    timestamp=resource_version.timestamp)
            tag.put()
        emails, exports = simplejson.loads(snapshot.export)

        def save_tag(entry, _type):
            value = entry[0]
            t = entry[1].split(".")[0]
            timestamp = datetime.strptime(t, "%Y-%m-%d %H:%M:%S")
            tag = models.VersionTag(resource_version=resource_version,
                                    _type=_type,
                                    value=value,
                                    timestamp=timestamp)
            tag.put()
        for email in emails:
            save_tag(email, 'email')
        for export in exports:
            save_tag(export, 'export')



class MigrateCheck(webapp.RequestHandler):
    def post(self):
        resource_id = self.request.get('resource_id')
        status = self.verify_screenplay(resource_id)
        mc = models.MigrationCheck.get_by_key_name(resource_id)
        mc.checking = False
        if status is True:
            mc.correct = True
        else:
            mc.correct = False
            mc.text = status
        mc.put()


    def get(self):
        user = "rawilson52@gmail.com"
        user = "tefst@example.com"
        query = db.GqlQuery("SELECT * FROM UsersScripts "+
                            "WHERE user='"+user+"'")
        results = query.fetch(None)
        output = ""
        for script in results:
            if not script.permission == "owner":
                continue
            output += script.title + ", " + script.resource_id + ": "
            verified = self.verify_screenplay(script.resource_id)
            if verified == True:
                output += "True\n"
            else:
                output += "FAILED AT VERSION: " + str(verified) + "\n"
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(output)

    def verify_screenplay(self, resource_id):
        query = db.GqlQuery("SELECT * FROM ScriptData "+
                            "WHERE resource_id='"+resource_id+"' "+
                            "ORDER BY version")
        results = query.fetch(None)

        new_query = db.GqlQuery("SELECT * FROM ResourceVersion "+
                                "WHERE resource_id='"+resource_id+"' "+
                                "ORDER BY version")
        new_results = new_query.fetch(None)
        if len(results) != len(new_results):
            return "WRONG NUMBER OF VERSIONS"
        new_string = ""
        for original, new_version in zip(results, new_results):
            ops = sorted(new_version.ops, key=lambda op: op.application_index)
            new_string = self.apply_ops(new_string, ops)
            if not original.data == new_string:
                return "Failed at version: " + str(original.version)
        return True

    def apply_ops(self, string, ops):
        for op in ops:
            tag = ["insert", "delete", "replace"][op.action]
            if tag == "delete":
                string = string[:op.offset] + string[op.offset + op.amount:]
            if tag == "insert":
                string = string[:op.offset] + op.text + string[op.offset:]
            if tag == "replace":
                string = string[:op.offset] + op.text + string[op.offset + op.amount:]
        return string

class MigrateVersionErrors(webapp.RequestHandler):
    def post(self):
        query = db.GqlQuery("SELECT resource_id FROM UsersScripts "+
                            "WHERE permission='owner'")
        results = query.fetch(10000)
        for script in results:
            params = {'resource_id': script.resource_id}
            taskqueue.add(url="/migrate-version-errors-task", params=params)
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write("all queued up")

class MigrateVersionErrorTask(webapp.RequestHandler):
    def post(self):
        resource_id = self.request.get('resource_id')
        query = db.GqlQuery("SELECT version FROM ScriptData "+
                            "WHERE resource_id='" + resource_id +"'")
        results = query.fetch(None)
        versions = sorted(results, key=lambda result: result.version)
        for version1, version2 in zip(versions, versions[1:]):
            if version1.version + 1 == version2.version:
                continue
            error = models.VersionErrors(resource_id=resource_id,
                                         version=version1.version)
            error.put()
        return


def main():
    application = webapp.WSGIApplication([('/migrate-script', MigrateScript),
                                          ('/migrate-check', MigrateCheck),
                                          ('/migrate', Migrate),
                                          ('/migrate-delete', MigrateDelete),
                                          ('/migrate-version-errors', MigrateVersionErrors),
                                          ('/migrate-version-errors-task', MigrateVersionErrorTask),
                                            ],
                                         debug=True)

    run_wsgi_app(application)


if __name__ == '__main__':
    main()
