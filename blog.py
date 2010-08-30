import StringIO
import os
import string
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
from django.utils import feedgenerator
import activity

class BlogDB (db.Model):
	data = db.TextProperty()
	title = db.StringProperty()
	timestamp = db.DateTimeProperty(auto_now_add=True)

class Blog(webapp.RequestHandler):
	def get(self):
		uri = self.request.path_info[1:]
		error_message = ""
		if "/" in uri:
			key = uri.split("/")[1].replace("-"," ").title().replace(" ","-")
			r = db.get(db.Key.from_path('BlogDB', key))
			if r==None:
				r=[]
				error_message="""
				<div id="pitch">
				<h1>Error:</h1>
				<p>Sorry, that blog post could not be found. 
				Go to to <a href="http://www.rawscripts.com/blog">www.rawscripts.com/blog</a> and see if you can't find what you're looking for there.</p>
				</div>
				"""
			else:
				r=[r]
		else:	
			q = db.GqlQuery("SELECT * FROM BlogDB "+
							"order by timestamp desc")
			r = q.fetch(10)
		template_values = { "r": r,
							"error_message" : error_message}
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
		data = self.request.get('data')
		exclude = set(string.punctuation)
		key_name = ''.join(ch for ch in title if ch not in exclude)
		key_name = key_name.title().replace(" ","-")
		b = BlogDB(key_name = key_name,
					title = title,
					data = data)
		b.put()
		self.redirect("/blog")

class RSS(webapp.RequestHandler):
	def get(self):
		feed = feedgenerator.Atom1Feed(
			title = "RawScripts.com",
			link = "http://www.rawscripts.com/rss",
			description = "Regular updates and info for RawScripts.com")
		q = db.GqlQuery("SELECT * FROM BlogDB ORDER BY timestamp desc")
		r = q.fetch(50)
		exclude = set(string.punctuation)
		for i in r:
			link = "http://www.rawscripts.com/blog/"+''.join(ch for ch in i.title if ch not in exclude).title().replace(" ","-")
			feed.add_item(title=i.title, description=i.data, pubdate = i.timestamp, link = link)
		self.response.headers['Content-Type'] = 'text/xml'
		self.response.out.write(feed.writeString('utf-8'))
		
class BlogDataMigrate(webapp.RequestHandler):
	def get(self):
		q = db.GqlQuery("SELECT * FROM BlogDB ORDER BY timestamp desc")
		r = q.fetch(50)
		for i in r:
			parts = i.date.split("/")
			day = int(parts[0])
			month = int(parts[1])
			year = int(parts[2])+2000
			timestamp = datetime.datetime(year, month, day, 12, 0, 0, 0)
			exclude = set(string.punctuation)
			key_name = ''.join(ch for ch in i.title if ch not in exclude).title().replace(" ","-")
			
			b = BlogDB(title = i.title,
						data = i.data,
						timestamp = timestamp)
			b.put()
			i.delete()
		self.response.out.write("out")

def main():
	application = webapp.WSGIApplication([('/blogpostgui', BlogPostGUI),
											('/blogpost', BlogPost),
											('/blogdatamigrate', BlogDataMigrate),
											('/blog+.*', Blog),
											('/rss', RSS)],
											 debug=True)
	
	wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
	main()

