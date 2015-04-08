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
        posts = None
        uri = self.request.path_info.split('/')
        if uri[-1] == '':
            uri = uri[:-1]
        if len(uri) == 3:
            key = uri[2].replace("-"," ").title().replace(" ","-")
            posts = db.get(db.Key.from_path('BlogDB', key))
            if posts is not None:
                posts = [posts]
        elif len(uri) == 2:
            q = models.BlogDB.all()
            q.order('-timestamp')
            posts = q.fetch(20)
        if posts is not None:
            for post in posts:
                post.link = post.get_url()
        template_values = { "posts": posts}
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
            link = i.get_url()
            feed.add_item(title=i.title, description=i.data, pubdate=i.timestamp, link=link)
        self.response.headers['Content-Type'] = 'text/xml'
        self.response.out.write(feed.writeString('utf-8'))


def main():
    routes = [
        ('/blogpostgui', BlogPostGUI),
        ('/blogpost', BlogPost),
        ('/blog+.*', Blog),
        ('/rss', RSS),
    ]
    application = webapp.WSGIApplication(routes, debug=True)
    run_wsgi_app(application)


if __name__ == '__main__':
    main()
