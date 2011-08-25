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
from google.appengine.api.labs import taskqueue
import config
import models


class JunkParse(webapp.RequestHandler):
	def get(self):
		q=db.GqlQuery("SELECT * FROM UsersScripts "+
									"WHERE permission='hardDelete'")
		r=q.fetch(100)
		for i in r:
			taskqueue.add(url='/automateddelete', params={'resource_id':i.resource_id})
		self.response.out.write('1')
			
		
class AutomatedDelete (webapp.RequestHandler):
	def post(self):
		resource_id=self.request.get('resource_id')

		q=db.GqlQuery("SELECT * FROM DuplicateScripts "+
									"WHERE from_script='"+resource_id+"'")
		f=q.fetch(1000)
		logging.info(len(f))
		#if nothing comes from this script
		if len(f)==0:
			q=db.GqlQuery("SELECT * FROM ScriptData "+
										"WHERE resource_id='"+resource_id+"'")
			r=q.fetch(50)

			if not len(r)==0:
				for i in r:
					i.delete()
				taskqueue.add(url='/automateddelete', params={'resource_id':i.resource_id})
			else:
				q=db.GqlQuery("SELECT * FROM DuplicateScripts "+
											"WHERE new_script='"+resource_id+"'")
				r=q.fetch(50)
				for i in r:
					i.delete()
				q=db.GqlQuery("SELECT * FROM TitlePageData "+
											"WHERE resource_id='"+resource_id+"'")
				r=q.fetch(50)
				for i in r:
					i.delete()
				q=db.GqlQuery("SELECT * FROM UsersScripts "+
											"WHERE resource_id='"+resource_id+"'")
				r=q.fetch(50)
				for i in r:
					i.delete()
				q=db.GqlQuery("SELECT * FROM SpellingData "+
											"WHERE resource_id='"+resource_id+"'")
				r=q.fetch(50)
				for i in r:
					i.delete()
				q=db.GqlQuery("SELECT * FROM Notes "+
											"WHERE resource_id='"+resource_id+"'")
				r=q.fetch(1000)
				for i in r:
					i.delete()
				q=db.GqlQuery("SELECT * FROM NotesNotify "+
											"WHERE resource_id='"+resource_id+"'")
				r=q.fetch(1000)
				for i in r:
					i.delete()
				q=db.GqlQuery("SELECT * FROM ShareNotify "+
											"WHERE resource_id='"+resource_id+"'")
				r=q.fetch(1000)
				for i in r:
					i.delete()
		
def main():
	application = webapp.WSGIApplication([('/junkparse', JunkParse),
																				('/automateddelete', AutomatedDelete),],
																			 debug=True)
	
	wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
	main()


