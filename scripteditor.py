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
import datetime
import api
import random
import export
import convert
import logging
from django.utils import simplejson

# instantiate API and read in the JSON
TREEFILE = 'DeviceAtlas.json'
da = api.DaApi()
tree = da.getTreeFromFile(TREEFILE)


def permission (resource_id):
  q = db.GqlQuery("SELECT * FROM UsersScripts "+
                  "WHERE resource_id='"+resource_id+"'")
  results = q.fetch(1000)
  p=False
  for i in results:
    if i.permission=='owner':
      if i.user==users.get_current_user().email().lower():
        p=i.title
  return p

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

class DuplicateScripts (db.Model):
  new_script = db.StringProperty()
  from_script = db.StringProperty()

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

    now = datetime.datetime.today()
    for i in results:
      t=str(i.updated)
      date=t.split(' ')[0]
      time=t.split(' ')[1]
      year=date.split('-')[0]
      month=date.split('-')[1]
      day=date.split('-')[2]
      if not int(year)<now.year:
        if not int(month)<now.month:
          if not int(day)<now.day:
            hour=time.split(':')[0]
            minute=time.split(':')[1]
            if not int(hour)<now.hour:
              if not int(minute)<now.minute:
                i.updated="Seconds Ago"
              else:
                diff=now.minute-int(minute)
                if diff==1:
                  i.updated="1 minute ago"
                else:
                  i.updated=str(diff)+" minutes ago"
            else:
              diff=now.hour-int(hour)
              if diff==1:
                i.updated="1 hour ago"
              else:
                i.updated=str(diff)+" hours ago"
          else:
            diff=now.day-int(day)
            if diff==1:
              i.updated="Yesterday"
            else:
              i.updated=str(diff)+" days ago"
        else:
          diff=now.month-int(month)
          if diff==1:
            i.updated="1 month ago"
          else:
            i.updated=str(diff)+" months ago"
      else:
        diff=now.year-int(year)
        if diff==1:
          i.updated="last year"
        else:
          i.updated=str(diff)+" years ago"

    pl = []
    for i in results:
      pl.append([i.resource_id, i.title, i.updated])

    j = simplejson.dumps(pl)
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
    resource_id = self.request.get('resource_id')
    export_format = self.request.get('export_format')
    user=users.get_current_user().email().lower()
    if resource_id:
      q=db.GqlQuery("SELECT * FROM UsersScripts "+
                    "WHERE resource_id='"+resource_id+"'")
      results = q.fetch(500)
      p=False
      for i in results:
        if i.user==user:
          if i.permission=='owner':
            p=True
            title=i.title
      if p==True:
        q=db.GqlQuery("SELECT * FROM ScriptData "+
                      "WHERE resource_id='"+resource_id+"' "+
                      "ORDER BY version DESC")
        results = q.fetch(1000)
        data=results[0].data
        
        if export_format =='txt':
          newfile = export.Text(data)
          filename = 'filename=' + str(title) + '.txt'  
          self.response.headers['Content-Type'] = 'text/plain'
        elif export_format=='pdf':
          newfile = export.Pdf(data, str(title))
          filename = 'filename=' + str(title) + '.pdf'
          self.response.headers['Content-Type'] = 'application/pdf'

        self.response.headers['Content-Disposition'] = 'attachment; ' +filename
        self.response.out.write(newfile.getvalue())
  
class EmailScript (webapp.RequestHandler):
  def post(self):
    fromPage = self.request.get('fromPage')
    resource_id = self.request.get('resource_id')

    p=permission(resource_id)
    if p==False:
      return
    else:      
      subject=self.request.get('subject')
      body_message=self.request.get('body_message')
      result = urlfetch.fetch("http://www.rawscripts.com/text/email.txt")
      htmlbody = result.content
      html = htmlbody.replace("FILLERTEXT", body_message)
      body = body_message + """


  --- This Script written and sent from RawScripts.com. Check it out---"""
    
    # Make Recipient list instead of just one
    recipients=self.request.get('recipients').split(',')
    title = p
    q=db.GqlQuery("SELECT * FROM ScriptData "+
                  "WHERE resource_id='"+resource_id+"' "+
                  "ORDER BY version DESC")
    results = q.fetch(1000)
    data=results[0].data
    newfile = export.Pdf(data, str(title))
    filename=title+'.pdf'

    

    #Mail the damn thing. Itereating to reduce userside errors
    j=0
    while j<3:
      try:
        mail.send_mail(sender=users.get_current_user().email(),
                       to=recipients,
                       subject=subject,
                       body = body,
                       html = html,
                       attachments=[(filename, newfile.getvalue())])
        j=5
      except:
        j=j+1
        if j==3:
          self.response.headers['Content-Type'] = 'text/plain'
          self.response.out.write('not sent')
          return
   
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
      for x in random.sample(alphabet,20):
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
                     updated = str(datetime.datetime.today()),
                     permission='owner')
    u.put()
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.out.write(resource_id)

class Duplicate (webapp.RequestHandler):
  def post(self):
    resource_id = self.request.get('resource_id')
    title = permission(resource_id)
    if not title==False:
      q=db.GqlQuery("SELECT * FROM ScriptData "+
                    "WHERE resource_id='"+resource_id+"' "+
                    "ORDER BY version DESC")
      results = q.fetch(1000)
      data=results[0].data
      version=results[0].version
      user=users.get_current_user().email()
      alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      new_resource_id=''
      for x in random.sample(alphabet,20):
        new_resource_id+=x

      q=db.GqlQuery("SELECT * FROM UsersScripts "+
                    "WHERE resource_id='"+new_resource_id+"'")
      results=q.fetch(2)

      while len(results)>0:
        new_resource_id=''
        for x in random.sample(alphabet,20):
          new_resource_id+=x
        q=db.GqlQuery("SELECT * FROM UsersScripts "+
                      "WHERE resource_id='"+new_resource_id+"'")
        results=q.fetch(2)
      
      s = ScriptData(resource_id=new_resource_id,
                     data=data,
                     version=version+1)
      s.put()
      d= DuplicateScripts(new_script = new_resource_id,
                          from_script = resource_id)
      d.put()
      u = UsersScripts(user=user,
                       title='Copy of '+title,
                       resource_id=new_resource_id,
                       updated = str(datetime.datetime.today()),
                       permission='owner')
      u.put()
      self.response.headers['Content-Type'] = 'text/plain'
      self.response.out.write('/editor?resource_id='+new_resource_id)
      
    
class ConvertProcess (webapp.RequestHandler):
  def post(self):

    # New Script Setup
    filename = "Untitled"
    ff = self.request.get('ff')
    logging.info(ff)
    capture = self.request.get('filename')
    if capture:
      filename = capture.replace('%20', ' ')
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

    # Format file
    data = StringIO.StringIO(self.request.get('script'))
    if ff=='txt':
      contents = convert.Text(data)
    else:
      contents = convert.Celtx(data)
    

    s = ScriptData(resource_id=resource_id,
                   data=contents,
                   version=1)
    s.put()

    u = UsersScripts(user=user,
                     title=filename,
                     resource_id=resource_id,
                     updated = str(datetime.datetime.today()),
                     permission='owner')
    u.put()
    

    template_values = { 'url': resource_id }
    
    self.response.headers['Content-Type'] = 'text/html'
    path = os.path.join(os.path.dirname(__file__), 'UploadComplete.html')
    self.response.out.write(template.render(path, template_values))
    


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
                                        ('/duplicate', Duplicate),
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

