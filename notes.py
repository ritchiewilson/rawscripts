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
    if i.permission=='owner' or i.permission=="collab":
      if i.user==users.get_current_user().email().lower():
        p=i.title
  return p

def ownerPermission (resource_id):
  q = db.GqlQuery("SELECT * FROM UsersScripts "+
                  "WHERE resource_id='"+resource_id+"'")
  results = q.fetch(1000)
  p=False
  for i in results:
    if i.permission=='owner':
      if i.user==users.get_current_user().email().lower():
        p=i.title
  return p

class Notes (db.Model):
  resource_id = db.StringProperty()
  thread_id=db.StringProperty()
  updated = db.DateTimeProperty(auto_now_add=True)
  data = db.TextProperty()
  row = db.IntegerProperty()
  col = db.IntegerProperty()


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

class DuplicateScripts (db.Model):
  new_script = db.StringProperty()
  from_script = db.StringProperty()
  from_version = db.IntegerProperty()

class SpellingData (db.Model):
  resource_id = db.StringProperty()
  wrong = db.TextProperty()
  ignore = db.TextProperty()
  timestamp = db.DateTimeProperty(auto_now_add=True)

class NewThread(webapp.RequestHandler):
  def post(self):
    resource_id=self.request.get('resource_id')
    if resource_id=="Demo":
      return
    p = permission(resource_id)
    if not p==False:
      user=users.get_current_user().email()
      row = self.request.get('row')
      col = self.request.get('col')
      thread_id = self.request.get('thread_id')
      content = self.request.get('content')
      d = str(datetime.datetime.today())
      arr = [[content, user, d]]
      data = simplejson.dumps(arr)
      n=Notes(resource_id=resource_id,
              thread_id=thread_id,
              data=data,
              row=int(row),
              col=int(col))
      n.put()
      self.response.headers["Content-Type"]="text/plain"
      self.response.out.write('sent')
              
class SubmitMessage(webapp.RequestHandler):
  def post(self):
    resource_id=self.request.get('resource_id')
    if resource_id=="Demo":
      return
    p = permission(resource_id)
    if not p==False:
      user=users.get_current_user().email()
      thread_id = self.request.get('thread_id')
      content = self.request.get('content')
      logging.info(content)
      d = str(datetime.datetime.today())

      q = db.GqlQuery("SELECT * FROM Notes "+
                   "WHERE resource_id='"+resource_id+"' "+
                   "AND thread_id='"+thread_id+"'")
      r=q.fetch(1)
      J = simplejson.loads(r[0].data)
      J.append([content,user,d])
      r[0].data=simplejson.dumps(J)
      r[0].put()

      self.response.headers["Content-Type"]="text/plain"
      self.response.out.write('sent')

class Position (webapp.RequestHandler):
	def post(self):
		resource_id=self.request.get('resource_id')
		if resource_id=="Demo":
			return
		p = ownerPermission(resource_id)
		if not p==False:
			positions = self.request.get('positions')
			J = simplejson.loads(positions)
			for i in J:
				q=db.GqlQuery("SELECT * FROM Notes "+
							"WHERE resource_id='"+resource_id+"' "+
							"AND thread_id='"+str(i[2])+"'")
				r=q.fetch(1)
				r[0].row  = i[0]
				r[0].col = i[1]
				r[0].put()
			self.response.headers["Content-type"]="plain/text"
			self.response.out.write('1')


class DeleteThread (webapp.RequestHandler):
	def post(self):
  		resource_id=self.request.get('resource_id')
  		if resource_id=="Demo":
			return
		p = ownerPermission(resource_id)
		logging.info(p)
		if not p==False:
			thread_id = self.request.get('thread_id')
			logging.info(thread_id)
			q=db.GqlQuery("SELECT * FROM Notes "+
						"WHERE resource_id='"+resource_id+"' "+
						"AND thread_id='"+thread_id+"'")
			r=q.fetch(1)
			r[0].delete()

class ViewNotes(webapp.RequestHandler):
	def get(self):
		resource_id=self.request.get('resource_id')
		if resource_id=="Demo":
			return
		title = permission(resource_id)
		if not title==False:
			f = ownerPermission(resource_id)
			q = db.GqlQuery("SELECT * FROM Notes "+
							"WHERE resource_id='"+resource_id+"'")
			r=q.fetch(500)
			export=[]
			for i in r:
				export.append([i.row, i.col, simplejson.loads(i.data), i.thread_id])
				
			template_values={'j':simplejson.dumps(export),
			 				"user":users.get_current_user().email(),
							"sign_out": users.create_logout_url("/"),
							"title":title,
							"f":f
							}
			path = os.path.join(os.path.dirname(__file__), 'MobileViewNotes.html')
			self.response.out.write(template.render(path, template_values))

def main():
  application = webapp.WSGIApplication([('/notessubmitmessage', SubmitMessage),
                                        ('/notesposition', Position),
                                        ('/notesdeletethread', DeleteThread),
										('/notesview', ViewNotes),
                                        ('/notesnewthread', NewThread)],
                                       debug=True)
  
  wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
  main()

