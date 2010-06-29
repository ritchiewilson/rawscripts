import StringIO
import os
import re
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
import json

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

class UsersScripts (db.Model):
  user = db.StringProperty()
  resource_id = db.StringProperty()
  title = db.StringProperty()
  updated = db.StringProperty()
  permission = db.StringProperty()

class ScriptList(webapp.RequestHandler):
  """Requests the list of the user's Screenplays in the RawScripts folder."""

  def get(self):

    template_values = { 'sign_out': users.create_logout_url('/') }
    template_values['user'] = users.get_current_user().email()

    
    
    path = os.path.join(os.path.dirname(__file__), 'scriptlist.html')
    mobile = 0
    #Check if should send to mobile Page
    ua = self.request.user_agent
    props = da.getPropertiesAsTyped(tree, ua)
    if props.has_key('mobileDevice'):
      if props['mobileDevice']:
        path = os.path.join(os.path.dirname(__file__), 'MobileScriptlist.html')
        mobile = 1

    self.response.headers['Content-Type'] = 'text/html'
    self.response.out.write(template.render(path, template_values))

    q= db.GqlQuery("SELECT * FROM Users "+
                   "WHERE name='"+users.get_current_user().email()+"'")
    results = q.fetch(5)
    k=0
    for p in results:
      k=1
    if k == 0:
      newUser = Users(name=users.get_current_user().email())
      newUser.put()

class List (webapp.RequestHandler):
  def post(self):
    mobile = 0
    #Check if should send to mobile Page
    ua = self.request.user_agent
    props = da.getPropertiesAsTyped(tree, ua)
    if props.has_key('mobileDevice'):
      if props['mobileDevice']:
        path = os.path.join(os.path.dirname(__file__), 'mobilelist.html')
        mobile = 1

    q= db.GqlQuery("SELECT * FROM UsersScripts "+
                   "WHERE user='"+users.get_current_user().email().lower()+"' "+
                   "AND permission='owner'")
    results = q.fetch(1000)

    pl = []
    for i in results:
      pl.append([i.resource_id, i.title, i.updated])

    j = json.dumps(pl)
    self.response.out.write(j)

class Delete (webapp.RequestHandler):
  def post(self):
    resource_id = self.request.get('resource_id')
    q = db.GqlQuery("SELECT * FROM UsersScripts "+
                    "WHERE resource_id='"+resource_id+"'")
    results = q.fetch(1000)
    p=False
    for i in results:
      if i.permission=='owner':
        if i.user==users.get_current_user().email().lower():
          p=True
    if p==True:
      for i in results:
        if i.permission=='owner':
          i.permission='ownerDeleted'
          i.put()
        if i.permission=='collab':
          i.permission='collabDeleted'
          i.put()
      self.response.headers['Content-Type']='text/plain'
      self.response.out.write('1')
    else:
      self.response.headers['Content-Type']='text/plain'
      self.response.out.write('0')
    
    

class Rename (webapp.RequestHandler):
  def post(self):
    resource_id = self.request.get('resource_id')
    fromPage = self.request.get('fromPage')
    rename = self.request.get('rename')
    q = db.GqlQuery("SELECT * FROM UsersScripts "+
                    "WHERE resource_id='"+resource_id+"'")
    results = q.fetch(1000)
    p=False
    for i in results:
      if i.permission=='owner':
        if i.user==users.get_current_user().email().lower():
          p=True
    if p==True:
      for i in results:
        i.title=rename
        i.put()
    

class Export (webapp.RequestHandler):
  def get(self):
    fromPage = self.request.get('fromPage')
    token = get_auth_token(self.request)
    resource_id = self.request.get('resource_id')
    export_format = self.request.get('export_format')
    if resource_id:
      client = gdata.docs.client.DocsClient()
      entry = client.GetDoc(resource_id, auth_token = token)
      filename = str(entry.title.text)
      if export_format == 'txt':
        exportFormat = '&exportFormat=html'
      else:
        exportFormat = '&exportFormat=pdf'
      application_type = ''
      if export_format == 'pdf':
        application_type = 'application/pdf'
      elif export_format == 'txt':
        application_type = 'text/plain'
      #This is where I get all the problems, on GetFileContent. 
      #Loop three times to reduce errors
      k=0
      while k<3:
        try:
          script = client.GetFileContent(uri=entry.content.src + exportFormat, auth_token=token)
          k=5
        except:
          k=k+1
          if k==3:
            self.response.headers['Content-Type'] = 'text/html'
            self.response.out.write('<p>grrr.... GOOGLE! Something screwed up. Try reloading this page to try again</p>')
            return
      if export_format == 'pdf':
        data = StringIO.StringIO(script)
        output = PdfFileWriter()
        input1 = PdfFileReader(data)

        i=0
        pages = input1.getNumPages()
        while i<pages:
          output.addPage(input1.getPage(i))
          i=i+1

        outputStream = StringIO.StringIO()
        output.write(outputStream)
        filename = 'filename=' + filename + '.pdf'
        self.response.headers['Content-Type'] = application_type
        self.response.headers['Content-Disposition'] = filename
        self.response.out.write(outputStream.getvalue())
        size = len(outputStream.getvalue())
      elif export_format =='txt':
        newfile = exporttxt.exportToText(script)
        filename = 'filename=' + filename + '.txt'
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.headers['Content-Disposition'] = 'attachment; ' +filename
        self.response.out.write(newfile.getvalue())
        size = len(newfile.getvalue())
      # record who's doing what
      a = Activity(name=users.get_current_user().email(),
                   scriptName = entry.title.text,
                   resource_id = resource_id,
                   format = export_format,
                   scriptSize = size,
                   triesBeforeSuccess = k,
                   fromPage = fromPage,
                   activity="export")
      a.put()
  
class EmailScript (webapp.RequestHandler):
  def post(self):
    fromPage = self.request.get('fromPage')
    token = get_auth_token(self.request)
    resource_id = self.request.get('resource_id')
    subject=self.request.get('subject')
    body_message=self.request.get('body_message')
    result = urlfetch.fetch("http://www.rawscripts.com/text/email.txt")
    htmlbody = result.content
    html = htmlbody.replace("FILLERTEXT", body_message)
    body = body_message + """


--- This Script written and sent from RawScripts.com. Check it out---"""
    
    # Make Recipient list instead of just one
    recipients=self.request.get('recipients').split(',')
    client = gdata.docs.client.DocsClient()
    entry = client.GetDoc(resource_id, auth_token=token)
    title = entry.title.text + '.pdf'
    exportFormat = '&exportFormat=pdf'

    #This is where I get all the problems, on GetFileContent. 
    #Loop three times to reduce errors
    k=0
    while k<3:
      try:
        script = client.GetFileContent(uri=entry.content.src + exportFormat, auth_token=token)
        k=5
      except:
        k=k+1
        if k==3:
          self.response.headers['Content-Type'] = 'text/plain'
          self.response.out.write('0')
          # record who's doing what
          a = Activity(name=users.get_current_user().email(),
                       scriptName = entry.title.text,
                       resource_id = resource_id,
                       recipients = recipients,
                       numberRecipients = len(recipients),
                       error = 'getFileContent fail',
                       fromPage = fromPage,
                       activity="email")
          a.put()
          self.response.headers['Content-Type'] = 'text/plain'
          self.response.out.write('not sent')
          return
        
    #Reformat PDF so It looks nice, goes out smaller and stuff
    #
    data = StringIO.StringIO(script)
    output = PdfFileWriter()
    input1 = PdfFileReader(data)

    i=0
    pages = input1.getNumPages()
    while i<pages:
      output.addPage(input1.getPage(i))
      i=i+1

    outputStream = StringIO.StringIO()
    output.write(outputStream)
    size = len(outputStream.getvalue())

    #Mail the damn thing. Itereating to reduce userside errors
    j=0
    while j<3:
      try:
        mail.send_mail(sender=users.get_current_user().email(),
                       to=recipients,
                       subject=subject,
                       body = body,
                       html = html,
                       attachments=[(title, outputStream.getvalue())])
        j=5
      except:
        j=j+1
        if j==3:
          self.response.headers['Content-Type'] = 'text/plain'
          self.response.out.write('0')
          # record who's doing what
          a = Activity(name=users.get_current_user().email(),
                       scriptName = entry.title.text,
                       resource_id = resource_id,
                       scriptSize = size,
                       fromPage = fromPage,
                       recipients = recipients,
                       numberRecipients = len(recipients),
                       error = 'emailing fail',
                       activity="email")
          a.put()
          self.response.headers['Content-Type'] = 'text/plain'
          self.response.out.write('not sent')
          return
    # record who's doing what
    a = Activity(name=users.get_current_user().email(),
                 scriptName = entry.title.text,
                 resource_id = resource_id,
                 scriptSize = size,
                 recipients = recipients,
                 triesBeforeSuccess = k,
                 fromPage = fromPage,
                 numberRecipients = len(recipients),
                 activity="email")
    a.put()
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.out.write('sent')
    

class NewScript (webapp.RequestHandler):
  def post(self):
      
    filename = self.request.get('filename')
    filename = filename.replace('%20', ' ')
    user=users.get_current_user().email()
    alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    resource_id=''
    for x in random.sample(alphabet,20):
      resource_id+=x

    q=db.GqlQuery("SELECT * FROM UsersScripts "+
                  "WHERE resource_id='"+resource_id+"'")
    results=q.fetch(2)

    while len(results)>0:
      resource_id=''
      for x in random.sample(alphabet,10):
        resource_id+=x
      q=db.GqlQuery("SELECT * FROM UsersScripts "+
                    "WHERE resource_id='"+resource_id+"'")
      results=q.fetch(2)
    
    s = ScriptData(resource_id=resource_id,
                   data='[["Fade In:",1],["Int. ",0]]',
                   version=1)
    s.put()

    u = UsersScripts(user=user,
                     title=filename,
                     resource_id=resource_id,
                     permission='owner')
    u.put()
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.out.write(resource_id)


class ConvertProcess (webapp.RequestHandler):
  def post(self):

    # New Script Setup
    filename = "Untitled"
    capture = self.request.get('filename')
    if capture:
      filename = capture.replace('%20', ' ')
    token=get_auth_token(self.request)
    client = gdata.docs.client.DocsClient()
    feed = client.GetDocList(uri='/feeds/default/private/full/-/folder', auth_token=token)
    i=0
    for entry in feed.entry:
       if entry.title.text == 'RawScripts':
          i=1
          location = entry
    if i==0:
      new_folder = client.Create(gdata.docs.data.FOLDER_LABEL, 'RawScripts', auth_token=token)
      location = new_folder
    doc = client.GetDoc('document%3A0AaXZx9SZPN4pZGhqaHhrdGJfMjY2Y2Q2Y3czaGg', auth_token=token)
    new_doc = client.Copy(doc, filename, auth_token=token)
    client.Move(new_doc, location, auth_token=token)


    # Format Celtx file
    celtx = StringIO.StringIO(self.request.get('script'))
    z = zipfile.ZipFile(celtx)
    zlist = z.namelist()
    i=0
    while i< len(zlist):
        b = zlist[i].split('ript')
        if len(b) > 1:
            script = zlist[i]
        i=i+1
    txt = z.read(script)
    headless= txt.split('<body>')[1]
    t=headless.split('</body>')[0]
    t = t.replace('<p class="action">', '<h2>')
    t = t.replace('<p class="character">', '<h3>')
    t = t.replace('<p class="dialog">', '<h4>')
    t = t.replace('<p class="transition">', '<h5>')
    t = t.replace('<p class="parenthetical">', '<h6>')
    t = t.replace('</span>', '')
    t = t.replace('(O.S)', '(o.s.)')
    t = t.replace('(o.s)', '(o.s.)')
    t = t.replace(' (cont)', '')
    t = t.replace(' (CONT)', '')
    t = t.replace('\n', ' ')
    t = t.replace('\r\n', " ")
    t = t.replace('<br>', '')
    t = t.replace('&nbsp;', '')
    pattern = re.compile(r'<span.*?>')
    xyz=0
    while xyz<50:
      t = re.sub(pattern, '', t)
      xyz=xyz+1
    parts = t.split('</p>')
    parts.pop()
    script=''
    i=0
    while i < len(parts):
      num = parts[i][3]
      if num == " ":
        sh = parts[i].split('ing">')[1]
        parts[i]= '<h1>' + sh +'</h1>'
        script = script+parts[i]
        i=i+1
      else:
        parts[i] = parts[i] + '</h' +num+'>'
        script = script + parts[i]
        i=i+1

    # Save formated thing to Google Docs
    header = """<div class="m"></div>"""
    script = header+script
    size = len(script)
    ms = gdata.data.MediaSource(file_handle=script, content_length=size, content_type='text/html')
    client.Update(new_doc, media_source=ms, auth_token=token, force=True)
    url = 'http://www.rawscripts.com/editor?resource_id=' + new_doc.resource_id.text

    template_values = { 'url': url }
    
    self.response.headers['Content-Type'] = 'text/html'
    path = os.path.join(os.path.dirname(__file__), 'UploadComplete.html')
    self.response.out.write(template.render(path, template_values))
    # Track what the user is doing
    a = Activity(name=users.get_current_user().email(),
                 scriptName = new_doc.title.text,
                 resource_id = new_doc.resource_id.text,
                 scriptSize = size,
                 activity="upload")
    a.put()


class Share (webapp.RequestHandler):
  def post(self):
    resource_id = self.request.get('resource_id')
    collaborators = self.request.get('collaborators')
    fromPage = self.request.get('fromPage')
    token=get_auth_token(self.request)
    collaborators = self.request.get('collaborators')
    collabList = collaborators.split(',')
    client = gdata.docs.client.DocsClient()
    entry = client.GetDoc(resource_id, auth_token=token)
    mobile = 0
    #Check if should send to mobile Page
    ua = self.request.user_agent
    props = da.getPropertiesAsTyped(tree, ua)
    if props.has_key('mobileDevice'):
      if props['mobileDevice']:
        path = os.path.join(os.path.dirname(__file__), 'MobileScriptlist.html')
        mobile = 1
    i=0
    addedCollabs=''
    while i<len(collabList):
      k=0
      while k<4:
        try:
          scope = gdata.acl.data.AclScope(value=collabList[i], type='user')
          role = gdata.acl.data.AclRole(value='reader')
          acl_entry = gdata.docs.data.Acl(scope=scope, role=role)
          new_acl = client.Post(acl_entry, entry.GetAclFeedLink().href, auth_token=token)
          s = ShareDB(resource_id=resource_id,
                    name=collabList[i],
                    fromPage=fromPage)
          s.put()
          k=5
          addedCollabs = addedCollabs+collabList[i] + ','
        except:
          k=k+1
      i=i+1
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.out.write(addedCollabs)
    
class RemoveAccess (webapp.RequestHandler):
  def post(self):
    token = get_auth_token(self.request)
    resource_id=self.request.get('resource_id')
    remove_person = self.request.get('removePerson')
    client = gdata.docs.client.DocsClient()
    acl_feed = client.GetAclPermissions(resource_id, auth_token=token)
    for acl in acl_feed.entry:
      if remove_person.lower() == acl.scope.value.lower():
        client.Delete(acl.GetEditLink().href, force=True, auth_token=token)
    q = db.GqlQuery("SELECT * FROM ShareDB "+
                          "WHERE resource_id='"+resource_id+"'")
    results = q.fetch(50)
    for p in results:
      if p.name.lower() == remove_person.lower():
        p.delete()
    logging.info(remove_person.lower())
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.out.write(remove_person.lower())

class GetShareList (webapp.RequestHandler):
  def post(self):
    token = get_auth_token(self.request)
    resource_id=self.request.get('resource_id')
    client = gdata.docs.client.DocsClient()
    acl_feed = client.GetAclPermissions(resource_id, auth_token=token)
    output = ''
    for acl in acl_feed.entry:
      if not acl.role.value == 'owner':
        output = output + '?user=' + acl.scope.value
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.out.write(output)

class PostNotes (webapp.RequestHandler):
  def post(self):
    user = self.request.get('user')
    resource_id = self.request.get('resource_id')
    data = self.request.get('data')

    q= db.GqlQuery("SELECT * FROM Notes "+
                   "WHERE resource_id='"+resource_id+"'"+
                   "AND user='"+user+"'")
    results = q.fetch(5)
    for p in results:
      p.delete()
    newNotes = Notes(user = user,
                     resource_id=resource_id,
                     data=data,)
    newNotes.put()


def main():
  application = webapp.WSGIApplication([('/scriptlist', ScriptList),
                                        ('/delete', Delete),
                                        ('/newscript', NewScript),
                                        ('/export', Export),
                                        ('/rename', Rename),
					('/emailscript', EmailScript),
                                        ('/convertprocess', ConvertProcess),
                                        ('/share', Share),
                                        ('/postnotes', PostNotes),
                                        ('/removeaccess', RemoveAccess),
                                        ('/getsharelist', GetShareList),
                                        ('/list', List),],
                                       debug=True)
  
  wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
  main()

