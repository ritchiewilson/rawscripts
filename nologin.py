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
  
class Activity (db.Model):
  name = db.StringProperty()
  activity = db.StringProperty()
  numberOfScripts = db.IntegerProperty()
  scriptSize = db.IntegerProperty()
  resource_id = db.StringProperty()
  scriptName = db.StringProperty()
  format = db.StringProperty()
  recipients = db.StringListProperty()
  numberRecipients = db.IntegerProperty()
  numberOfContacts = db.IntegerProperty()
  fromPage = db.StringProperty()
  error = db.StringProperty()
  triesBeforeSuccess = db.IntegerProperty
  mobile = db.IntegerProperty()
  timestamp = db.DateTimeProperty(auto_now_add=True)


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
    resource_id = self.request.get('resource_id')
    if resource_id == 'demo':
      user = 'user@example.com'
      sign_out = '/'
      name='demo'
    else:
      user = users.get_current_user().email()
      sign_out = users.create_logout_url('/')
      name = users.get_current_user().email()
    script_title = 'RawScripts'


    template_values = { 'sign_out': sign_out,
                        'script_title': script_title,
                        'user': user,}
    path = os.path.join(os.path.dirname(__file__), 'editor.html')

    # See if this person is
    # a reader or writer
    if not resource_id=='demo':
      token = get_auth_token(self.request)
      client = gdata.docs.client.DocsClient()
      acl_feed = client.GetAclPermissions(resource_id, auth_token=token)
      user = users.get_current_user().email()
      role = ''
      for acl in acl_feed.entry:
        if acl.scope.value == 'ritchie.a.f.wilson@gmail.com':
          if acl.role.value == 'owner':
            path = os.path.join(os.path.dirname(__file__), 'viewer.html')

        
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
    # Track what the user is doing
    a = Activity(name=name,
                 scriptName = script_title,
                 mobile = mobile,
                 activity="editor")
    a.put()

class ScriptContent (webapp.RequestHandler):
  def post(self):
    resource_id = self.request.get('resource_id')
    if resource_id == 'demo':
      result = urlfetch.fetch("http://www.rawscripts.com/text/ducksoup.html")
      htmlbody = result.content
      self.response.headers['Content-Type'] = 'text/html'
      self.response.out.write(htmlbody)
      return
  
    # We should have an auth token for this user.
    token = get_auth_token(self.request)
    if not token:
      self.redirect('/')
      return
    resource_id = self.request.get('resource_id')
    if resource_id:
      client = gdata.docs.client.DocsClient()
      client.http_client.debug = True
      entry = client.GetDoc(resource_id, auth_token = token)
      exportFormat = '&exportFormat=html'

      #This is where I get all the problems, on GetFileContent. 
      #Loop three times to reduce errors
      k=0
      while k<3:
        try:
          page = client.GetFileContent(uri=entry.content.src + exportFormat, auth_token=token)
          k=5
        except:
          k=k+1
          if k==3:
            self.response.headers['Content-Type'] = 'text/html'
            self.response.out.write('<p>grrr.... GOOGLE! Something screwed up. Try reloading this page to try again</p>')
            return
      headless = page.split('</div>')[1]
      content = headless.split('</body>')[0]
      content = content.replace('<br>','')
      script_title = entry.title.text
      content = content+"<div id='ajaxTitle'>"+script_title+"</div>"

      #now retrieve
      #shared notes and
      #insert into script

      content = content + '&notes&'
      
      q= db.GqlQuery("SELECT * FROM Notes "+
                     "WHERE resource_id='"+resource_id+"'")
      results = q.fetch(50)
      notes=0
      for p in results:
        notes=notes+1
        content = content+'&user&'+p.user+'&data&'+p.data
      if notes == 0:
        content = content + 'nonedata'
      
      size = len(content)
    a = Activity(name=users.get_current_user().email(),
                 scriptName = script_title,
                 resource_id = resource_id,
                 scriptSize = size,
                 triesBeforeSuccess = k,
                 activity="scriptcontent")
    a.put()
    self.response.headers['Content-Type'] = 'text/html'
    self.response.out.write(content)

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
                                        ('/submitbug', SubmitBug),],
                                       debug=True)
  
  wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
  main()

