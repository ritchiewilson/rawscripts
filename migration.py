import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
from google.appengine.dist import use_library
use_library('django', '1.2')
import wsgiref.handlers
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
import logging
from django.utils import simplejson
import os
import models
import datetime
import difflib


class Migrate(webapp.RequestHandler):
    def get(self):
        resource_id = self.request.get('resource_id')
        query = db.GqlQuery("SELECT * FROM ScriptData "+
                            "WHERE resource_id='"+resource_id+"' "+
                            "ORDER BY version")
        results = query.fetch(100)
        for i in range(len(results)):
            version = i + 1
            key_name = resource_id + "+" + str(version)
            rv = models.ResourceVersion(key_name=key_name,
                                        resource_id=resource_id,
                                        version=version,
                                        timestamp=results[i].timestamp,
                                        autosave=bool(results[i].autosave))
            rv.put()
            string0 = "" if i == 0 else results[i - 1].data
            string1 = results[i].data
            diff = difflib.SequenceMatcher(None, string0, string1)
            application_index = 0
            for tag, i1, i2, j1, j2 in reversed(diff.get_opcodes()):
                if tag == "equal":
                    continue
                op_key_name = key_name + "+" + str(application_index)
                op = models.Op(key_name=op_key_name, resource_version=rv,
                               action=tag, offset=i1,
                               application_index=application_index)
                if tag == "delete":
                    op.amount = (i2 - i1)
                elif tag == "insert":
                    op.text = string1[j1:j2]
                elif tag == "replace":
                    op.amount = (i2 - i1)
                    op.text = string1[j1:j2]
                op.put()
                application_index += 1

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(1)


class MigrateCheck(webapp.RequestHandler):
    def get(self):
        resource_id = self.request.get('resource_id')
        query = db.GqlQuery("SELECT * FROM ScriptData "+
                            "WHERE resource_id='"+resource_id+"' "+
                            "ORDER BY version")
        results = query.fetch(100)

        new_query = db.GqlQuery("SELECT * FROM ResourceVersion "+
                                "WHERE resource_id='"+resource_id+"' "+
                                "ORDER BY version")
        new_results = new_query.fetch(100)
        new_string = ""
        old_string = None
        self.response.headers['Content-Type'] = 'text/plain'
        for original, new_version in zip(results, new_results):
            ops = sorted(new_version.ops, key=lambda op: op.application_index)
            new_string = self.apply_ops(new_string, ops)
            if not original.data == new_string:
                output = "FAILED\n" + str(original.version) + "\n"
                output += original.data + "\n\n" + new_string
                self.response.out.write(output)
                return
            old_string = original
        output = "Worked!\n" + str(old_string.version) + "\n"
        output += old_string.data + "\n\n" + new_string
        self.response.out.write(output)



    def apply_ops(self, string, ops):
        for op in ops:
            tag = op.action
            if tag == "delete":
                string = string[:op.offset] + string[op.offset + op.amount:]
            if tag == "insert":
                string = string[:op.offset] + op.text + string[op.offset:]
            if tag == "replace":
                string = string[:op.offset] + op.text + string[op.offset + op.amount:]
        return string



def main():
    application = webapp.WSGIApplication([('/migrate', Migrate),
                                          ('/migrate-check', MigrateCheck),
                                            ],
                                         debug=True)

    run_wsgi_app(application)


if __name__ == '__main__':
    main()
