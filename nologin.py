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
import activity
import logging
from django.utils import simplejson
import mobileTest
from google.appengine.api import memcache
import config

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

class UnreadNotes (db.Model):
	resource_id = db.StringProperty()
	thread_id = db.StringProperty()
	user = db.StringProperty()
	msg_id = db.StringProperty()
	timestamp = db.DateTimeProperty(auto_now_add=True)

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
	permission = db.StringProperty()
	folder = db.StringProperty()

class ShareNotify (db.Model):
	user= db.StringProperty()
	resource_id = db.StringProperty()
	timeshared = db.DateTimeProperty()
	timeopened = db.DateTimeProperty()
	opened = db.BooleanProperty()

class Welcome (webapp.RequestHandler):
	def get(self):
		referer = os.environ.get("HTTP_REFERER")
		template_values = { 'google_sign_in': users.create_login_url('/scriptlist', None, "gmail.com"),
						'yahoo_sign_in' : users.create_login_url('/scriptlist', None, "yahoo.com"),
						'aol_sign_in' : users.create_login_url('/scriptlist', None, "aol.com")}
		template_values['TRACKER'] = config.TRACKER
		path = os.path.join(os.path.dirname(__file__), 'html/welcome.html')
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
				

class Editor (webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		path = os.path.join(os.path.dirname(__file__), 'html/editor.html')
		template_values = {}
		template_values['EOV'] = "editor"
		resource_id=self.request.get('resource_id')
		format='editor'
		mobile = mobileTest.mobileTest(self.request.user_agent)
		if mobile == 1:
			self.redirect('/scriptlist')
			activity.activity("editormobile", None, resource_id, 1, None, None, None, None, None,None,format,None,None, None)
			return;
		if user and resource_id!="Demo":
			template_values['sign_out'] = users.create_logout_url('/')
			template_values['user'] = users.get_current_user().email()
			q=db.GqlQuery("SELECT * FROM UsersScripts "+
										"WHERE resource_id='"+resource_id+"' "+
										"AND user='"+user.email().lower()+"'")
			r=q.fetch(1)
			if len(r)!=0:
				if r[0].permission=='collab':
					format='viewer'
					path = os.path.join(os.path.dirname(__file__), 'html/editor.html')
					template_values['EOV'] = "viewer"
					q=db.GqlQuery("SELECT * FROM ShareNotify "+
									"WHERE user='"+user.email().lower()+"' "+
									"AND resource_id='"+resource_id+"' "+
									"AND opened=False")
					unopened = q.fetch(1)
					if len(unopened)!=0:
						unopened[0].opened=True
						unopened[0].timeopened = datetime.datetime.today()
						unopened[0].put()
			else:
				self.redirect("/")
				return
		else:
			resource_id=self.request.get('resource_id')
			if resource_id=='Demo':
				template_values['sign_out'] =  '/'
				template_values['user'] = "test@example.com"
			else:
				template_values = { 'google_sign_in': users.create_login_url('/editor?resource_id='+resource_id, None, 'gmail.com'),
				 					'yahoo_sign_in' : users.create_login_url('/editor?resource_id='+resource_id, None, 'yahoo.com')}
				path = os.path.join(os.path.dirname(__file__), 'html/login.html')
				
		if user:
			user=user.email().lower()
		else:
			user="unknown"
		template_values['resource_id'] = resource_id
		template_values['MODE'] = config.MODE
		template_values['EDITOR_JS'] = config.EDITOR_JS
		template_values['EDITOR_CSS'] = config.EDITOR_CSS
		template_values['TRACKER'] = config.TRACKER
		self.response.headers['Content-Type'] = 'text/html'
		self.response.out.write(template.render(path, template_values))
		activity.activity("editor", user, resource_id, mobile, None, None, None, None, None,None,format,None,None, None)

class ScriptContent (webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')

		q = db.GqlQuery("SELECT * FROM UsersScripts "+
										"WHERE resource_id='"+resource_id+"'")
		results = q.fetch(500)
		p=False
		if len(results)==0:
			self.response.headers["Content-Type"]='text/plain'
			self.response.out.write('not found')
		if resource_id=='Demo':
			p=True
			title="Duck Soup"
		else:
			for i in results:
				title=i.title
				if i.user==users.get_current_user().email().lower():
					if i.permission=='owner' or i.permission=="collab":
						p=True
		
		if p==True:
			q = db.GqlQuery("SELECT * FROM ScriptData "+
											"WHERE resource_id='"+resource_id+"' "+
											"ORDER BY version DESC")
			results = q.fetch(2)
			
			q = db.GqlQuery("SELECT * FROM SpellingData "+
											"WHERE resource_id='"+resource_id+"'")
			spellresults = q.fetch(2)
			sp = []
			if len(spellresults)!=0:
				sp.append(simplejson.loads(spellresults[0].wrong))
				sp.append(simplejson.loads(spellresults[0].ignore))

			q=db.GqlQuery("SELECT * FROM Notes "+
										"WHERE resource_id='"+resource_id+"'")
			noteresults = q.fetch(1000)
			user = users.get_current_user()
			if user:
				q=db.GqlQuery("SELECT * FROM UnreadNotes "+
							"WHERE resource_id='"+resource_id+"' "+
							"AND user='"+user.email().lower()+"'")
				un=q.fetch(500)
			else:
				un=None
			notes=[]
			for i in noteresults:
				msgs = simplejson.loads(i.data)
				if un==None:
					for unit in msgs:
						unit.append(1)
				else:
					for unit in msgs:
						found=False
						for j in un:
							if j.msg_id==unit[2]:
								unit.append(0)
								found=True
						if found==False:
							unit.append(1)
				
				msgsArr=[]
				for j in msgs:
					msgsArr.append({'text':j[0], 'user':j[1], 'msg_id':j[2], 'readBool':j[3]})
				
				dic = { 'row':i.row, 
						'col':i.col, 
						'msgs':msgsArr,
						'thread_id':i.thread_id}
				notes.append(dic)

			sharedwith=[]
			q=db.GqlQuery("SELECT * FROM UsersScripts "+
										"WHERE resource_id='"+resource_id+"'")
			shareresults=q.fetch(50)
			for i in shareresults:
				if i.permission=="collab":
					sharedwith.append(i.user)
			
			try:
				c = memcache.get('contacts' + users.get_current_user().email().lower())
			except:
				c=None
			if c==None:
				contacts = []
			else:
				contacts = simplejson.loads(c)
		
			try:
				us = db.get(db.Key.from_path('UsersSettings', 'settings'+users.get_current_user().email().lower()))
			except:
				us = None
			if us==None:
				autosave='true'
			else:
				if us.autosave==True:
					autosave='true'
				else:
					autosave='false'
			
			ja={}
			ja['title'] = title
			ja['lines'] = simplejson.loads(results[0].data)
			ja['spelling'] = sp
			ja['notes'] = notes
			ja['sharedwith'] = sharedwith
			ja['contacts'] = contacts
			ja['autosave'] = autosave

			content = simplejson.dumps(ja)
			
			self.response.headers["Content-Type"]='text/plain'
			self.response.out.write(content)
			mobile = mobileTest.mobileTest(self.request.user_agent)
			if user:
				user=user.email().lower()
			else:
				user="unknown"
			activity.activity("scriptcontent", user, resource_id, mobile, len(results[0].data), None, None, None, None,title,None,None,None, None)


class Save (webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		if resource_id == None:
			return
		if resource_id=='Demo':
			self.response.out.write('demo')
			return
		data=self.request.get('data')
		autosave = self.request.get('autosave')
		if autosave=='0':
			b=0
		else:
			b=1
		q = db.GqlQuery("SELECT * FROM UsersScripts "+
										"WHERE resource_id='"+resource_id+"' "+
										"AND permission='owner'")
		u = q.get()
		v=0
		if u==None:
			self.response.headers["Content-Type"] = "text/plain"
			self.response.out.write('script not found')
			logging.info('script not found')
			return
		else:
			if u.user==users.get_current_user().email().lower():
				q = db.GqlQuery("SELECT * FROM ScriptData "+
								"WHERE resource_id='"+resource_id+"' "+
								"ORDER BY version DESC")
				most_recent = q.get()
				v = most_recent.version
				v+=1

		if not v==0:
			a = ScriptData(resource_id=resource_id,
							title='title',
							data=data,
							version=v,
							export='[[],[]]',
							tag='',
							autosave=b)
			a.put()

			q = db.GqlQuery("SELECT * FROM UsersScripts WHERE resource_id='"+resource_id+"'")
			results=q.fetch(500)
			for i in results:
				i.last_updated=datetime.datetime.today()
				i.put()
			
			self.response.headers['Content-Type'] = 'text/plain'
			self.response.out.write('1')
		else:
			self.response.headers['Content-Type'] = 'text/plain'
			self.response.out.write('0')
		activity.activity("save", users.get_current_user().email().lower(), resource_id, None, len(data), None, int(autosave), None, None,None,None,None,None, None)

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

class Bugs (webapp.RequestHandler):
	def get(self):
		#This is the one for admins
		self.redirect('http://spreadsheets.google.com/viewform?hl=en&formkey=dE15YkVNa095dVRBYkl3eXdBVHJHVXc6MQ#gid=0')

class SubmitBug (webapp.RequestHandler):
	def get(self):
		#This is the one for public
		self.redirect('http://spreadsheets.google.com/viewform?hl=en&formkey=dDBkVlZfV0RJUWxORjZGdzVWOHVnUXc6MQ#gid=0')

class TOS(webapp.RequestHandler):
	def get(self):
		path = os.path.join(os.path.dirname(__file__), 'html/tos.html')
		template_values={'TRACKER' : config.TRACKER}
		self.response.headers['Content-Type'] = 'text/html'
		self.response.out.write(template.render(path, template_values))

class Contact(webapp.RequestHandler):
	def get(self):
		path = os.path.join(os.path.dirname(__file__), 'html/contact.html')
		template_values={'TRACKER' : config.TRACKER}
		self.response.headers['Content-Type'] = 'text/html'
		self.response.out.write(template.render(path, template_values))

class About(webapp.RequestHandler):
	def get(self):
		path = os.path.join(os.path.dirname(__file__), 'html/about.html')
		template_values={'TRACKER' : config.TRACKER}
		self.response.headers['Content-Type'] = 'text/html'
		self.response.out.write(template.render(path, template_values))
		
def main():
	application = webapp.WSGIApplication([('/editor', Editor),
																				('/', Welcome),
																				('/tos', TOS),
																				('/scriptcontent', ScriptContent),
																				('/contactemail', ContactEmail),
																				('/_ah/login_required', LoginRequired),
																				('/bugs', Bugs),
																				('/save', Save),
																				('/contact', Contact),
																				('/about', About),
																				('/submitbug', SubmitBug),],
																			 debug=True)
	
	wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
	main()

