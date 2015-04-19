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
import StringIO
import cgi
import wsgiref.handlers
from google.appengine.api import users
from google.appengine.api import mail
from google.appengine.api import urlfetch
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
import datetime
import random
import zipfile
import export
import logging
from django.utils import simplejson
from google.appengine.api.labs import taskqueue
import config
import models


class JunkParse(webapp.RequestHandler):
    def get(self):
        q = db.GqlQuery("SELECT * FROM UsersScripts "+
                        "WHERE permission='hardDelete'")
        for i in q.run(limit=5000, projection=('resource_id',)):
            taskqueue.add(url='/automateddelete', params={'resource_id':i.resource_id})
            self.response.out.write(i.resource_id)
            self.response.out.write("\n")


class AutomatedDelete (webapp.RequestHandler):
    def post(self):
        resource_id = self.request.get('resource_id')
        query = models.UsersScripts.all()
        query.filter('resource_id =', resource_id)
        for row in query.run():
            if row.permission != 'hardDelete':
                return

        q = db.GqlQuery("SELECT * FROM DuplicateScripts "+
                        "WHERE from_script='"+resource_id+"'")
        f = q.fetch(1)
        #if nothing comes from this script
        if len(f) != 0:
            return

        q = db.GqlQuery("SELECT __key__ FROM ScriptData "+
                        "WHERE resource_id='"+resource_id+"'")
        r = q.fetch(500)

        if not len(r)==0:
            db.delete(r)
            params = {'resource_id': resource_id}
            taskqueue.add(url='/automateddelete', params=params)
            return
        else:
            q = db.GqlQuery("SELECT __key__ FROM DuplicateScripts "+
                            "WHERE new_script='"+resource_id+"'")
            r = q.fetch(50)
            db.delete(r)
            q = db.GqlQuery("SELECT __key__ FROM TitlePageData "+
                            "WHERE resource_id='"+resource_id+"'")
            r = q.fetch(50)
            db.delete(r)
            q = db.GqlQuery("SELECT __key__ FROM UsersScripts "+
                            "WHERE resource_id='"+resource_id+"'")
            r = q.fetch(50)
            db.delete(r)
            q = db.GqlQuery("SELECT __key__ FROM SpellingData "+
                            "WHERE resource_id='"+resource_id+"'")
            r = q.fetch(50)
            db.delete(r)
            q = db.GqlQuery("SELECT __key__ FROM Notes "+
                            "WHERE resource_id='"+resource_id+"'")
            r = q.fetch(1000)
            db.delete(r)
            q = db.GqlQuery("SELECT __key__ FROM ShareNotify "+
                            "WHERE resource_id='"+resource_id+"'")
            r = q.fetch(1000)
            db.delete(r)

def main():
    application = webapp.WSGIApplication([('/junkparse', JunkParse),
                                          ('/automateddelete', AutomatedDelete),],
                                         debug=True)

    run_wsgi_app(application)


if __name__ == '__main__':
    main()
