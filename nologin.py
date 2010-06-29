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
import gdata.gauth
import gdata.auth
import gdata.data
import gdata.docs.client
import datetime
import atom
import gdata.contacts
import gdata.contacts.client
import api
import random
import zipfile
import exporttxt
from pyPdf import PdfFileWriter, PdfFileReader
import gdata.acl.data
import logging

# instantiate API and read in the JSON
TREEFILE = 'DeviceAtlas.json'
da = api.DaApi()
tree = da.getTreeFromFile(TREEFILE)

def get_auth_token(request):
  current_user = users.get_current_user()
  if current_user is None or current_user.user_id() is None:
    return False
  # Look for the token string in the current page's URL.
  token_string, token_scopes = gdata.gauth.auth_sub_string_from_url(
     request.url)
  if token_string is None:
    # Try to find a previously obtained session token.
    return gdata.gauth.ae_load('docsandcontacts' + current_user.user_id())
  # If there was a new token in the current page's URL, convert it to
  # to a long lived session token and persist it to be used in future
  # requests.
  single_use_token = gdata.gauth.AuthSubToken(token_string, token_scopes)
  # Create a client to make the HTTP request to upgrade the single use token
  # to a long lived session token.
  client = gdata.client.GDClient()
  try:
    session_token = client.upgrade_token(single_use_token)
  except gdata.client.UnableToUpgradeToken, error:
    return gdata.gauth.ae_load('docsandcontacts' + current_user.user_id())
  gdata.gauth.ae_save(session_token, 'docsandcontacts' + current_user.user_id())
  return session_token

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

class UsersScripts (db.Model):
  user = db.StringProperty()
  resource_id = db.StringProperty()
  title = db.StringProperty()
  updated = db.StringProperty()
  permission = db.StringProperty()

class Welcome (webapp.RequestHandler):
  def get(self):
    template_values = { 'user': 'user',}
    referer = os.environ.get("HTTP_REFERER")
    path = os.path.join(os.path.dirname(__file__), 'welcome.html')
    if referer == 'http://www.rawscripts.com/scriptlist':
      self.response.headers['Content-Type'] = 'text/html'
      self.response.out.write(template.render(path, template_values))
    else:
      token = get_auth_token(self.request)
      if not token:
        self.response.headers['Content-Type'] = 'text/html'
        self.response.out.write(template.render(path, template_values))
      else:
        self.redirect('/scriptlist')

class Editor (webapp.RequestHandler):
  def get(self):

    template_values = {}
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
    if resource_id == 'demo':
      result = urlfetch.fetch("http://www.rawscripts.com/text/ducksoup.html")
      htmlbody = result.content
      self.response.headers['Content-Type'] = 'text/html'
      self.response.out.write(htmlbody)
      return

    q = db.GqlQuery("SELECT * FROM UsersScripts "+
                    "WHERE resource_id='"+resource_id+"'")
    results = q.fetch(500)
    p=False
    if len(results)==0:
      self.response.headers["Content-Type"]='text/plain'
      self.response.out.write('not found')
    for i in results:
      if i.user==users.get_current_user().email().lower():
        if i.permission=='owner':
          p=True
    logging.info(resource_id)

    if p==True:
      q = db.GqlQuery("SELECT * FROM ScriptData "+
                      "WHERE resource_id='"+resource_id+"' "+
                      "ORDER BY version DESC")
      results = q.fetch(1000)
      
      self.response.headers["Content-Type"]='text/plain'
      self.response.out.write(results[0].data)


class Save (webapp.RequestHandler):
  def post(self):
    v=0
    resource_id = self.request.get('resource_id')
    if resource_id == None:
      return
    data=self.request.get('data')

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
                     version=v)
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

