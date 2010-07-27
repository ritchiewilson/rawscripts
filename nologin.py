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

# instantiate API and read in the JSON
TREEFILE = 'DeviceAtlas.json'
da = api.DaApi()
tree = da.getTreeFromFile(TREEFILE)


class Notes (db.Model):
  user = db.StringProperty()
  resource_id = db.StringProperty()
  updated = db.DateTimeProperty(auto_now_add=True)
  data = db.TextProperty()

class SpellingData (db.Model):
  resource_id = db.StringProperty()
  wrong = db.TextProperty()
  ignore = db.TextProperty()
  timestamp = db.DateTimeProperty(auto_now_add=True)
  
class ScriptData (db.Model):
  resource_id = db.StringProperty()
  data = db.TextProperty()
  version = db.IntegerProperty()
  timestamp = db.DateTimeProperty(auto_now_add=True)
  autosave = db.IntegerProperty()
  export = db.StringProperty()
  tag = db.StringProperty()

class UsersScripts (db.Model):
  user = db.StringProperty()
  resource_id = db.StringProperty()
  title = db.StringProperty()
  updated = db.StringProperty()
  permission = db.StringProperty()

class Welcome (webapp.RequestHandler):
  def get(self):
    referer = os.environ.get("HTTP_REFERER")
    template_values={}
    path = os.path.join(os.path.dirname(__file__), 'welcome.html')
    if referer == 'http://www.rawscripts.com/scriptlist':
      self.response.headers['Content-Type'] = 'text/html'
      self.response.out.write(template.render(path, template_values))
      return
    
    user = users.get_current_user()
    if not user:
      self.response.headers['Content-Type'] = 'text/html'
      self.response.out.write(template.render(path, template_values))
    else:
        self.redirect('/scriptlist')
        

class Editor (webapp.RequestHandler):
  def get(self):
    user = users.get_current_user()
    if user:
      template_values = { 'sign_out': users.create_logout_url('/') }
      template_values['user'] = users.get_current_user().email()
    else:
      template_values = { 'sign_out': '/' }
      template_values['user'] = "test@example.com"
    path = os.path.join(os.path.dirname(__file__), 'editor.html')
        
    mobile = 0
    #Check if should send to mobile Page
    ua = self.request.user_agent
    props = da.getPropertiesAsTyped(tree, ua)
    if props.has_key('mobileDevice'):
      if props['mobileDevice']:
        path = os.path.join(os.path.dirname(__file__), 'MobileEditor.html')
        mobile = 1
    
    self.response.headers['Content-Type'] = 'text/html'
    self.response.out.write(template.render(path, template_values))

class ScriptContent (webapp.RequestHandler):
  def post(self):
    resource_id = self.request.get('resource_id')

    q = db.GqlQuery("SELECT * FROM UsersScripts "+
                    "WHERE resource_id='"+resource_id+"'")
    results = q.fetch(500)
    p=False
    if len(results)==0:
      self.response.headers["Content-Type"]='text/plain'
      self.response.out.write('not found')
    if resource_id=='Demo':
      p=True
      title="Duck Soup"
    else:
      for i in results:
        title=i.title
        if i.user==users.get_current_user().email().lower():
          if i.permission=='owner':
            p=True
    
    if p==True:
      q = db.GqlQuery("SELECT * FROM ScriptData "+
                      "WHERE resource_id='"+resource_id+"' "+
                      "ORDER BY version DESC")
      results = q.fetch(1000)
      
      q = db.GqlQuery("SELECT * FROM SpellingData "+
                      "WHERE resource_id='"+resource_id+"'")
      spellresults = q.fetch(2)
      sp = []
      if len(spellresults)!=0:
        sp.append(simplejson.loads(spellresults[0].wrong))
        sp.append(simplejson.loads(spellresults[0].ignore))
      
      ja=[]
      ja.append(title)
      ja.append(simplejson.loads(results[0].data))
      ja.append(sp)

      content = simplejson.dumps(ja)

      
      self.response.headers["Content-Type"]='text/plain'
      self.response.out.write(content)


class Save (webapp.RequestHandler):
  def post(self):
    v=0
    resource_id = self.request.get('resource_id')
    if resource_id == None:
      return
    if resource_id=='Demo':
      self.response.out.write('demo')
      return
    data=self.request.get('data')
    autosave = self.request.get('autosave')
    if autosave=='0':
      b=0
    else:
      b=1
    q = db.GqlQuery("SELECT * FROM UsersScripts "+
                    "WHERE resource_id='"+resource_id+"'")
    results = q.fetch(1000)
    if len(results)==0:
      u = UsersScripts(user = users.get_current_user().email().lower(),
                       resource_id=resource_id,
                       title='name',
                       updated='now',
                       permission='owner')
      u.put()

      v=1

    else:
      for i in results:
        if i.permission=='owner':
          if i.user==users.get_current_user().email().lower():
            q = db.GqlQuery("SELECT * FROM ScriptData "+
                            "WHERE resource_id='"+resource_id+"' "+
                            "ORDER BY version DESC")
            results = q.fetch(1000)
            v = results[0].version
            v+=1

    
    if not v==0:
      a = ScriptData(resource_id=resource_id,
                     title='title',
                     data=data,
                     version=v,
                     export='[[],[]]',
                     tag='',
                     autosave=b)
      a.put()

      q = db.GqlQuery("SELECT * FROM UsersScripts "+
                    "WHERE resource_id='"+resource_id+"'")
      results=q.fetch(500)
      for i in results:
        i.updated=str(datetime.datetime.today())
        i.put()

      self.response.out.write('1')
    else:
      self.response.out.write('0')

    

class ContactEmail (webapp.RequestHandler):
  def post(self):
    name = self.request.get('name')
    subject = self.request.get('subject')
    message = self.request.get('message')
    if not message == None:
      body = 'FROM: '+name+'\n\nSUBJECT: '+subject+'\n\n'+message
      mail.send_mail(sender='contact@rawscripts.com',
                     to='contact@rawscripts.com',
                     subject='From Homepage Form: '+subject,
                     body=body)
      self.response.out.write('1')

class Bugs (webapp.RequestHandler):
  def get(self):
    #This is the one for admins
    self.redirect('http://spreadsheets.google.com/viewform?hl=en&formkey=dE15YkVNa095dVRBYkl3eXdBVHJHVXc6MQ#gid=0')

class SubmitBug (webapp.RequestHandler):
  def get(self):
    #This is the one for public
    self.redirect('http://spreadsheets.google.com/viewform?hl=en&formkey=dDBkVlZfV0RJUWxORjZGdzVWOHVnUXc6MQ#gid=0')
    
def main():
  application = webapp.WSGIApplication([('/editor', Editor),
                                        ('/', Welcome),
                                        ('/scriptcontent', ScriptContent),
                                        ('/contactemail', ContactEmail),
                                        ('/bugs', Bugs),
                                        ('/save', Save),
                                        ('/submitbug', SubmitBug),],
                                       debug=True)
  
  wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
  main()

