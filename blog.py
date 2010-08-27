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
import activity

class BlogDB (db.Model):
	data = db.TextProperty()
	title = db.StringProperty()
	date = db.StringProperty()
	timestamp = db.DateTimeProperty(auto_now_add=True)

class Blog(webapp.RequestHandler):
	def get(self):
		q = db.GqlQuery("SELECT * FROM BlogDB "+
						"order by timestamp desc")
		r = q.fetch(1000)
		template_values = { "r": r}
		path = os.path.join(os.path.dirname(__file__), 'blog.html')
		self.response.out.write(template.render(path, template_values))
							
class BlogPostGUI(webapp.RequestHandler):
	def get(self):
		path = os.path.join(os.path.dirname(__file__), 'blogpostgui.html')
		template_values = {}
		self.response.out.write(template.render(path, template_values))

class BlogPost (webapp.RequestHandler):
	def post(self):
		user = users.get_current_user()
		title = self.request.get('title')
		date = self.request.get('date')
		data = self.request.get('data')
		b = BlogDB(title = title,
					date = date,
					data = data)
		b.put()
		self.redirect("/blog")

def main():
	application = webapp.WSGIApplication([('/blog', Blog),
											('/blogpostgui', BlogPostGUI),
											('/blogpost', BlogPost)],
											 debug=True)
	
	wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
	main()

