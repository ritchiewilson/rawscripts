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


class ShareDB (db.Model):
  name = db.StringProperty()
  resource_id = db.StringProperty()
  fromPage = db.StringProperty()
  
class LastUpdatedEtag (db.Model):
  name = db.StringProperty()
  etag = db.StringProperty()
  resource_id = db.StringProperty()
  
class Users (db.Model):
  name = db.StringProperty()
  firstUse = db.DateTimeProperty(auto_now_add=True)

class Notes (db.Model):
  user = db.StringProperty()
  resource_id = db.StringProperty()
  updated = db.DateTimeProperty(auto_now_add=True)
  data = db.TextProperty()

class ScriptData (db.Model):
  resource_id = db.StringProperty()
  data = db.TextProperty()
  version = db.IntegerProperty()
  timestamp = db.DateTimeProperty(auto_now_add=True)
  autosave = db.IntegerProperty()

class TitlePageData (db.Model):
  resource_id = db.StringProperty()
  title = db.StringProperty()
  authorOne = db.StringProperty()
  authorTwo = db.StringProperty()
  authorTwoChecked = db.StringProperty()
  authorThree  = db.StringProperty()
  authorThreeChecked  = db.StringProperty()
  based_on  = db.StringProperty()
  based_onChecked  = db.StringProperty()
  address = db.StringProperty()
  addressChecked = db.StringProperty()
  phone = db.StringProperty()
  phoneChecked = db.StringProperty()
  cell = db.StringProperty()
  cellChecked = db.StringProperty()
  email = db.StringProperty()
  emailChecked = db.StringProperty()
  registered = db.StringProperty()
  registeredChecked = db.StringProperty()
  other = db.StringProperty()
  otherChecked = db.StringProperty()

class UsersScripts (db.Model):
  user = db.StringProperty()
  resource_id = db.StringProperty()
  title = db.StringProperty()
  updated = db.StringProperty()
  permission = db.StringProperty()

class DuplicateScripts (db.Model):
  new_script = db.StringProperty()
  from_script = db.StringProperty()
  version = db.IntegerProperty()


class SearchForTrash(webapp.RequestHandler):
  def get(self):
    q=db.GqlQuery("SELECT * FROM UsersScripts "+
                  "WHERE permission='ownerDeleted'")
    r=q.fetch(100)
    now = datetime.datetime.today()
    for i in r:
      t=str(i.updated)
      date=t.split(' ')[0]
      time=t.split(' ')[1]
      month=date.split('-')[1]
      day=date.split('-')[2]
      if now.month==1 and int(month)==12 and now.day> int(day):
        taskqueue.add(url='/deletetrash', params={'resource_id':i.resource_id})
      #elif now.month>month and now.day > int(day):
      taskqueue.add(url='/deletetrash', params={'resource_id':i.resource_id})
      
    
class DeleteTrash (webapp.RequestHandler):
  def post(self):
    resource_id=self.request.get('resource_id')

    q=db.GqlQuery("SELECT * FROM DuplicateScripts "+
                  "WHERE from_script='"+resource_id+"' "+
                  "ORDER BY version DESC")
    f=q.fetch(1000)

    #if nothing comes from this scripts
    if len(f)==0:
      q=db.GqlQuery("SELECT * FROM ScriptData "+
                    "WHERE resource_id='"+resource_id+"'")
      r=q.fetch(50)

      if not len(r)==0:
        for i in r:
          i.delete()
        taskqueue.add(url='/deletetrash', params={'resource_id':i.resource_id})
      else:
        q=db.GqlQuery("SELECT * FROM DuplicateScripts "+
                      "WHERE new_script='"+resource_id+"'")
        r=q.fetch(50)
        for i in r:
          i.delete()
        q=db.GqlQuery("SELECT * FROM TitlePageData "+
                      "WHERE resource_id='"+resource_id+"'")
        r=q.fetch(50)
        for i in r:
          i.delete()
        q=db.GqlQuery("SELECT * FROM UsersScripts "+
                      "WHERE resource_id='"+resource_id+"'")
        r=q.fetch(50)
        for i in r:
          i.delete()
    #if things do branch off this
    else:
      v = f[0].version
      q=db.GqlQuery("SELECT * FROM ScriptData "+
                    "WHERE resource_id='"+resource_id+"' "+
                    "ORDER BY version DESC")
      r=q.fetch(50)

      if not len(r)==0:
        count=0
        for i in r:
          if i.version>v:
            count+=1
            i.delete()
        if not count==0:
          taskqueue.add(url='/deletetrash', params={'resource_id':i.resource_id})
      if len(r)==0 or count==0:
        q=db.GqlQuery("SELECT * FROM TitlePageData "+
                      "WHERE resource_id='"+resource_id+"'")
        r=q.fetch(50)
        for i in r:
          i.delete()
        q=db.GqlQuery("SELECT * FROM UsersScripts "+
                      "WHERE resource_id='"+resource_id+"'")
        r=q.fetch(50)
        for i in r:
          i.delete()
      

    
    
def main():
  application = webapp.WSGIApplication([('/searchfortrash', SearchForTrash),
                                        ('/deletetrash', DeleteTrash),],
                                       debug=True)
  
  wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
  main()

