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

class DuplicateOldRevision(webapp.RequestHandler):
  def post(self):
    resource_id = self.request.get('resource_id')
    p = permission(resource_id)
    if not p==False:
      version = self.request.get('version')
      

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
                       }
      path = os.path.join(os.path.dirname(__file__), 'revisionhistory.html')
      self.response.out.write(template.render(path, template_values))

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
                                        ('/revisionduplicate', DuplicateOldRevision),
                                        ('/revisioncompare', CompareVersions)],
                                       debug=True)
  
  wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
  main()

