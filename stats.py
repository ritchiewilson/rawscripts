import wsgiref.handlers
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
import logging
from django.utils import simplejson
import activity
import os
class Notes (db.Model):
	resource_id = db.StringProperty()
	thread_id=db.StringProperty()
	updated = db.DateTimeProperty(auto_now_add=True)
	data = db.TextProperty()
	row = db.IntegerProperty()
	col = db.IntegerProperty()
	
class NotesNotify (db.Model):
	resource_id = db.StringProperty()
	thread_id = db.StringProperty()
	user = db.StringProperty()
	new_notes= db.IntegerProperty()

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

class Users (db.Model):
	name = db.StringProperty()
	firstUse = db.DateTimeProperty(auto_now_add=True)
		
class Stats(webapp.RequestHandler):
	def get(self):
		q=db.GqlQuery("SELECT * FROM Users")
		r=q.fetch(1000)
		num_users=len(r)
		users_scripts=[]
		logging.info(len(r))
		for i in r:
			q=db.GqlQuery("SELECT * FROM UsersScripts "+
							"WHERE user='"+i.name+"' "+
							"AND permission='owner'")
			u=q.fetch(500)
			logging.info(len(u))
			users_scripts.append(len(u))
		template_values= { 'users_scripts': users_scripts }
		path = os.path.join(os.path.dirname(__file__), 'stats.html')
		self.response.headers['Content-Type'] = 'text/html'
		self.response.out.write(template.render(path, template_values))
		

def main():
	application = webapp.WSGIApplication([('/stats', Stats)],
																			 debug=True)
	
	wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
	main()

