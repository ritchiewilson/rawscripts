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
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
from django.utils import simplejson
from models import Folders, UsersScripts

from utils import gcu, ownerPermission


class NewFolder (webapp.RequestHandler):
    def post(self):
        user = gcu()
        folder_name = self.request.get('folder_name')
        folder_id = self.request.get('folder_id')
        folder = Folders.get_by_user(user)
        if folder is None:
            folder = Folders(user=user, data='[]')
        J = simplejson.loads(folder.data)
        J.append([folder_name, folder_id])
        folder.data = simplejson.dumps(J)
        folder.put()

class ChangeFolder (webapp.RequestHandler):
    def post(self):
        resource_id = self.request.get("resource_id").split(',')
        for i in resource_id:
            p = ownerPermission(i)
            if not p == False:
                q = db.GqlQuery("SELECT * FROM UsersScripts "+
                                "WHERE resource_id='"+i+"' "+
                                "and permission='owner'")
                r = q.fetch(1)
                r[0].folder = self.request.get("folder_id")
                r[0].put()
        self.response.out.write("1")

class DeleteFolder (webapp.RequestHandler):
    def post(self):
        folder_id = self.request.get("folder_id")
        user = gcu()
        # First move screenplays out of folder
        q = UsersScripts.all()
        q.filter('user =', user).filter('folder =', folder_id)
        q.filter('permission =', 'owner')
        for screenplay in q.run():
            screenplay.folder = "?none?"
            screenplay.put()
        row = Folders.get_by_user(user)
        folders = simplejson.loads(row.data)
        arr = [f for f in folders if f[1] != folder_id]
        row.data = simplejson.dumps(arr)
        row.put()
        self.response.out.write("1")

class RenameFolder (webapp.RequestHandler):
    def post(self):
        folder_id = self.request.get("folder_id")
        user = gcu()
        q=db.GqlQuery("SELECT * FROM Folders WHERE user='"+user+"'")
        r = q.fetch(1)
        folders = simplejson.loads(r[0].data)
        arr = []
        for i in folders:
            if i[1] == folder_id:
                i[0] = self.request.get("folder_name")
            arr.append(i)
        r[0].data = simplejson.dumps(arr)
        r[0].put()
        self.response.out.write("1")

def main():
    application = webapp.WSGIApplication([('/newfolder', NewFolder),
                                          ("/changefolder", ChangeFolder),
                                          ("/deletefolder", DeleteFolder),
                                          ('/renamefolder', RenameFolder)],
                                         debug=True)

    run_wsgi_app(application)


if __name__ == '__main__':
    main()
