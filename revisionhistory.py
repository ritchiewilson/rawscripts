import StringIO
import os
import wsgiref.handlers
from google.appengine.api import users
from google.appengine.api import urlfetch
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
import api
import random
import datetime
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

class SpellingData (db.Model):
  resource_id = db.StringProperty()
  wrong = db.TextProperty()
  ignore = db.TextProperty()
  timestamp = db.DateTimeProperty(auto_now_add=True)

class DuplicateOldRevision(webapp.RequestHandler):
  def post(self):
    resource_id = self.request.get('resource_id')
    p = permission(resource_id)
    if not p==False:
      version = self.request.get('version')
      q=db.GqlQuery("SELECT * FROM ScriptData "+
                    "WHERE resource_id='"+resource_id+"' "+
                    "AND version="+version)
      results = q.fetch(2)
      data=results[0].data
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
                     version=int(version)+1,
                     autosave=0)
      s.put()
      d= DuplicateScripts(new_script = new_resource_id,
                          from_script = resource_id,
                          from_version=int(version))
      d.put()
      u = UsersScripts(user=user,
                       title='Copy of '+p,
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
      

class RevisionHistory(webapp.RequestHandler):
  def get(self):
    resource_id = self.request.get('resource_id')
    p = permission(resource_id)
    if not p==False:
      q = db.GqlQuery("SELECT * FROM ScriptData "+
                   "WHERE resource_id='"+resource_id+"' "+
                   "ORDER BY version DESC")
      r = q.fetch(1000)
      for i in r:
        i.updated=str(i.timestamp)[0:16]
        if i.autosave==0:
          i.s='manualsave'
        else:
          i.s='autosave'
      template_values={'r':r,
                       'title':p,
                       'resource_id':resource_id,
                       }
      path = os.path.join(os.path.dirname(__file__), 'revisionhistory.html')
      self.response.out.write(template.render(path, template_values))

class RevisionList(webapp.RequestHandler):
  def post(self):
    resource_id=self.request.get('resource_id')
    p=permission(resource_id)
    if not p==False:
      begining=False
      ids=[]
      new_script=resource_id
      while not begining:
        q=db.GqlQuery("SELECT * FROM DuplicateScripts "+
                      "WHERE new_script='"+new_script+"'")
        r=q.fetch(1)
        if len(r)==0:
          begining=True
        else:
          new_script=r[0].from_script
          ids.append([new_script, r[0].from_version])

      i=0
      out=[]
      version=str(ids[0][1]+1)
      while i<len(ids):
        logging.info(version)
        q=db.GqlQuery("SELECT * FROM ScriptData "+
                      "WHERE resource_id='"+ids[i][0]+"' "+
                      "AND version<"+version+" "+
                      "ORDER BY version DESC")
        r=q.fetch(1000)
        for e in r:
          e.updated=str(e.timestamp)[0:16]
          if e.autosave==0:
            e.s='manualsave'
          else:
            e.s='autosave'
          out.append([ids[i][0], e.updated, e.version, e.autosave])
        i+=1
        if not i==len(ids):
          version=str(ids[i][1]+1)
      j=simplejson.dumps(out)
      self.response.headers['Content-Type']= 'text/plain'
      self.response.out.write(j)

class GetVersion(webapp.RequestHandler):
  def post(self):
    resource_id=self.request.get('resource_id')
    p = permission(resource_id)
    if not p==False:
      version = self.request.get('version')
      if version =='latest':
        q = db.GqlQuery("SELECT * FROM ScriptData "+
                        "WHERE resource_id='"+resource_id+"' "
                        "ORDER BY version DESC")
        r=q.fetch(2)
      else:
        q = db.GqlQuery("SELECT * FROM ScriptData "+
                        "WHERE version="+version+" "+
                        "AND resource_id='"+resource_id+"'")
        r=q.fetch(2)
      J = simplejson.loads(r[0].data)
      v = ['s','a','c','d','p','t']
      contents=''
      for i in J:
        contents+='<p class="'+v[i[1]]+'">'+i[0]+"</p>"
      self.response.headers['Content-Type']='text/plain'
      self.response.out.write(contents)

class CompareVersions(webapp.RequestHandler):
  def post(self):
    import difflib

    resource_id=self.request.get('resource_id')
    title=permission(resource_id)
    if not title==False:
      version_one = self.request.get('version_one')
      version_two = self.request.get('version_two')
      q = db.GqlQuery("SELECT * FROM ScriptData "+
                      "WHERE version="+version_one+" "+
                      "AND resource_id='"+resource_id+"'")
      r_one=q.fetch(2)
      q = db.GqlQuery("SELECT * FROM ScriptData "+
                      "WHERE version="+version_two+" "+
                      "AND resource_id='"+resource_id+"'")
      r_two=q.fetch(2)

      v = ['s','a','c','d','p','t']

      j_one = simplejson.loads(r_one[0].data)
      s_one=StringIO.StringIO()
      for i in j_one:
        s_one.write('<p class="'+v[i[1]]+'">'+i[0]+"</p>\n")
      j_two = simplejson.loads(r_two[0].data)
      s_two=StringIO.StringIO()
      for i in j_two:
        s_two.write('<p class="'+v[i[1]]+'">'+i[0]+"</p>\n")

      text1=s_one.splitLines()
      text2=s_two.splitlines()
      s_one.close()
      s_two.close()

      d=difflib.Differ()
      result = list(d.compare(text1,text2))
      content=StringIO.StringIO()
      for i in result:
          if i[0]=='+':
              content.write(i[2:14]+'<ins>'+i[14:len(i)-5]+'</ins>'+i[len(i)-5:len(i)])
          elif i[0]=='-':
              content.write(i[2:14]+'<del>'+i[14:len(i)-5]+'</del>'+i[len(i)-5:len(i)])
          elif not i[0]=='?':
              content.write(i[2:len(i)])
      logging.info(content.getvalue())
      self.response.headers['Content-Type']='text/html'
      self.response.out.write(text1)

def main():
  application = webapp.WSGIApplication([('/revisionhistory', RevisionHistory),
                                        ('/revisionget', GetVersion),
                                        ('/revisionlist', RevisionList),
                                        ('/revisionduplicate', DuplicateOldRevision),
                                        ('/revisioncompare', CompareVersions)],
                                       debug=True)
  
  wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
  main()

