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

class ShareNotify (db.Model):
	user= db.StringProperty()
	resource_id = db.StringProperty()
	timeshared = db.DateTimeProperty()
	timeopened = db.DateTimeProperty()
	opened = db.BooleanProperty()
	
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
	last_updated = db.DateTimeProperty()
	updated = db.StringProperty()
	permission = db.StringProperty()
	folder = db.StringProperty()

class Users (db.Model):
	name = db.StringProperty()
	firstUse = db.DateTimeProperty(auto_now_add=True)
		
class Stats(webapp.RequestHandler):
	def get(self):
		q=db.GqlQuery("SELECT * FROM Users")
		r=q.fetch(1000)
		num_users=len(r)
		users_scripts=[]
		i=0
		while i < len(r):
			user=[r[i].name]
			user_data=[]
			q=db.GqlQuery("SELECT * FROM UsersScripts "+
							"WHERE user='"+r[i].name+"' "+
							"AND permission='owner'")
			u=q.fetch(1000)
			j=0
			while j < len(u):
				q=db.GqlQuery("SELECT * FROM ScriptData "+
								"WHERE resource_id='"+u[j].resource_id+"' "+
								"ORDER BY version DESC")
				d=q.fetch(1)
				user_data.append([u[j].title,len(d[0].data)])
				j+=1
			user.append(user_data)
			users_scripts.append(user)
			i+=1
				
		template_values= { 'users_scripts': simplejson.dumps(users_scripts) }
		path = os.path.join(os.path.dirname(__file__), 'stats.html')
		self.response.headers['Content-Type'] = 'text/html'
		self.response.out.write(template.render(path, template_values))
		

def main():
	application = webapp.WSGIApplication([('/stats', Stats)],
																			 debug=True)
	
	wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
	main()

