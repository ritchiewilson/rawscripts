# Rawscripts - Screenwriting Software
# Copyright (C) Ritchie Wilson
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

import StringIO
import string
import wsgiref.handlers
from google.appengine.api import users
from google.appengine.api import urlfetch
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
import random
import datetime
import logging
from django.utils import simplejson
from django.utils import feedgenerator
import config
import models

from utils import get_template_path


class Blog(webapp.RequestHandler):
	def get(self):
		uri = self.request.path_info[1:]
		error_message = ""
		if "/" in uri:
			key = uri.split("/")[1].replace("-"," ").title().replace(" ","-")
			if key=="":
				q = db.GqlQuery("SELECT * FROM BlogDB "+
								"order by timestamp desc")
				r = q.fetch(20)
			else:
				r = db.get(db.Key.from_path('BlogDB', key))
				if r==None:
					r=[]
					error_message="""
					<div id="pitch">
					<h1>Error:</h1>
					<p>Sorry, that blog post could not be found.</p>
					<p>Go to to <a href="http://www.rawscripts.com/blog">www.rawscripts.com/blog</a> to see if you can find what you're looking for.</p>
					</div>
					"""
				else:
					r=[r]
		else:
			q = db.GqlQuery("SELECT * FROM BlogDB "+
							"order by timestamp desc")
			r = q.fetch(20)
		exclude = set(string.punctuation)
		for i in r:
			i.link= "http://www.rawscripts.com/blog/"+''.join(ch for ch in i.title if ch not in exclude).title().replace(" ","-")
		template_values = { "r": r,
							"error_message" : error_message}
		template_values['MODE'] = config.MODE
		template_values['GA'] = config.GA
		path = get_template_path('html/blog.html')
		self.response.out.write(template.render(path, template_values))

class BlogPostGUI(webapp.RequestHandler):
	def get(self):
		path = get_template_path('html/blogpostgui.html')
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
		b = models.BlogDB(key_name = key_name,
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


def main():
	application = webapp.WSGIApplication([('/blogpostgui', BlogPostGUI),
											('/blogpost', BlogPost),
											('/blog+.*', Blog),
											('/rss', RSS)],
											 debug=True)

	run_wsgi_app(application)


if __name__ == '__main__':
	main()
