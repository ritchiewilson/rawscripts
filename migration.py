import StringIO
import os
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
import api
import random
import zipfile
import export
import logging
from django.utils import simplejson
from google.appengine.api.labs import taskqueue


class ScriptData (db.Model):
  resource_id = db.StringProperty()
  data = db.TextProperty()
  version = db.IntegerProperty()
  export = db.StringProperty()
  tag = db.StringProperty()
  timestamp = db.DateTimeProperty(auto_now_add=True)
  autosave = db.IntegerProperty()


class dbparse(webapp.RequestHandler):
  def get(self):
    q=db.GqlQuery("SELECT * FROM ScriptData")
    r=q.fetch(1000)
    for i in r:
      taskqueue.add(url='/DBMigrationWorker', params={'resource_id':i.resource_id, 'version':i.version})
    self.response.out.write('1')
      
    
class DBMigrationWorker (webapp.RequestHandler):
  def post(self):
    resource_id=self.request.get('resource_id')
    version= self.request.get('version')
    logging.info(version)
    q=db.GqlQuery("SELECT * FROM ScriptData "+
                  "WHERE resource_id='"+resource_id+"' "+
                  "AND version="+version)
    f=q.fetch(1)
    f[0].tag=""
    f[0].export="[[],[]]"
    logging.info(f[0].data)
    f[0].put()
    
    
def main():
  application = webapp.WSGIApplication([('/DBparse', dbparse),
                                        ('/DBMigrationWorker', DBMigrationWorker),],
                                       debug=True)
  
  wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
  main()


