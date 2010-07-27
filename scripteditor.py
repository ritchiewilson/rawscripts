import StringIO
import os
import re
import wsgiref.handlers
from google.appengine.api import users
from google.appengine.api import mail
from google.appengine.api import urlfetch
from google.appengine.api.labs import taskqueue
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
    if i.permission=='owner' or i.permission=='ownerDeleted':
      if i.user==users.get_current_user().email().lower():
        p=i.title
  return p

class SpellingData (db.Model):
  resource_id = db.StringProperty()
  wrong = db.TextProperty()
  ignore = db.TextProperty()
  timestamp = db.DateTimeProperty(auto_now_add=True)

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
  export = db.StringProperty()
  tag = db.StringProperty()

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
  from_version = db.IntegerProperty()

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

class TitlePage(webapp.RequestHandler):
  def get(self):
    resource_id=self.request.get('resource_id')
    if resource_id=="Demo":
      p="Duck Soup"
    else:
      p = permission(resource_id)
    if p==False:
      return

    if resource_id!="Demo":
      template_values = { 'sign_out': users.create_logout_url('/') }
      template_values['user'] = users.get_current_user().email()

    q= db.GqlQuery("SELECT * FROM TitlePageData "+
                   "WHERE resource_id='"+resource_id+"'")
    results = q.fetch(5)
    logging.info(resource_id)
    
    if not len(results)==0:
      r=results[0]
      template_values = {'title' : r.title,
                         'authorOne' : r.authorOne,
                         'authorTwo' : r.authorTwo,
                         'authorTwoChecked' : r.authorTwoChecked,
                         'authorThree' : r.authorThree,
                         'authorThreeChecked': r.authorThreeChecked,
                         'based_on' : r.based_on.replace("LINEBREAK", '\n'),
                         'based_onChecked' : r.based_onChecked,
                         'address' : r.address.replace("LINEBREAK", '\n'),
                         'addressChecked' : r.addressChecked,
                         'phone' : r.phone,
                         'phoneChecked' : r.phoneChecked,
                         'cell' : r.cell,
                         'cellChecked' : r.cellChecked,
                         'email' : r.email,
                         'emailChecked' :r.emailChecked,
                         'registered': r.registered,
                         'registeredChecked' : r.registeredChecked,
                         'other' : r.other,
                         'otherChecked' : r.otherChecked}
    else:
      q = db.GqlQuery("SELECT * FROM UsersScripts "+
                      "WHERE resource_id='"+resource_id+"'")
      results=q.fetch(5)

      template_values = {'title' : results[0].title,
                         'authorOne' : users.get_current_user().nickname(),
                         'authorTwo' : "",
                         'authorTwoChecked' : "",
                         'authorThree' : "",
                         'authorThreeChecked': "",
                         'based_on' : "",
                         'based_onChecked' : "",
                         'address' : "",
                         'addressChecked' : "",
                         'phone' : "",
                         'phoneChecked' : "",
                         'cell' : "",
                         'cellChecked' : "",
                         'email' : users.get_current_user().email(),
                         'emailChecked' : "checked",
                         'registered': "",
                         'registeredChecked' : "",
                         'other' : "",
                         'otherChecked' : ""}
      

    path = os.path.join(os.path.dirname(__file__), 'titlepage.html')

    self.response.headers['Content-Type'] = 'text/html'
    self.response.out.write(template.render(path, template_values))

class SaveTitlePage (webapp.RequestHandler):
  def post(self):
    resource_id=self.request.get('resource_id')
    logging.info(resource_id)
    title = permission(resource_id)
    if not title==False:
      q= db.GqlQuery("SELECT * FROM TitlePageData "+
                     "WHERE resource_id='"+resource_id+"'")
      results = q.fetch(5)
      if not len(results)==0:
        i=results[0]

      else:
        i = TitlePageData()
        
      i.resource_id= resource_id
      i.title = self.request.get('title')
      i.authorOne = self.request.get('authorOne')
      i.authorTwo = self.request.get('authorTwo')
      i.authorTwoChecked = self.request.get('authorTwoChecked')
      i.authorThree = self.request.get('authorThree')
      i.authorThreeChecked = self.request.get('authorThreeChecked')
      i.based_on = self.request.get('based_on')
      i.based_onChecked = self.request.get('based_onChecked')
      i.address = self.request.get('address')
      i.addressChecked = self.request.get('addressChecked')
      i.phone = self.request.get('phone')
      i.phoneChecked = self.request.get('phoneChecked')
      i.cell = self.request.get('cell')
      i.cellChecked = self.request.get('cellChecked')
      i.email = self.request.get('email')
      i.emailChecked = self.request.get('emailChecked')
      i.registered = self.request.get('registered')
      i.registeredChecked = self.request.get('registeredChecked')
      i.other = self.request.get('other')
      i.otherChecked = self.request.get('otherChecked')
      i.put()

      self.response.headers['Content-Type']='text/plain'
      self.response.out.write('1')

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
                   "AND permission='owner' "+
                   "ORDER BY updated DESC")
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

    owned = []
    for i in results:
      owned.append([i.resource_id, i.title, i.updated, i.permission])

    q= db.GqlQuery("SELECT * FROM UsersScripts "+
                   "WHERE user='"+users.get_current_user().email().lower()+"' "+
                   "AND permission='ownerDeleted' "+
                   "ORDER BY updated DESC")
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
    ownedDeleted=[]
    for i in results:
      ownedDeleted.append([i.resource_id, i.title, i.updated, i.permission])

    pl=[owned, ownedDeleted]
    
    j = simplejson.dumps(pl)
    self.response.headers['Content-Type']='text/plain'
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
          i.permission='collabDeletedByOwner'
          i.put()
      self.response.headers['Content-Type']='text/plain'
      self.response.out.write('1')
    else:
      self.response.headers['Content-Type']='text/plain'
      self.response.out.write('0')
    
class Undelete(webapp.RequestHandler):
  def post(self):
    resource_id = self.request.get('resource_id')
    title= permission(resource_id)
    if not title==False:
      q = db.GqlQuery("SELECT * FROM UsersScripts "+
                      "WHERE resource_id='"+resource_id+"'")
      results = q.fetch(1000)
      for i in results:
        if i.permission=='ownerDeleted':
          i.permission='owner'
          i.put()
        elif i.permission=='collabDeletedByOwner':
          i.permission='collab'
          i.put()
      self.response.headers['Content-Type']='text/plain'
      self.response.out.write('1')
    else:
      self.response.headers['Content-Type']='text/plain'
      self.response.out.write('0')

class HardDelete(webapp.RequestHandler):
  def post(self):
    resource_id = self.request.get('resource_id')
    title = permission(resource_id)
    if not title==False:
      q = db.GqlQuery("SELECT * FROM UsersScripts "+
                      "WHERE resource_id='"+resource_id+"'")
      r = q.fetch(500)

      for i in r:
        i.permission = 'hardDelete'
        i.put()

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
    title_page = self.request.get('title_page')
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
          newfile = export.Text(data, str(title), title_page, resource_id)
          filename = 'filename=' + str(title) + '.txt'  
          self.response.headers['Content-Type'] = 'text/plain'
        elif export_format=='pdf':
          newfile = export.Pdf(data, str(title), title_page, resource_id)
          filename = 'filename=' + str(title) + '.pdf'
          self.response.headers['Content-Type'] = 'application/pdf'

        J = simplejson.loads(results[0].export)
        arr=[export_format, str(datetime.datetime.today())]
        J[1].append(arr)
        results[0].export=simplejson.dumps(J)
        results[0].put()

        self.response.headers['Content-Disposition'] = 'attachment; ' +filename
        self.response.out.write(newfile.getvalue())
  
class EmailScript (webapp.RequestHandler):
  def post(self):
    fromPage = self.request.get('fromPage')
    resource_id = self.request.get('resource_id')
    title_page = self.request.get('title_page')

    p=permission(resource_id)
    if p==False:
      logging.info(resource_id)
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
    newfile = export.Pdf(data, str(title), title_page, resource_id)
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
    J = simplejson.loads(results[0].export)
    t=str(datetime.datetime.today())

    for recipient in recipients:
      J[0].append([recipient, t])
    results[0].export=simplejson.dumps(J)
    results[0].put()
   
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
                   version=1,
                   export='[[],[]]',
                   tag='',
                   autosave=0)
    s.put()

    s = SpellingData(resource_id=resource_id,
                   wrong='[]',
                   ignore="[]")
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
                     version=version+1,
                     export="[[],[]]",
                     tag=""
                     autosave=0)
      s.put()
      d= DuplicateScripts(new_script = new_resource_id,
                          from_script = resource_id,
                          from_version=version)

      d.put()
      u = UsersScripts(user=user,
                       title='Copy of '+title,
                       resource_id=new_resource_id,
                       updated = str(datetime.datetime.today()),
                       permission='owner')
      u.put()
      q=db.GqlQuery("SELECT * FROM SpellingData "+
                    "WHERE resource_id='"+resource_id+"'")
      r=q.fetch(2)
      s= SpellingData(resource_id=new_resource_id,
                      wrong=r[0].wrong,
                      ignore=r[0].ignore)
      s.put()
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
    elif ff=='html':
      myparser = MyParser()
      myparser.parse(data.read())
      l = myparser.get_hyperlinks()
      i=0
      while i<len(l):
        if l[i][0]=='':
          l.pop(i)
        else:
          i+=1
      i=0
      while i<len(l):
        if l[i][1]==7:
          l.pop(i)
          l.pop(i)
          l[i-1][0]=l[i-1][0]+" "+l[i][0]
          l.pop(i)
        else:
          i+=1
      contents = simplejson.dumps(l)
    else:
      contents = convert.Celtx(data)
    

    s = ScriptData(resource_id=resource_id,
                   data=contents,
                   version=1,
                   tag="",
                   export="[[],[]]",
                   autosave=0)
    s.put()

    u = UsersScripts(user=user,
                     title=filename,
                     resource_id=resource_id,
                     updated = str(datetime.datetime.today()),
                     permission='owner')
    u.put()
    

    template_values = { 'url': resource_id }

    taskqueue.add(url="/spellcheckbigscript", params= {'resource_id' : resource_id})
    
    self.response.headers['Content-Type'] = 'text/html'
    path = os.path.join(os.path.dirname(__file__), 'UploadComplete.html')
    self.response.out.write(template.render(path, template_values))
    

import sgmllib

class MyParser(sgmllib.SGMLParser):
    "A simple parser class."
    def parse(self, s):
        "Parse the given string 's'."
        self.feed(s)
        self.close()

    def __init__(self, verbose=0):
        "Initialise an object, passing 'verbose' to the superclass."

        sgmllib.SGMLParser.__init__(self, verbose)
        self.hyperlinks = []
        self.startT = None

    def handle_data(self, data):
        if self.startT is not None:
            data = data.replace('\r\n','').replace('\n','')
            data= data.strip()
            self.hyperlinks.append([data, self.startT])
        
    def start_h1(self, attributes):
        self.startT=0
    def start_h2(self, attributes):
        self.startT=1
    def start_h3(self, attributes):
        if len(attributes)!=0 and attributes[0][1]=='more':
            self.startT=7
        else:
            self.startT=2
    def start_h4(self, attributes):
        self.startT=3
    def start_h5(self, attributes):
        if len(attributes)!=0 and attributes[0][1]=='pn':
            self.startT=None
        else:
           self.startT=4 
    def start_h6(self, attributes):
        self.startT=5
    def start_div(self, attributes):
        self.startT=None
    def start_span(self, attributes):
        self.startT=None

    def get_hyperlinks(self):
        "Return the list of hyperlinks."
        return self.hyperlinks
    
class GetVersion(webapp.RequestHandler):
  def post(self):
    resource_id=self.request.get('resource_id')
    p = permission(resource_id)
    if not p==False:
      version = self.request.get('version')
      logging.info(version)
      q = db.GqlQuery("SELECT * FROM ScriptData "+
                      "WHERE version="+version+" "
                      "AND resource_id='"+resource_id+"'")
      r=q.fetch(2)
      self.response.headers['Content-Type']='text/plain'
      self.response.out.write(r[0].data)

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
                                        ('/harddelete', HardDelete),
                                        ('/undelete', Undelete),
                                        ('/newscript', NewScript),
                                        ('/duplicate', Duplicate),
                                        ('/export', Export),
                                        ('/rename', Rename),
					('/emailscript', EmailScript),
                                        ('/convertprocess', ConvertProcess),
                                        ('/share', Share),
                                        ('/postnotes', PostNotes),
                                        ('/removeaccess', RemoveAccess),
                                        ('/titlepage', TitlePage),
                                        ('/titlepagesave', SaveTitlePage),
                                        ('/getsharelist', GetShareList),
                                        ('/list', List),],
                                       debug=True)
  
  wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
  main()

