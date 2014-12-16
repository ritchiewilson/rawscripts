# Rawscripts - Screenwriting Software
# Copyright (C) Ritchie Wilson
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.


import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
from google.appengine.dist import use_library
use_library('django', '1.2')
import StringIO, os, cgi, re
import wsgiref.handlers
from google.appengine.api import users
from google.appengine.api import taskqueue
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api import rdbms
from django.utils import simplejson
import models



class ExportData(webapp.RequestHandler):
    def get(self):
        if not users.is_current_user_admin():
            self.redirect("/")
        # Set up output files
        output = {}

        # Get all the users
        q = db.GqlQuery("SELECT * FROM Users").fetch(10000)
        output['Users'] = []
        for user in q:
            u = [user.name, str(user.firstUse)]
            output['Users'].append(u)

        # Notes
        output['Notes'] = []
        q = db.GqlQuery("SELECT * FROM Notes").fetch(10000)
        for note in q:
            n = [note.resource_id,note.thread_id,str(note.updated),\
                 note.data,str(note.row),str(note.col)]
            output['Notes'].append(n)

        # Share
        output['SharedDB'] = []
        q = db.GqlQuery("SELECT * FROM ShareDB").fetch(10000)
        for share in q:
            n = [share.name, share.resource_id, share.fromPage]
            output['SharedDB'].append(n)

        # Scripts
        # TO MANY. GOES PAST 10,000
        output['UsersScripts'] = []
        q = db.GqlQuery("SELECT * FROM UsersScripts").fetch(10000)
        for script in q:
            n = [script.user, script.resource_id, script.title, \
                 str(script.last_updated), script.permission, \
                 script.folder]
            output['UsersScripts'].append(n)

        q = db.GqlQuery("SELECT * FROM UsersScripts").fetch(10000, offset=10000)
        for script in q:
            n = [script.user, script.resource_id, script.title, \
                 str(script.last_updated), script.permission, \
                 script.folder]
            output['UsersScripts'].append(n)


        output['DuplicateScripts'] = []
        q = db.GqlQuery("SELECT * FROM DuplicateScripts").fetch(10000)
        for script in q:
            n = [script.new_script, script.from_script, script.from_version]
            output['DuplicateScripts'].append(n)

        output['Folders'] = []
        q = db.GqlQuery("SELECT * FROM Folders").fetch(10000)
        for folder in q:
            n = [folder.data, folder.user]
            output['Folders'].append(n)

        output['OpenIDData2'] = []
        q = db.GqlQuery("SELECT * FROM OpenIDData2").fetch(10000)
        for u in q:
            n = [u.nickname, u.email, u.user_id, u.federated_identity, \
                 u.federated_provider, str(u.timestamp)]
            output['OpenIDData2'].append(n)


        self.response.headers["content-Type"]="text/plain"
        self.response.out.write(simplejson.dumps(output))

_INSTANCE = "rawscripts-dump:rawscripts-dump"
class DBToFile(webapp.RequestHandler):
    def get(self):
        queue = taskqueue.QueueStatistics.fetch("exportdb")
        if not queue.tasks == 0:
            self.response.headers['Content-type']='text/plain'
            self.response.out.write("Already running")
            return
        taskqueue.add(url="/writetodb", params= {'offset' : 0},\
                      queue_name='exportdb')
        self.response.headers['Content-type']='text/plain'
        self.response.out.write("Starting")

class WriteToDB(webapp.RequestHandler):
    def post(self):
        offset = int(self.request.get('offset'))
        page_size = 100 # number of records to grab. Could easily fail at high numbers
        q = db.GqlQuery("SELECT * FROM ScriptData").fetch(page_size, offset=offset)
        conn = rdbms.connect(instance=_INSTANCE, database='rawscripts_dump')
        cursor = conn.cursor()
        for r in q:
            qs = "INSERT INTO scriptData (resource_id, data, version, tim, autosave, export, tag) VALUES (%s, %s, %s, %s, %s, %s, %s)"
            cursor.execute(qs, (r.resource_id, str(r.data), str(r.version), str(r.timestamp), str(r.autosave), r.export, r.tag))
        if len(q) == page_size:
            offset = offset + page_size
            taskqueue.add(url="/writetodb", queue_name='exportdb',\
                          params= {'offset' : offset})
        conn.commit()
        cursor.close()
        conn.close()
        self.response.headers['Content-type']='text/plain'
        self.response.out.write("1")
        return


def main():
    application = webapp.WSGIApplication([('/exportData', ExportData),
                                          ('/dbtofile', DBToFile),
                                          ('/writetodb', WriteToDB)],
                                         debug=True)
    run_wsgi_app(application)

if __name__ == '__main__':
    main()
