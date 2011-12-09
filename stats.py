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
import wsgiref.handlers
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
import logging
from django.utils import simplejson
import activity
import os
import models
		
class Stats(webapp.RequestHandler):
	def get(self):
		
		# Get User
		q=db.GqlQuery("SELECT * FROM Users")
		u=q.fetch(10000)	
		template_values= { 'users': str(len(u)),
		 					'Users': u}
		
		# Figure out users who havn't made a script
		ns=[] # no scripts
		for i in u:
			q=db.GqlQuery("SELECT __key__ FROM UsersScripts WHERE user='"+i.name.lower()+"'")
			g=q.get()
			if g==None:
				ns.append(i)
		template_values['noScripts']=ns
		
		# count scripts
		q=db.GqlQuery("SELECT * FROM UsersScripts WHERE permission='owner'")
		s=q.fetch(10000)
		template_values['scripts']=str(len(s))
		
		path = os.path.join(os.path.dirname(__file__), 'html/stats.html')
		self.response.headers['Content-Type'] = 'text/html'
		self.response.out.write(template.render(path, template_values))
		
		

def main():
	application = webapp.WSGIApplication([('/stats', Stats),
											],
																			 debug=True)
	
	run_wsgi_app(application)


if __name__ == '__main__':
	main()

