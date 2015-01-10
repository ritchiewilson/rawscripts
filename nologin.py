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


import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
from google.appengine.dist import use_library
use_library('django', '1.2')
import StringIO
import os
import cgi
import wsgiref.handlers
from google.appengine.api import users
from google.appengine.api import mail
from google.appengine.api import urlfetch
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
import datetime
import random
import zipfile
import export
import logging
from django.utils import simplejson
import mobileTest
from google.appengine.api import memcache
import config
import models


class Welcome (webapp.RequestHandler):
	def get(self):
		referer = os.environ.get("HTTP_REFERER")
		template_values = { 'google_sign_in': users.create_login_url('/scriptlist', None, "gmail.com"),
						'yahoo_sign_in' : users.create_login_url('/scriptlist', None, "yahoo.com"),
						'aol_sign_in' : users.create_login_url('/scriptlist', None, "aol.com")}
		template_values['MODE'] = config.MODE
		template_values['GA'] = config.GA
		path = os.path.join(os.path.dirname(__file__), 'html', 'welcome.html')
		mobile = mobileTest.mobileTest(self.request.user_agent)
		if mobile == 1:
			path = os.path.join(os.path.dirname(__file__), 'html/mobile/MobileWelcome.html')
		if referer == 'http://www.rawscripts.com/scriptlist' or referer == 'http://www.rawscripts.com/' or  referer == 'http://www.rawscripts.com/about' or  referer == 'http://www.rawscripts.com/blog' or  referer == 'http://www.rawscripts.com/contact':
			self.response.headers['Content-Type'] = 'text/html'
			self.response.out.write(template.render(path, template_values))
			return
		user = users.get_current_user()
		if not user:
			self.response.headers['Content-Type'] = 'text/html'
			self.response.out.write(template.render(path, template_values))
		else:
			self.redirect('/scriptlist')


class LoginRequired(webapp.RequestHandler):
	def get(self):
		self.redirect('/')

class ContactEmail (webapp.RequestHandler):
	def post(self):
		name = self.request.get('name')
		subject = self.request.get('subject')
		message = self.request.get('message')
		if not message == None:
			body = 'FROM: '+name+'\n\nSUBJECT: '+subject+'\n\n'+message
			mail.send_mail(sender='contact@rawscripts.com',
											 to='contact@rawscripts.com',
											 subject='From Homepage Form: '+subject,
											 body=body)
			self.response.out.write('1')


class TOS(webapp.RequestHandler):
	def get(self):
		path = os.path.join(os.path.dirname(__file__), 'html/tos.html')
		template_values={'MODE' : config.MODE}
		template_values['GA'] = config.GA
		self.response.headers['Content-Type'] = 'text/html'
		self.response.out.write(template.render(path, template_values))

class Contact(webapp.RequestHandler):
	def get(self):
		path = os.path.join(os.path.dirname(__file__), 'html/contact.html')
		template_values={'MODE' : config.MODE}
		template_values['GA'] = config.GA
		self.response.headers['Content-Type'] = 'text/html'
		self.response.out.write(template.render(path, template_values))


def main():
	application = webapp.WSGIApplication([('/', Welcome),
						('/tos', TOS),
		       				('/contactemail', ContactEmail),
					       	('/_ah/login_required', LoginRequired),
				       		('/contact', Contact),],
			       			 debug=True)

	run_wsgi_app(application)


if __name__ == '__main__':
	main()
