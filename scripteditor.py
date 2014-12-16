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
import StringIO, os, cgi, re
import wsgiref.handlers
from google.appengine.api import memcache
from google.appengine.api import users
from google.appengine.api import mail
from google.appengine.api import urlfetch
from google.appengine.api import taskqueue
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api import rdbms
import datetime
import random
import export
import convert
import logging
from django.utils import simplejson
import mobileTest
import chardet
import gdata.gauth
import gdata.data
import gdata.contacts.client
import config
import models
import unicodedata

from utils import gcu, permission, ownerPermission

def get_contacts_google_token(request):
	current_user = users.get_current_user()
	if current_user is None or current_user.user_id() is None:
		return False
	token_string, token_scopes = gdata.gauth.auth_sub_string_from_url(request.url)
	if token_string is None:
		return gdata.gauth.ae_load('contacts' + gcu())
	single_use_token = gdata.gauth.AuthSubToken(token_string, token_scopes)
	client = gdata.client.GDClient()
	session_token = client.upgrade_token(single_use_token)
	gdata.gauth.ae_save(session_token, 'contacts' + gcu())
	return session_token

def get_contacts_yahoo_token(request):
	current_user = users.get_current_user()
	if current_user is None or current_user.user_id() is None:
		return False
	return False

class Delete (webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		q = db.GqlQuery("SELECT * FROM UsersScripts "+
										"WHERE resource_id='"+resource_id+"'")
		results = q.fetch(1000)
		user = gcu()
		p=False
		for i in results:
			if i.permission=='owner':
				if i.user==user:
					p=True
		if p==True:
			for i in results:
				if i.permission=='owner':
					i.permission='ownerDeleted'
					i.put()
				if i.permission=='collab':
					i.permission='collabDeletedByOwner'
					i.put()
			self.response.headers['Content-Type']='text/plain'
			self.response.out.write('1')
		else:
			self.response.headers['Content-Type']='text/plain'
			self.response.out.write('0')
		mobile = mobileTest.mobileTest(self.request.user_agent)


class Undelete(webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		title= ownerPermission(resource_id)
		if not title==False:
			q = db.GqlQuery("SELECT * FROM UsersScripts "+
											"WHERE resource_id='"+resource_id+"'")
			results = q.fetch(1000)
			for i in results:
				if i.permission=='ownerDeleted':
					i.permission='owner'
					i.put()
				elif i.permission=='collabDeletedByOwner':
					i.permission='collab'
					i.put()
			self.response.headers['Content-Type']='text/plain'
			self.response.out.write('1')
		else:
			self.response.headers['Content-Type']='text/plain'
			self.response.out.write('0')

class HardDelete(webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		title = ownerPermission(resource_id)
		if not title==False:
			q = db.GqlQuery("SELECT * FROM UsersScripts "+
											"WHERE resource_id='"+resource_id+"'")
			r = q.fetch(500)

			for i in r:
				i.permission = 'hardDelete'
				i.put()

class Rename (webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		if resource_id=="Demo":
			return
		fromPage = self.request.get('fromPage')
		rename = self.request.get('rename')
		q = db.GqlQuery("SELECT * FROM UsersScripts "+
										"WHERE resource_id='"+resource_id+"'")
		results = q.fetch(1000)
		user = gcu()
		p=False
		for i in results:
			if i.permission=='owner':
				if i.user==user:
					p=True
		if p==True:
			for i in results:
				i.title=rename
				i.put()


class Export (webapp.RequestHandler):
	def get(self):

		fromPage = self.request.get('fromPage')
		resource_id = self.request.get('resource_id')
		if resource_id=="Demo":
			return
		export_format = self.request.get('export_format')
		title_page = self.request.get('title_page')
		user=gcu()
		if resource_id:
			q=db.GqlQuery("SELECT * FROM UsersScripts "+
										"WHERE resource_id='"+resource_id+"'")
			results = q.fetch(500)
			p=False
			for i in results:
				if i.user==user:
					if i.permission=='owner' or i.permission=="collab":
						p=True
						title=i.title
			if p==True:
				q=db.GqlQuery("SELECT * FROM ScriptData "+
											"WHERE resource_id='"+resource_id+"' "+
											"ORDER BY version DESC")
				results = q.fetch(1)
				data=results[0].data
                                ascii_title = unicodedata.normalize("NFKD", title).encode("ascii", "ignore")

				if export_format =='txt':
					newfile = export.Text(data, title, title_page, resource_id)
					filename = 'filename=' + ascii_title + '.txt'
					self.response.headers['Content-Type'] = 'text/plain'
				elif export_format=='pdf':
					newfile = export.Pdf(data, title, title_page, resource_id)
					filename = 'filename=' + ascii_title + '.pdf'
					self.response.headers['Content-Type'] = 'application/pdf'

				J = simplejson.loads(results[0].export)
				arr=[export_format, str(datetime.datetime.today())]
				J[1].append(arr)
				results[0].export=simplejson.dumps(J)
				results[0].put()

				self.response.headers['Content-Disposition'] = 'attachment; ' +filename
				self.response.out.write(newfile.getvalue())


class EmailScript (webapp.RequestHandler):
	def post(self):
		fromPage = self.request.get('fromPage')
		resource_id = self.request.get('resource_id')
		if resource_id=="Demo":
			return
		title_page = self.request.get('title_page')
		p=permission(resource_id)
		if p==False:
			return
		else:
			subject=self.request.get('subject')
			body_message=self.request.get('body_message')
			result = urlfetch.fetch("http://www.rawscripts.com/text/email.txt")
			htmlbody = result.content
			html = htmlbody.replace("FILLERTEXT", body_message)
			body = body_message + """


	--- This Script written and sent from RawScripts.com. Check it out---"""

		# Make Recipient list instead of just one
		recipients=self.request.get('recipients').split(',')
		title = p
		q=db.GqlQuery("SELECT * FROM ScriptData "+
									"WHERE resource_id='"+resource_id+"' "+
									"ORDER BY version DESC")
		results = q.fetch(1)
		data=results[0].data
		newfile = export.Pdf(data, title, title_page, resource_id)
		filename=title+'.pdf'


		#Mail the damn thing. Itereating to reduce userside errors
		j=0
		while j<3:
			try:
				mail.send_mail(sender=users.get_current_user().email(),
								to=recipients,
								subject=subject,
								body = body,
								html = html,
								attachments=[(filename, newfile.getvalue())])
				j=5
			except:
				j=j+1
			if j==2:
				subject="Script"
			if j==4:
				self.response.headers['Content-Type'] = 'text/plain'
				self.response.out.write('not sent')
				return
		user = gcu()
		ownerTest = db.get(db.Key.from_path('UsersScripts', 'owner'+user+resource_id))
		if ownerTest!=None:
			J = simplejson.loads(results[0].export)
			t=str(datetime.datetime.today())

			for recipient in recipients:
				J[0].append([recipient, t])
				results[0].export=simplejson.dumps(J)
				results[0].put()

		self.response.headers['Content-Type'] = 'text/plain'
		self.response.out.write('sent')

class UserExport(webapp.RequestHandler):
	def get(self):
		if not users.is_current_user_admin():
			self.redirect("/")
		recipient = self.request.get('emailaddr')
		resource_id = self.request.get('resource_id')
		pdf = self.request.get('pdf')
		logging.info(pdf)
		subject = "Manual Export of RawScripts Screenplay"
		body = """


	--- This Script written and sent from RawScripts.com.---"""
		title_page = '0'
		q = db.Query(models.UsersScripts)
		q.filter('resource_id =', resource_id)
		entry = q.get()
		title = entry.title
		q = db.Query(models.ScriptData)
		q.filter('resource_id =', resource_id)
		q.order('-version')
		data = q.get()
		newfile = 0
		filename = ''
		if pdf=='on':
			newfile = export.Pdf(data.data, title, title_page, resource_id)
			filename=title+'.pdf'
		else:
			newfile = export.Text(data.data, title, title_page, resource_id)
			filename=title+'.txt'
		mail.send_mail(sender='contact@rawscripts.com',
					   to=recipient,
					   subject=subject,
					   body=body,
					   attachments=[(filename, newfile.getvalue())])
		self.response.headers['Content-Type'] = 'text/plain'
		self.response.out.write('sent')

class NewScript (webapp.RequestHandler):
	def post(self):

		filename = self.request.get('filename')
		filename = filename.replace('%20', ' ')
		fromPage = self.request.get('fromPage')
		user=gcu()
		alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
		resource_id=''
		for x in random.sample(alphabet,20):
			resource_id+=x

		q=db.GqlQuery("SELECT * FROM UsersScripts "+
									"WHERE resource_id='"+resource_id+"'")
		results=q.fetch(2)

		while len(results)>0:
			resource_id=''
			for x in random.sample(alphabet,20):
				resource_id+=x
			q=db.GqlQuery("SELECT * FROM UsersScripts "+
										"WHERE resource_id='"+resource_id+"'")
			results=q.fetch(2)

		s = models.ScriptData(resource_id=resource_id,
									 data='[["Fade In:",1],["Int. ",0]]',
									 version=1,
									 export='[[],[]]',
									 tag='',
									 autosave=0)
		s.put()

		s = models.SpellingData(resource_id=resource_id,
									 wrong='[]',
									 ignore="[]")
		s.put()

		u = models.UsersScripts(key_name="owner"+user+resource_id,
						user=user,
						title=filename,
						resource_id=resource_id,
						last_updated = datetime.datetime.today(),
						permission='owner',
						folder = "?none?")
		u.put()
		self.response.headers['Content-Type'] = 'text/plain'
		self.response.out.write(resource_id)

class Duplicate (webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		if resource_id=="Demo":
			return
		title = ownerPermission(resource_id)
		if not title==False:
			q=db.GqlQuery("SELECT * FROM ScriptData "+
										"WHERE resource_id='"+resource_id+"' "+
										"ORDER BY version DESC")
			results = q.fetch(1)
			data=results[0].data
			version=results[0].version
			user=gcu()
			alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
			new_resource_id=''
			for x in random.sample(alphabet,20):
				new_resource_id+=x

			q=db.GqlQuery("SELECT * FROM UsersScripts "+
										"WHERE resource_id='"+new_resource_id+"'")
			results=q.fetch(2)

			while len(results)>0:
				new_resource_id=''
				for x in random.sample(alphabet,20):
					new_resource_id+=x
				q=db.GqlQuery("SELECT * FROM UsersScripts "+
											"WHERE resource_id='"+new_resource_id+"'")
				results=q.fetch(2)

			s = models.ScriptData(resource_id=new_resource_id,
										 data=data,
										 version=version+1,
										 export="[[],[]]",
										 tag="",
										 autosave=0)
			s.put()
			d= models.DuplicateScripts(new_script = new_resource_id,
													from_script = resource_id,
													from_version=version)

			d.put()
			u = models.UsersScripts(key_name="owner"+user+new_resource_id,
							user=user,
							title='Copy of '+title,
							resource_id=new_resource_id,
							last_updated = datetime.datetime.today(),
							permission='owner',
							folder = "?none?")
			u.put()
			q=db.GqlQuery("SELECT * FROM SpellingData "+
										"WHERE resource_id='"+resource_id+"'")
			r=q.fetch(2)
			s= models.SpellingData(resource_id=new_resource_id,
											wrong=r[0].wrong,
											ignore=r[0].ignore)
			s.put()
			self.response.headers['Content-Type'] = 'text/plain'
			self.response.out.write('/editor?resource_id='+new_resource_id)

class ConvertProcess (webapp.RequestHandler):
	def post(self):

		# New Script Setup
		filename = "Untitled"
		ff = self.request.get('ff')
		capture = self.request.get('filename')
		if capture:
			filename = capture.replace('%20', ' ')
			filename = filename.replace('C:\\fakepath\\', '')
		user=gcu()
		alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
		resource_id=''
		for x in random.sample(alphabet,20):
			resource_id+=x

		q=db.GqlQuery("SELECT * FROM UsersScripts "+
									"WHERE resource_id='"+resource_id+"'")
		results=q.fetch(2)

		while len(results)>0:
			resource_id=''
			for x in random.sample(alphabet,10):
				resource_id+=x
			q=db.GqlQuery("SELECT * FROM UsersScripts "+
										"WHERE resource_id='"+resource_id+"'")
			results=q.fetch(2)

		# Format file
		data = StringIO.StringIO(self.request.get('script'))
		if ff=='txt':
			data = StringIO.StringIO(data.getvalue().replace('\xe2', "'"))
			e = chardet.detect(data.getvalue())
			if e["encoding"]!=None and e["encoding"]!="ascii":
				r = data.getvalue().decode(e["encoding"])
				r = r.replace(u"\u201c", "\"").replace(u"\u201d", "\"") #strip double curly quotes
				r = r.replace(u"\u2018", "'").replace(u"\u2019", "'").replace(u"\u02BC", "'") #strip single curly quotes
				data = StringIO.StringIO(r.encode("ascii", "replace"))
			contents = convert.Text(data)
		elif ff=='fdx':
			s=data.getvalue().decode('utf-8')
			s = s.replace(u"\u201c", "\"").replace(u"\u201d", "\"") #strip double curly quotes
			s = s.replace(u"\u2018", "'").replace(u"\u2019", "'").replace(u"\u02BC", "'") #strip single curly quotes
			data = StringIO.StringIO(s.encode("ascii", "replace"))
			contents = convert.FinalDraft(data)
		else:
			contents = convert.Celtx(data)


		s = models.ScriptData(resource_id=resource_id,
									 data=contents,
									 version=1,
									 tag="",
									 export="[[],[]]",
									 autosave=0)
		s.put()

		u = models.UsersScripts(key_name="owner"+user+resource_id,
						user=user,
						title=filename,
						resource_id=resource_id,
						last_updated = datetime.datetime.today(),
						permission='owner',
						folder = "?none?")
		u.put()


		template_values = { 'url': resource_id }
		template_values['MODE'] = config.MODE
		template_values['GA'] = config.GA

		taskqueue.add(url="/spellcheckbigscript", params= {'resource_id' : resource_id})

		self.response.headers['Content-Type'] = 'text/html'
		path = os.path.join(os.path.dirname(__file__), 'html/UploadComplete.html')
		self.response.out.write(template.render(path, template_values))

class Share (webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		if resource_id=="Demo":
			return
		p = ownerPermission(resource_id)
		if p!=False:
			collaborators = self.request.get('collaborators').lower()
			fromPage = self.request.get('fromPage')
			collabList = collaborators.split(',')

			#uniquify the list
			keys={}
			for e in collabList:
				keys[e]=1
			uCollabList=keys.keys()

			#don't duplicate sharing
			q=db.GqlQuery("SELECT * FROM UsersScripts "+
							"WHERE resource_id='"+resource_id+"'")
			r=q.fetch(500)
			output=[]
			for i in uCollabList:
				found=False
				for j in r:
					if j.user==i.lower():
						found=True
					if i=="":
						found=True
				if found==False:
					output.append(i.lower())
					u = models.UsersScripts(key_name="collab"+i.lower()+resource_id,
									resource_id=resource_id,
									permission="collab",
									user = i.lower(),
									last_updated = datetime.datetime.today(),
									title = p,
									folder = "?none?")
					u.put()
			if output!=[] and self.request.get('sendEmail')=='y':
				subject=users.get_current_user().email() + " has shared a script with you on RawScripts.com"
				body_message="http://www.rawscripts.com/editor?resource_id="+resource_id
				result = urlfetch.fetch("http://www.rawscripts.com/text/notify.txt")
				htmlbody = result.content
				html = htmlbody.replace("SCRIPTTITLE", p)
				html = html.replace("USER",users.get_current_user().email())
				html = html.replace("SCRIPTURL", "http://www.rawscripts.com/editor?resource_id="+resource_id)
				if self.request.get('addMsg')=='y':
					divArea = "<div style='width:300px; margin-left:20px; font-size:12pt; font-family:serif'>"+self.request.get('msg')+"<br><b>--"+users.get_current_user().email()+"</b></div>"
					html = html.replace("TEXTAREA", divArea)
				else:
					html = html.replace("TEXTAREA", "")
				body = body_message + """


		--- This Script written and sent from RawScripts.com. Check it out---"""

				#Mail the damn thing. Itereating to reduce errors
				j=0
				while j<3:
					try:
						mail.send_mail(sender=users.get_current_user().email(),
													 to=output,
													 subject=subject,
													 body = body,
													 html = html)
						j=5
					except:
						j=j+1
						if j==3:
							self.response.headers['Content-Type'] = 'text/plain'
							self.response.out.write('not sent')
							return
			self.response.headers['Content-Type'] = 'text/plain'
			self.response.out.write(",".join(output))
			for i in output:
				s = models.ShareNotify(user = i,
								resource_id = resource_id,
								timeshared = datetime.datetime.today(),
								timeopened = datetime.datetime.today(),
								opened=False)
				s.put()

class RemoveAccess (webapp.RequestHandler):
	def post(self):
		resource_id=self.request.get('resource_id')
		if resource_id=="Demo":
			return
		p=ownerPermission(resource_id)
		if p!=False:
			fromPage=self.request.get('fromPage')
			person = self.request.get('removePerson')
			q=db.GqlQuery("SELECT * FROM UsersScripts "+
										"WHERE resource_id='"+resource_id+"' "+
										"AND user='"+person.lower()+"'")
			r=q.fetch(1)
			r[0].delete()
			q=db.GqlQuery("SELECT * FROM UnreadNotes "+
							"WHERE resource_id='"+resource_id+"' "+
							"AND user='"+person.lower()+"'")
			r=q.fetch(500)
			for i in r:
				i.delete()
			remove_person = self.request.get('removePerson')
			self.response.headers['Content-Type'] = 'text/plain'
			self.response.out.write(remove_person.lower())
			q=db.GqlQuery("SELECT * FROM ShareNotify "+
						"WHERE resource_id='"+resource_id+"' "+
						"AND user='"+person.lower()+"'")
			r=q.fetch(1)
			if len(r)!=0:
				r[0].delete()

class SettingsPage (webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		if not user:
			self.redirect('/')
			return
		else:
			path = os.path.join(os.path.dirname(__file__), 'html/settings.html')
			template_values = { 'sign_out': users.create_logout_url('/') }
			template_values['user'] = users.get_current_user().email()
			try:
				domain = user.email().lower().split('@')[1].split('.')[0]
				if domain=='yahoo' or domain=='ymail' or domain=='rocketmail':
					template_values['domain'] = 'Yahoo'
					at = db.get(db.Key.from_path('YahooOAuthTokens', 'yahoo_oauth_token'+gcu()))
					if at==None or at==False:
						template_values['syncContactsText']='OFF'
					else:
						template_values['syncContactsText']='ON'
				else:
					template_values['domain'] = 'Google'
					token = get_contacts_google_token(self.request)
					if token==False or token==None:
						template_values['syncContactsText']='OFF'
					else:
						template_values['syncContactsText']='ON'
			except:
				template_values['domain'] = ''
				template_values['syncContactsText']='not supported for your account'

			try:
				us = db.get(db.Key.from_path('UsersSettings', 'settings'+gcu()))
			except:
				us = None
			if us==None:
				us = models.UsersSettings(key_name='settings'+gcu(),
									autosave=True,
									owned_notify = 'every',
									shared_notify = 'every')
				us.put()
				template_values['autosaveEnabled']='checked'
				template_values['autosaveDisabled']=''
				template_values['owned_every_selected']='selected'
				template_values['owned_daily_selected']=''
				template_values['owned_none_selected']=''
				template_values['shared_every_selected']='selected'
				template_values['shared_daily_selected']=''
				template_values['shared_none_selected']=''

			else:
				if us.autosave==True:
					template_values['autosaveEnabled']='checked'
					template_values['autosaveDisabled']=''
				else:
					template_values['autosaveEnabled']=''
					template_values['autosaveDisabled']='checked'
				if us.owned_notify=='every':
					template_values['owned_every_selected']='selected'
					template_values['owned_daily_selected']=''
					template_values['owned_none_selected']=''
				elif us.owned_notify=='daily':
					template_values['owned_every_selected']=''
					template_values['owned_daily_selected']='selected'
					template_values['owned_none_selected']=''
				else:
					template_values['owned_every_selected']=''
					template_values['owned_daily_selected']=''
					template_values['owned_none_selected']='selected'
				if us.shared_notify=='every':
					template_values['shared_every_selected']='selected'
					template_values['shared_daily_selected']=''
					template_values['shared_none_selected']=''
				elif us.shared_notify=='daily':
					template_values['shared_every_selected']=''
					template_values['shared_daily_selected']='selected'
					template_values['shared_none_selected']=''
				else:
					template_values['shared_every_selected']=''
					template_values['shared_daily_selected']=''
					template_values['shared_none_selected']='selected'
			template_values['GA'] = config.GA
			template_values['MODE'] = config.MODE
			self.response.headers['Content-Type'] = 'text/html'
			self.response.out.write(template.render(path, template_values))


class ChangeUserSetting(webapp.RequestHandler):
	def post(self):
		user = users.get_current_user()
		if not user:
			return
		else:
			k = self.request.get('k')
			v = self.request.get('v')
			try:
				us = db.get(db.Key.from_path('UsersSettings', 'settings'+gcu()))
			except:
				us = None
			if us==None:
				us = models.UsersSettings(key_name='settings'+gcu(),
									autosave=True,
									owned_notify = 'every',
									shared_notify = 'every')
			if k=='autosave':
				if v=='Enable':
					value=True
				else:
					value=False
				us.autosave=value
				us.put()
				output = "sent"
			elif k=='owned_notify':
				us.owned_notify=v
				us.put()
				output = 'owned_notifySaved'
			elif k=='shared_notify':
				us.shared_notify = v
				us.put()
				output = 'shared_notifySaved'
			self.response.headers['Content-Type'] = 'text/plain'
			self.response.out.write(output)

class SyncContactsPage (webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		if not user:
			self.redirect('/')
			return
		else:
			template_values = {}
			try:
				domain = user.email().lower().split('@')[1].split('.')[0]
			except:
				path = os.path.join(os.path.dirname(__file__), 'html/synccontactserror.html')
				self.response.headers['Content-Type'] = 'text/html'
				self.response.out.write(template.render(path, template_values))
				return

			if domain=='yahoo' or domain=='ymail' or domain=='rocketmail':
				template_values['domain'] = 'Yahoo'
				token = db.get(db.Key.from_path('YahooOAuthTokens', 'yahoo_oauth_token'+gcu()))
				if token!=None and token!=False:
					path = os.path.join(os.path.dirname(__file__), 'html/removesynccontacts.html')
				else:
					import yahoo.application
					verifier  = self.request.get('oauth_verifier')
					CONSUMER_KEY      = 'dj0yJmk9SzliWElvdVlJQmtRJmQ9WVdrOWREY3pUR05YTXpJbWNHbzlOemd3TnpRMU1UWXkmcz1jb25zdW1lcnNlY3JldCZ4PWZi'
					CONSUMER_SECRET   = 'fc43654b852a220a29e054cccbf27fb1f0080b89'
					APPLICATION_ID    = 't73LcW32'
					CALLBACK_URL      = 'http://www.rawscripts.com/synccontactspage'
					oauthapp      = yahoo.application.OAuthApplication(CONSUMER_KEY, CONSUMER_SECRET, APPLICATION_ID, CALLBACK_URL)
					if verifier=='':
						request_token = oauthapp.get_request_token(CALLBACK_URL)
						memcache.set(key='request_token'+user.email().lower(), value=request_token.to_string(), time=3600)
						redirect_url  = oauthapp.get_authorization_url(request_token)
						template_values['auth_url'] = redirect_url
						path = os.path.join(os.path.dirname(__file__), 'html/synccontacts.html')
					else:
						r = memcache.get('request_token'+user.email().lower())
						request_token = yahoo.oauth.RequestToken.from_string(r)
						access_token = oauthapp.get_access_token(request_token, verifier)
						oauthapp.token = access_token
						y = models.YahooOAuthTokens(key_name='yahoo_oauth_token'+user.email().lower(),
											t = access_token.to_string())
						y.put()
						path = os.path.join(os.path.dirname(__file__), 'html/removesynccontacts.html')
			else:
				template_values['domain'] = 'Google'
				google_token = get_contacts_google_token(self.request)
				if google_token == None:
					template_values['auth_url'] = gdata.gauth.generate_auth_sub_url(self.request.url, ['http://www.google.com/m8/feeds/'])
					path = os.path.join(os.path.dirname(__file__), 'html/synccontacts.html')
				else:
					path = os.path.join(os.path.dirname(__file__), 'html/removesynccontacts.html')

			template_values['GA'] = config.GA
			template_values['MODE'] = config.MODE
			self.response.headers['Content-Type'] = 'text/html'
			self.response.out.write(template.render(path, template_values))

class RemoveSyncContacts (webapp.RequestHandler):
	def get(self):
		domain = gcu().split('@')[1].split('.')[0]
		if domain=='yahoo' or domain=='ymail' or domain=='rocketmail':
			token = db.get(db.Key.from_path('YahooOAuthTokens', 'yahoo_oauth_token'+gcu()))
			if token!=None and token!=False:
				memcache.delete('contacts'+gcu())
				token.delete()
		else:
			token = get_contacts_google_token(self.request)
			if token!=False and token!=None:
				client = gdata.client.GDClient()
				client.revoke_token(token)
				gdata.gauth.ae_delete('contacts' + gcu())
				memcache.delete('contacts'+gcu())
		self.redirect('/synccontactspage')

class SyncContacts (webapp.RequestHandler):
	def post(self):
		user = users.get_current_user()
		if not user:
			return
		d = memcache.get('contacts'+user.email().lower())
		if d == None:
			domain = user.email().lower().split('@')[1].split('.')[0]
			if domain=='yahoo' or domain=='ymail' or domain=='rocketmail':
				at = db.get(db.Key.from_path('YahooOAuthTokens', 'yahoo_oauth_token'+gcu()))
				if at!=None and at!=False:
					import yahoo.application
					CONSUMER_KEY      = 'dj0yJmk9SzliWElvdVlJQmtRJmQ9WVdrOWREY3pUR05YTXpJbWNHbzlOemd3TnpRMU1UWXkmcz1jb25zdW1lcnNlY3JldCZ4PWZi'
					CONSUMER_SECRET   = 'fc43654b852a220a29e054cccbf27fb1f0080b89'
					APPLICATION_ID    = 't73LcW32'
					CALLBACK_URL      = 'http://www.rawscripts.com/synccontactspage'
					oauthapp = yahoo.application.OAuthApplication(CONSUMER_KEY, CONSUMER_SECRET, APPLICATION_ID, CALLBACK_URL)
					oauthapp.token = yahoo.oauth.AccessToken.from_string(at.t)
					oauthapp.token = oauthapp.refresh_access_token(oauthapp.token)
					J = oauthapp.getContacts()
					email_list = []
					for entry in J['contacts']['contact']:
						n = None
						for f in entry['fields']:
							if f['type']=='name':
								n = '"'+f['value']['givenName']+" "+f['value']['familyName']+'"'
						for field in entry['fields']:
							if field['type']=='email':
								if n==None:
									email_list.append('<'+field['value']+'>')
								else:
									email_list.append(n+' <'+field['value']+'>')
					output = simplejson.dumps(email_list)
					memcache.set(key='contacts'+user.email().lower(), value=output, time=90000)
				else:
					#if no yahoo token
					output = '[]'
			else:
				token = get_contacts_google_token(self.request)
				if token!=False and token!=None:
					client = gdata.contacts.client.ContactsClient()
					feed = client.GetContacts(auth_token=token)
					contactlist = []
					for entry in feed.entry:
						for email in entry.email:
							if str(entry.title.text)=='None':
								contactlist.append("<"+str(email.address)+">")
							else:
								contactlist.append('"' + str(entry.title.text) + '"  <' + str(email.address)+">")
					i=0
					while i==0:
						try:
							feed = client.GetNext(feed, auth_token=token)
							for entry in feed.entry:
								for email in entry.email:
									if str(entry.title.text)=='None':
										contactlist.append("<"+str(email.address)+">")
									else:
										contactlist.append('"' + str(entry.title.text) + '"  <' + str(email.address)+">")
						except:
							i=1
					output = simplejson.dumps(contactlist)
					memcache.set(key='contacts'+user.email().lower(), value=output, time=90000)
				else:
					# if no token
					output = "[]"
		else:
			#if memecache is good
			output=d
		self.response.headers['Content-Type'] = 'text/plain'
		self.response.out.write(output)


class UploadHelp(webapp.RequestHandler):
	def get(self):
		path = os.path.join(os.path.dirname(__file__), 'html/uploadhelp.html')
		template_values={'GA' : config.GA}
		template_values['MODE'] = config.MODE
		self.response.headers['Content-Type'] = 'text/html'
		self.response.out.write(template.render(path, template_values))

class Convert(webapp.RequestHandler):
	def get(self):
		path = os.path.join(os.path.dirname(__file__), 'html/convert.html')
		template_values={'GA' : config.GA}
		template_values['MODE'] = config.MODE
		self.response.headers['Content-Type'] = 'text/html'
		self.response.out.write(template.render(path, template_values))

class YahooVerification(webapp.RequestHandler):
	def get(self):
		self.response.headers["content-Type"]="text/html"
		self.response.out.write("")


def main():
	application = webapp.WSGIApplication([('/delete', Delete),
											('/harddelete', HardDelete),
											('/undelete', Undelete),
											('/newscript', NewScript),
											('/duplicate', Duplicate),
											('/export', Export),
											('/rename', Rename),
											('/emailscript', EmailScript),
											('/user_export', UserExport),
											('/convertprocess', ConvertProcess),
											('/share', Share),
											('/removeaccess', RemoveAccess),
											('/settings', SettingsPage),
											('/synccontactspage', SyncContactsPage),
											('/removesynccontacts', RemoveSyncContacts),
											('/synccontacts', SyncContacts),
											('/changeusersetting', ChangeUserSetting),
											('/uploadhelp', UploadHelp),
											('/convert', Convert),
											('/hUoVeIFNIgngfTnTdlGQRg--.html', YahooVerification),],
											debug=True)

	run_wsgi_app(application)


if __name__ == '__main__':
	main()
