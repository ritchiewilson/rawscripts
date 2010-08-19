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
import api
import random
import zipfile
import export
import logging
from django.utils import simplejson
from google.appengine.api.labs import taskqueue


class ShareDB (db.Model):
	name = db.StringProperty()
	resource_id = db.StringProperty()
	fromPage = db.StringProperty()
	
class LastUpdatedEtag (db.Model):
	name = db.StringProperty()
	etag = db.StringProperty()
	resource_id = db.StringProperty()
	
class Users (db.Model):
	name = db.StringProperty()
	firstUse = db.DateTimeProperty(auto_now_add=True)

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

class ScriptData (db.Model):
	resource_id = db.StringProperty()
	data = db.TextProperty()
	version = db.IntegerProperty()
	timestamp = db.DateTimeProperty(auto_now_add=True)
	autosave = db.IntegerProperty()
	export = db.StringProperty()
	tag = db.StringProperty()

class TitlePageData (db.Model):
	resource_id = db.StringProperty()
	title = db.StringProperty()
	authorOne = db.StringProperty()
	authorTwo = db.StringProperty()
	authorTwoChecked = db.StringProperty()
	authorThree  = db.StringProperty()
	authorThreeChecked  = db.StringProperty()
	based_on  = db.StringProperty()
	based_onChecked  = db.StringProperty()
	address = db.StringProperty()
	addressChecked = db.StringProperty()
	phone = db.StringProperty()
	phoneChecked = db.StringProperty()
	cell = db.StringProperty()
	cellChecked = db.StringProperty()
	email = db.StringProperty()
	emailChecked = db.StringProperty()
	registered = db.StringProperty()
	registeredChecked = db.StringProperty()
	other = db.StringProperty()
	otherChecked = db.StringProperty()

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

class SpellingData(db.Model):
	resource_id = db.StringProperty()
	wrong = db.TextProperty()
	ignore = db.TextProperty()
	birthdate = db.DateProperty()


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
		
def main():
	application = webapp.WSGIApplication([('/junkparse', JunkParse),
																				('/automateddelete', AutomatedDelete),],
																			 debug=True)
	
	wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
	main()


