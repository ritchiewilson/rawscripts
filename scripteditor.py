import StringIO
import os
import re
import wsgiref.handlers
from google.appengine.api import memcache
from google.appengine.api import users
from google.appengine.api import mail
from google.appengine.api import urlfetch
from google.appengine.api.labs import taskqueue
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
import datetime
import random
import export
import convert
import logging
from django.utils import simplejson
import activity
import mobileTest
import chardet
import gdata.gauth
import gdata.data
import gdata.contacts.client


def get_contacts_google_token(request):
	current_user = users.get_current_user()
	if current_user is None or current_user.user_id() is None:
		return False
	token_string, token_scopes = gdata.gauth.auth_sub_string_from_url(request.url)
	if token_string is None:
		return gdata.gauth.ae_load('contacts' + users.get_current_user().email().lower())
	single_use_token = gdata.gauth.AuthSubToken(token_string, token_scopes)
	client = gdata.client.GDClient()
	session_token = client.upgrade_token(single_use_token)
	gdata.gauth.ae_save(session_token, 'contacts' + users.get_current_user().email().lower())
	return session_token

def get_contacts_yahoo_token(request):
	current_user = users.get_current_user()
	if current_user is None or current_user.user_id() is None:
		return False
	return False
	
	
def permission (resource_id):
	q = db.GqlQuery("SELECT * FROM UsersScripts "+
									"WHERE resource_id='"+resource_id+"'")
	results = q.fetch(1000)
	p=False
	for i in results:
		if i.permission=='owner' or i.permission=='ownerDeleted' or i.permission=='collab':
			if i.user==users.get_current_user().email().lower():
				p=i.title
	return p

def ownerPermission (resource_id):
	q = db.GqlQuery("SELECT * FROM UsersScripts "+
									"WHERE resource_id='"+resource_id+"'")
	results = q.fetch(1000)
	p=False
	for i in results:
		if i.permission=='owner' or i.permission=='ownerDeleted':
			if i.user==users.get_current_user().email().lower():
				p=i.title
	return p

class SpellingData (db.Model):
	resource_id = db.StringProperty()
	wrong = db.TextProperty()
	ignore = db.TextProperty()
	timestamp = db.DateTimeProperty(auto_now_add=True)

class ShareDB (db.Model):
	name = db.StringProperty()
	resource_id = db.StringProperty()
	fromPage = db.StringProperty()

class ShareNotify (db.Model):
	user= db.StringProperty()
	resource_id = db.StringProperty()
	timeshared = db.DateTimeProperty()
	timeopened = db.DateTimeProperty()
	opened = db.BooleanProperty()
	
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
	last_updated = db.DateTimeProperty()
	permission = db.StringProperty()
	folder = db.StringProperty()

class DuplicateScripts (db.Model):
	new_script = db.StringProperty()
	from_script = db.StringProperty()
	from_version = db.IntegerProperty()

class Folders (db.Model):
	data = db.StringProperty()
	user = db.StringProperty()

class UsersSettings(db.Model):
	autosave = db.BooleanProperty()

class YahooOAuthTokens (db.Model):
	t = db.BlobProperty()

class ScriptList(webapp.RequestHandler):
	"""Requests the list of the user's Screenplays in the RawScripts folder."""

	def get(self):

		template_values = { 'sign_out': users.create_logout_url('/') }
		template_values['user'] = users.get_current_user().email()

		
		
		path = os.path.join(os.path.dirname(__file__), 'html/scriptlist.html')
		mobile = mobileTest.mobileTest(self.request.user_agent)
		if mobile==1:
			path = os.path.join(os.path.dirname(__file__), 'html/mobile/MobileScriptlist.html')

		self.response.headers['Content-Type'] = 'text/html'
		self.response.out.write(template.render(path, template_values))

		q= db.GqlQuery("SELECT * FROM Users "+
									 "WHERE name='"+users.get_current_user().email()+"'")
		results = q.fetch(5)
		k=0
		for p in results:
			k=1
		if k == 0:
			newUser = Users(name=users.get_current_user().email())
			newUser.put()
		activity.activity("scriptlistpage", users.get_current_user().email().lower(), None, mobile, None, None, None, None, None,None,None,None,None, None)

class TitlePage(webapp.RequestHandler):
	def get(self):
		resource_id=self.request.get('resource_id')
		if resource_id=="Demo":
			p = "Duck Soup"
		else:
			p = ownerPermission(resource_id)
		if p==False:
			return

		if resource_id=="Demo":
			template_values = { 'sign_out': "/" }
			template_values['user'] = "test@example.com"
			
		else:
			template_values = { 'sign_out': users.create_logout_url('/') }
			template_values['user'] = users.get_current_user().email()
		
		if resource_id=="Demo":
			template_values = {'title' : "Duck Soup",
			'authorOne' : "Arthur Sheekman",
			'authorTwo' : "Harry Ruby",
			'authorTwoChecked' : "checked",
			'authorThree' : "Bert Kalmar",
			'authorThreeChecked': "checked",
			'based_on' : "none",
			'based_onChecked' : "",
			'address' : "183 E. 93rd St\nSuite 9\nNY, NY",
			'addressChecked' : "checked",
			'phone' : "212-555-5555",
			'phoneChecked' : "checked",
			'cell' : "",
			'cellChecked' : "",
			'email' : "test@example.com",
			'emailChecked' : "checked",
			'registered': "",
			'registeredChecked' : "",
			'other' : "",
			'otherChecked' : ""}
			
		else:

			q= db.GqlQuery("SELECT * FROM TitlePageData "+
										 "WHERE resource_id='"+resource_id+"'")
			results = q.fetch(5)
		
			if not len(results)==0:
				r=results[0]
				template_values = {'title' : r.title,
													 'authorOne' : r.authorOne,
													 'authorTwo' : r.authorTwo,
													 'authorTwoChecked' : r.authorTwoChecked,
													 'authorThree' : r.authorThree,
													 'authorThreeChecked': r.authorThreeChecked,
													 'based_on' : r.based_on.replace("LINEBREAK", '\n'),
													 'based_onChecked' : r.based_onChecked,
													 'address' : r.address.replace("LINEBREAK", '\n'),
													 'addressChecked' : r.addressChecked,
													 'phone' : r.phone,
													 'phoneChecked' : r.phoneChecked,
													 'cell' : r.cell,
													 'cellChecked' : r.cellChecked,
													 'email' : r.email,
													 'emailChecked' :r.emailChecked,
													 'registered': r.registered,
													 'registeredChecked' : r.registeredChecked,
													 'other' : r.other,
													 'otherChecked' : r.otherChecked}
			else:
				q = db.GqlQuery("SELECT * FROM UsersScripts "+
												"WHERE resource_id='"+resource_id+"'")
				results=q.fetch(5)

				template_values = {'title' : results[0].title,
													 'authorOne' : users.get_current_user().nickname(),
													 'authorTwo' : "",
													 'authorTwoChecked' : "",
													 'authorThree' : "",
													 'authorThreeChecked': "",
													 'based_on' : "",
													 'based_onChecked' : "",
													 'address' : "",
													 'addressChecked' : "",
													 'phone' : "",
													 'phoneChecked' : "",
													 'cell' : "",
													 'cellChecked' : "",
													 'email' : users.get_current_user().email(),
													 'emailChecked' : "checked",
													 'registered': "",
													 'registeredChecked' : "",
													 'other' : "",
													 'otherChecked' : ""}
			

		path = os.path.join(os.path.dirname(__file__), 'html/titlepage.html')

		self.response.headers['Content-Type'] = 'text/html'
		self.response.out.write(template.render(path, template_values))
		mobile = mobileTest.mobileTest(self.request.user_agent)
		user = users.get_current_user()
		if user:
			user = user.email().lower()
		else:
			user = "test@example.com"
		activity.activity("titlepage", user, resource_id, mobile, None, None, None, None, None,None,None,None,None, None)

class SaveTitlePage (webapp.RequestHandler):
	def post(self):
		resource_id=self.request.get('resource_id')
		if resource_id=="Demo":
			return
		title = ownerPermission(resource_id)
		if not title==False:
			q= db.GqlQuery("SELECT * FROM TitlePageData "+
										 "WHERE resource_id='"+resource_id+"'")
			results = q.fetch(5)
			if not len(results)==0:
				i=results[0]

			else:
				i = TitlePageData()
				
			i.resource_id= resource_id
			i.title = self.request.get('title')
			i.authorOne = self.request.get('authorOne')
			i.authorTwo = self.request.get('authorTwo')
			i.authorTwoChecked = self.request.get('authorTwoChecked')
			i.authorThree = self.request.get('authorThree')
			i.authorThreeChecked = self.request.get('authorThreeChecked')
			i.based_on = self.request.get('based_on')
			i.based_onChecked = self.request.get('based_onChecked')
			i.address = self.request.get('address')
			i.addressChecked = self.request.get('addressChecked')
			i.phone = self.request.get('phone')
			i.phoneChecked = self.request.get('phoneChecked')
			i.cell = self.request.get('cell')
			i.cellChecked = self.request.get('cellChecked')
			i.email = self.request.get('email')
			i.emailChecked = self.request.get('emailChecked')
			i.registered = self.request.get('registered')
			i.registeredChecked = self.request.get('registeredChecked')
			i.other = self.request.get('other')
			i.otherChecked = self.request.get('otherChecked')
			i.put()

			self.response.headers['Content-Type']='text/plain'
			self.response.out.write('1')
			mobile = mobileTest.mobileTest(self.request.user_agent)
			activity.activity("titlepagesave", users.get_current_user().email().lower(), resource_id, mobile, None, None, None, None, None,None,None,None,None, None)

class List (webapp.RequestHandler):
	def post(self):
		mobile = mobileTest.mobileTest(self.request.user_agent)
		user = users.get_current_user().email().lower()
		
		q=db.GqlQuery("SELECT * FROM ShareNotify "+
						"WHERE user='"+user+"' "+
						"AND opened=False")
		unopened = q.fetch(500)
		
		q= db.GqlQuery("SELECT * FROM UsersScripts "+
									 "WHERE user='"+user+"' "+
									 "ORDER BY last_updated DESC")
		results = q.fetch(1000)
		now = datetime.datetime.today()
		owned = []
		shared = []
		ownedDeleted = []
		for i in results:
			d = now - i.last_updated
			if d.days>0:
				i.updated=i.last_updated.strftime("%b %d")
			elif d.seconds>7200:
				i.updated = str(int(round(d.seconds/3600))) + " hours ago"
			elif d.seconds>60:
				i.updated= str(int(round(d.seconds/60))) + " minutes ago"
			else:
				i.updated = "Seconds ago"
				
			
			#getting notesnotification info for scripts
			nnq=db.GqlQuery("SELECT * FROM NotesNotify "+
							"WHERE resource_id='"+i.resource_id+"' "+
							"AND user='"+user+"'")
			nn=nnq.fetch(500)
			new_notes=0
			for c in nn:
				new_notes=new_notes+c.new_notes		
			#now put these bits in the right array
			if i.permission=='owner':
				q=db.GqlQuery("SELECT * FROM UsersScripts "+
											"WHERE resource_id='"+i.resource_id+"'")
				p=q.fetch(500)
				sharingArr=[]
				for j in p:
					if j.user.lower()!=users.get_current_user().email().lower():
						sharingArr.append(j.user)
				owned.append([i.resource_id, i.title, i.updated, i.permission, sharingArr, new_notes, i.folder])
			elif i.permission=="ownerDeleted":
				q=db.GqlQuery("SELECT * FROM UsersScripts "+
											"WHERE resource_id='"+i.resource_id+"'")
				p=q.fetch(500)
				sharingArr=[]
				for j in p:
					if j.user.lower()!=users.get_current_user().email().lower():
						sharingArr.append(j.user)
				ownedDeleted.append([i.resource_id, i.title, i.updated, i.permission, sharingArr,  i.folder])
			elif i.permission=="collab":
				q=db.GqlQuery("SELECT * FROM UsersScripts "+
											"WHERE resource_id='"+i.resource_id+"' "+
											"AND permission='owner'")
				p=q.fetch(1)
				uo=False
				for ra in unopened:
					if i.resource_id==ra.resource_id:
						uo=True
				shared.append([i.resource_id, i.title, i.updated, p[0].user, new_notes,  i.folder, str(uo)])
		
		q=db.GqlQuery("SELECT * FROM Folders WHERE user='"+users.get_current_user().email().lower()+"'")
		f = q.fetch(1)
		if len(f)==0:
			folders=[]
		else:
			folders=simplejson.loads(f[0].data)
		pl=[owned, ownedDeleted, shared, folders]
		
		j = simplejson.dumps(pl)
		self.response.headers['Content-Type']='text/plain'
		self.response.out.write(j)
		activity.activity("list", users.get_current_user().email().lower(), None, mobile, len(owned), None, None, None, None,None,None,None,None, None)

class Delete (webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		q = db.GqlQuery("SELECT * FROM UsersScripts "+
										"WHERE resource_id='"+resource_id+"'")
		results = q.fetch(1000)
		p=False
		for i in results:
			if i.permission=='owner':
				if i.user==users.get_current_user().email().lower():
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
		activity.activity("delete", users.get_current_user().email().lower(), resource_id, mobile, None, None, None, None, None,None,None,None,None, None)
		
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
			mobile = mobileTest.mobileTest(self.request.user_agent)
			activity.activity("undelete", users.get_current_user().email().lower(), resource_id, mobile, None, None, None, None, None,None,None,None,None, None)
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
			mobile = mobileTest.mobileTest(self.request.user_agent)
			activity.activity("harddelete", users.get_current_user().email().lower(), resource_id, mobile, None, None, None, None, None,None,None,None,None, None)

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
		p=False
		for i in results:
			if i.permission=='owner':
				if i.user==users.get_current_user().email().lower():
					p=True
		if p==True:
			for i in results:
				i.title=rename
				i.put()
			activity.activity("rename", users.get_current_user().email().lower(), resource_id, 0, None, None, None, None, None,rename,None,None,None, None)
		

class Export (webapp.RequestHandler):
	def get(self):
		
		fromPage = self.request.get('fromPage')
		resource_id = self.request.get('resource_id')
		if resource_id=="Demo":
			return
		export_format = self.request.get('export_format')
		title_page = self.request.get('title_page')
		user=users.get_current_user().email().lower()
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
				results = q.fetch(1000)
				data=results[0].data
				
				if export_format =='txt':
					newfile = export.Text(data, str(title), title_page, resource_id)
					filename = 'filename=' + str(title) + '.txt'  
					self.response.headers['Content-Type'] = 'text/plain'
				elif export_format=='pdf':
					newfile = export.Pdf(data, str(title), title_page, resource_id)
					filename = 'filename=' + str(title) + '.pdf'
					self.response.headers['Content-Type'] = 'application/pdf'

				J = simplejson.loads(results[0].export)
				arr=[export_format, str(datetime.datetime.today())]
				J[1].append(arr)
				results[0].export=simplejson.dumps(J)
				results[0].put()

				self.response.headers['Content-Disposition'] = 'attachment; ' +filename
				self.response.out.write(newfile.getvalue())
				mobile = mobileTest.mobileTest(self.request.user_agent)
				activity.activity("export", users.get_current_user().email().lower(), resource_id, mobile, len(newfile.getvalue()), None, None, None, None,title,export_format,None,fromPage, None)
	
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
		results = q.fetch(1000)
		data=results[0].data
		newfile = export.Pdf(data, str(title), title_page, resource_id)
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
				logging.info('notSent')
				self.response.headers['Content-Type'] = 'text/plain'
				self.response.out.write('not sent')
				return
		ownerTest = db.get(db.Key.from_path('UsersScripts', 'owner'+users.get_current_user().email().lower()+resource_id))
		if ownerTest!=None:
			J = simplejson.loads(results[0].export)
			t=str(datetime.datetime.today())

			for recipient in recipients:
				J[0].append([recipient, t])
				results[0].export=simplejson.dumps(J)
				results[0].put()
	 
		self.response.headers['Content-Type'] = 'text/plain'
		self.response.out.write('sent')
		mobile = mobileTest.mobileTest(self.request.user_agent)
		activity.activity("email", users.get_current_user().email().lower(), resource_id, mobile, len(newfile.getvalue()), None, None, None, None,title,'pdf',len(recipients),fromPage, None)
		

class NewScript (webapp.RequestHandler):
	def post(self):
			
		filename = self.request.get('filename')
		filename = filename.replace('%20', ' ')
		fromPage = self.request.get('fromPage')
		user=users.get_current_user().email()
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
		
		s = ScriptData(resource_id=resource_id,
									 data='[["Fade In:",1],["Int. ",0]]',
									 version=1,
									 export='[[],[]]',
									 tag='',
									 autosave=0)
		s.put()

		s = SpellingData(resource_id=resource_id,
									 wrong='[]',
									 ignore="[]")
		s.put()

		u = UsersScripts(key_name="owner"+user.lower()+resource_id,
						user=user.lower(),
						title=filename,
						resource_id=resource_id,
						last_updated = datetime.datetime.today(),
						permission='owner',
						folder = "?none?")
		u.put()
		self.response.headers['Content-Type'] = 'text/plain'
		self.response.out.write(resource_id)
		activity.activity("newscript", users.get_current_user().email().lower(), resource_id, 0, None, None, None, None, None,filename,None,None,fromPage, None)

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
			results = q.fetch(1000)
			data=results[0].data
			version=results[0].version
			user=users.get_current_user().email()
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
			
			s = ScriptData(resource_id=new_resource_id,
										 data=data,
										 version=version+1,
										 export="[[],[]]",
										 tag="",
										 autosave=0)
			s.put()
			d= DuplicateScripts(new_script = new_resource_id,
													from_script = resource_id,
													from_version=version)

			d.put()
			u = UsersScripts(key_name="owner"+user.lower()+new_resource_id,
							user=user.lower(),
							title='Copy of '+title,
							resource_id=new_resource_id,
							last_updated = datetime.datetime.today(),
							permission='owner',
							folder = "?none?")
			u.put()
			q=db.GqlQuery("SELECT * FROM SpellingData "+
										"WHERE resource_id='"+resource_id+"'")
			r=q.fetch(2)
			s= SpellingData(resource_id=new_resource_id,
											wrong=r[0].wrong,
											ignore=r[0].ignore)
			s.put()
			self.response.headers['Content-Type'] = 'text/plain'
			self.response.out.write('/editor?resource_id='+new_resource_id)
			activity.activity("duplicate", users.get_current_user().email().lower(), resource_id, 0, len(data), None, None, None, None,new_resource_id,None,None,None, None)
			
		
class ConvertProcess (webapp.RequestHandler):
	def post(self):

		# New Script Setup
		filename = "Untitled"
		ff = self.request.get('ff')
		capture = self.request.get('filename')
		if capture:
			filename = capture.replace('%20', ' ')
		user=users.get_current_user().email()
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
			e = chardet.detect(data.getvalue())
			if e["encoding"]!=None and e["encoding"]!="ascii":
				r = data.getvalue().decode(e["encoding"])
				data = StringIO.StringIO(r.encode("ascii", "replace"))
			contents = convert.Text(data)
		elif ff=='html':
			#this was to help herrard costales migrate scritps. should be taken out
			myparser = MyParser()
			myparser.parse(data.read())
			l = myparser.get_hyperlinks()
			i=0
			while i<len(l):
				if l[i][0]=='':
					l.pop(i)
				else:
					i+=1
			i=0
			while i<len(l):
				if l[i][1]==7:
					l.pop(i)
					l.pop(i)
					l[i-1][0]=l[i-1][0]+" "+l[i][0]
					l.pop(i)
				else:
					i+=1
			contents = simplejson.dumps(l)
		else:
			contents = convert.Celtx(data)
		

		s = ScriptData(resource_id=resource_id,
									 data=contents,
									 version=1,
									 tag="",
									 export="[[],[]]",
									 autosave=0)
		s.put()

		u = UsersScripts(key_name="owner"+user.lower()+resource_id,
						user=user.lower(),
						title=filename,
						resource_id=resource_id,
						last_updated = datetime.datetime.today(),
						permission='owner',
						folder = "?none?")
		u.put()
		

		template_values = { 'url': resource_id }

		taskqueue.add(url="/spellcheckbigscript", params= {'resource_id' : resource_id})
		
		self.response.headers['Content-Type'] = 'text/html'
		path = os.path.join(os.path.dirname(__file__), 'html/UploadComplete.html')
		self.response.out.write(template.render(path, template_values))
		activity.activity("convert", users.get_current_user().email().lower(), resource_id, 0, len(contents), None, None, None, None,filename,ff,None,None, None)
		

import sgmllib

class MyParser(sgmllib.SGMLParser):
		"A simple parser class."
		def parse(self, s):
				"Parse the given string 's'."
				self.feed(s)
				self.close()

		def __init__(self, verbose=0):
				"Initialise an object, passing 'verbose' to the superclass."

				sgmllib.SGMLParser.__init__(self, verbose)
				self.hyperlinks = []
				self.startT = None

		def handle_data(self, data):
				if self.startT is not None:
						data = data.replace('\r\n','').replace('\n','')
						data= data.strip()
						self.hyperlinks.append([data, self.startT])
				
		def start_h1(self, attributes):
				self.startT=0
		def start_h2(self, attributes):
				self.startT=1
		def start_h3(self, attributes):
				if len(attributes)!=0 and attributes[0][1]=='more':
						self.startT=7
				else:
						self.startT=2
		def start_h4(self, attributes):
				self.startT=3
		def start_h5(self, attributes):
				if len(attributes)!=0 and attributes[0][1]=='pn':
						self.startT=None
				else:
					 self.startT=4 
		def start_h6(self, attributes):
				self.startT=5
		def start_div(self, attributes):
				self.startT=None
		def start_span(self, attributes):
				self.startT=None

		def get_hyperlinks(self):
				"Return the list of hyperlinks."
				return self.hyperlinks

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
					u = UsersScripts(key_name="collab"+i.lower()+resource_id,
									resource_id=resource_id,
									permission="collab",
									user = i.lower(),
									last_updated = datetime.datetime.today(),
									title = p,
									folder = "?none?")
					u.put()
			if output!=[]:
				subject=users.get_current_user().email() + " has shared a script with you on RawScripts.com"
				body_message="http://www.rawscripts.com/editor?resource_id="+resource_id
				result = urlfetch.fetch("http://www.rawscripts.com/text/notify.txt")
				htmlbody = result.content
				html = htmlbody.replace("SCRIPTTITLE", p)
				html = html.replace("USER",users.get_current_user().email())
				html = html.replace("SCRIPTURL", "http://www.rawscripts.com/editor?resource_id="+resource_id)
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
			mobile = mobileTest.mobileTest(self.request.user_agent)
			activity.activity("share", users.get_current_user().email().lower(), resource_id, mobile, None, None, None, None, None,p,None,len(output),fromPage, None)
			for i in output:
				s = ShareNotify(user = i,
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
			q=db.GqlQuery("SELECT * FROM NotesNotify "+
							"WHERE resource_id='"+resource_id+"' "+
							"AND user='"+person.lower()+"'")
			r=q.fetch(500)
			for i in r:
				i.delete()
			remove_person = self.request.get('removePerson')
			self.response.headers['Content-Type'] = 'text/plain'
			self.response.out.write(remove_person.lower())
			mobile = mobileTest.mobileTest(self.request.user_agent)
			activity.activity("removeaccess", users.get_current_user().email().lower(), resource_id, mobile, None, None, None, None, None,p,None,None,fromPage, None)
			q=db.GqlQuery("SELECT * FROM ShareNotify "+
						"WHERE resource_id='"+resource_id+"' "+
						"AND user='"+person.lower()+"'")
			r=q.fetch(1)
			if len(r)!=0:
				r[0].delete()

class NewFolder (webapp.RequestHandler):
	def post(self):
		user=users.get_current_user().email().lower()
		folder_name= self.request.get('folder_name')
		folder_id=self.request.get('folder_id')
		q=db.GqlQuery("SELECT * FROM Folders "+
						"WHERE user='"+user+"'")
		r=q.fetch(1)
		if len(r)==0:
			f=Folders(user=user,
						data=simplejson.dumps([[folder_name, folder_id]]))
			f.put()
		else:
			J=simplejson.loads(r[0].data)
			J.append([folder_name, folder_id])
			r[0].data=simplejson.dumps(J)
			r[0].put()
		activity.activity("newfolder", users.get_current_user().email().lower(), None, 0, None, None, None, folder_id, None,folder_name,None,None,None, None)

class ChangeFolder (webapp.RequestHandler):
	def post(self):
		resource_id=self.request.get("resource_id").split(',')
		for i in resource_id:
			p = ownerPermission(i)
			if not p==False:
				q = db.GqlQuery("SELECT * FROM UsersScripts "+
								"WHERE resource_id='"+i+"' "+
								"and permission='owner'")
				r=q.fetch(1)
				r[0].folder = self.request.get("folder_id")
				r[0].put()
		self.response.out.write("1")
		activity.activity("changefolder", users.get_current_user().email().lower(), None, 0, None, None, None, self.request.get("folder_id"), len(resource_id),None,None,None,None, None)
			
		
class DeleteFolder (webapp.RequestHandler):
	def post(self):
		folder_id=self.request.get("folder_id")
		q=db.GqlQuery("SELECT * FROM UsersScripts "+
						"WHERE user='"+users.get_current_user().email().lower()+"' "+
						"AND permission='owner'")
		r=q.fetch(500)
		for i in r:
			if i.folder == folder_id:
				i.folder="?none?"
				i.put()
		q=db.GqlQuery("SELECT * FROM Folders WHERE user='"+users.get_current_user().email().lower()+"'")
		r=q.fetch(1)
		folders = simplejson.loads(r[0].data)
		arr=[]
		for i in folders:
			if i[1]!=folder_id:
				arr.append(i)
		r[0].data = simplejson.dumps(arr)
		r[0].put()
		self.response.out.write("1")
		activity.activity("deletefolder", users.get_current_user().email().lower(), None, 0, None, None, None, folder_id, None,None,None,None,None, None)

class RenameFolder (webapp.RequestHandler):
	def post(self):
		folder_id=self.request.get("folder_id")
		q=db.GqlQuery("SELECT * FROM Folders WHERE user='"+users.get_current_user().email().lower()+"'")
		r=q.fetch(1)
		folders = simplejson.loads(r[0].data)
		arr=[]
		for i in folders:
			if i[1]==folder_id:
				i[0]=self.request.get("folder_name")
			arr.append(i)
		r[0].data = simplejson.dumps(arr)
		r[0].put()
		self.response.out.write("1")

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
			if user.email().lower().split('@')[1].split('.')[0]=='gmail':
				template_values['domain'] = 'Google'
				token = get_contacts_google_token(self.request)
				if token==False or token==None:
					template_values['syncContactsText']='OFF'
				else:
					template_values['syncContactsText']='ON'
			elif user.email().lower().split('@')[1].split('.')[0]=='yahoo':
				template_values['domain'] = 'Yahoo'
				template_values['syncContactsText']='OFF'
			
			try:
				us = db.get(db.Key.from_path('UsersSettings', 'settings'+users.get_current_user().email().lower()))
			except:
				us = None
			if us==None:
				us = UsersSettings(key_name='settings'+users.get_current_user().email().lower(),
									autosave=True)
				us.put()
				template_values['autosaveEnabled']='checked'
				template_values['autosaveDisabled']=''
			
			else:
				if us.autosave==True:
					template_values['autosaveEnabled']='checked'
					template_values['autosaveDisabled']=''
				else:
					template_values['autosaveEnabled']=''
					template_values['autosaveDisabled']='checked'
			
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
				us = db.get(db.Key.from_path('UsersSettings', 'settings'+users.get_current_user().email().lower()))
			except:
				us = None
			if us==None:
				us = UsersSettings(key_name='settings'+users.get_current_user().email().lower(),
									autosave=True)
			if k=='autosave':
				if v=='Enable':
					value=True
				else:
					value=False
				us.autosave=value
				us.put()
			self.response.headers['Content-Type'] = 'text/plain'
			self.response.out.write('sent')
			
class SyncContactsPage (webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		if not user:
			self.redirect('/')
			return
		else:
			template_values = {}
			if user.email().lower().split('@')[1].split('.')[0]=='gmail':
				template_values['domain'] = 'Google'
				google_token = get_contacts_google_token(self.request)
				if google_token == None:
					template_values['auth_url'] = gdata.gauth.generate_auth_sub_url(self.request.url, ['http://www.google.com/m8/feeds/'])
					path = os.path.join(os.path.dirname(__file__), 'html/synccontacts.html')
				else:
					path = os.path.join(os.path.dirname(__file__), 'html/removesynccontacts.html')
			elif user.email().lower().split('@')[1].split('.')[0]=='yahoo':
				template_values['domain'] = 'Yahoo'
				#yahoo_token = get_contacts_yahoo_token(self.request)
				import yahoo.application
				
				verifier  = self.request.get('oauth_verifier') 
				if verifier=='':
					CONSUMER_KEY      = 'dj0yJmk9SzliWElvdVlJQmtRJmQ9WVdrOWREY3pUR05YTXpJbWNHbzlOemd3TnpRMU1UWXkmcz1jb25zdW1lcnNlY3JldCZ4PWZi'
					CONSUMER_SECRET   = 'fc43654b852a220a29e054cccbf27fb1f0080b89'
					APPLICATION_ID    = 't73LcW32'
					CALLBACK_URL      = 'http://www.rawscripts.com/synccontactspage'
					oauthapp      = yahoo.application.OAuthApplication(CONSUMER_KEY, CONSUMER_SECRET, APPLICATION_ID, CALLBACK_URL)
					request_token = oauthapp.get_request_token(CALLBACK_URL)
					redirect_url  = oauthapp.get_authorization_url(request_token)
					template_values['auth_url'] = redirect_url
					path = os.path.join(os.path.dirname(__file__), 'html/synccontacts.html')
				else:
					CALLBACK_URL = 'http://www.rawscripts.com/synccontactspage'
					request_token = oauthapp.get_request_token(CALLBACK_URL)
					access_token  = oauthapp.get_access_token(request_token, verifier)
					m = YahooOAuthTokens(key_name = 'yahoo_oauth_token_'+users.get_current_user().email().lower(),
										t=db.Blob(access_token))
					m.put()
					path = os.path.join(os.path.dirname(__file__), 'html/removesynccontacts.html')
					
			
			self.response.headers['Content-Type'] = 'text/html'
			self.response.out.write(template.render(path, template_values))
			
class RemoveSyncContacts (webapp.RequestHandler):
	def get(self):
		token = get_contacts_google_token(self.request)
		if token!=False and token!=None:
			client = gdata.client.GDClient()
			client.revoke_token(token)
			gdata.gauth.ae_delete('contacts' + users.get_current_user().email().lower())
			memcache.delete('contacts'+users.get_current_user().email().lower())
		self.redirect('/synccontactspage')

class SyncContacts (webapp.RequestHandler):
	def post(self):
		try:
			user = users.get_current_user()
			if not user:
				return
			d = memcache.get('contacts'+user.email().lower())
			if d == None:
				if user.email().lower().split('@')[1].split('.')[0]=='gmail':
					token = get_contacts_google_token(self.request)
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
				elif user.email().lower().split('@')[1].split('.')[0]=='yahoo':
					output = '[]'
			else:
				output=d
		except:
			output = '[]'
		
		self.response.headers['Content-Type'] = 'text/plain'
		self.response.out.write(output)


class OneScript (webapp.RequestHandler):
	def get(self):
		return
		q=db.GqlQuery("SELECT * FROM UsersScripts")
		r=q.fetch(1000)
		for i in r:
			perm = "owner"
			if i.permission[0]=="c":
				perm = "collab"
			else:
				perm = "owner"
			u = UsersScripts(key_name = perm+i.user+i.resource_id,
							user = i.user,
							resource_id = i.resource_id,
							title = i.title,
							last_updated = i.last_updated,
							permission = i.permission,
							folder = "?none?")
			i.delete()
			u.put()
		self.response.headers["Content-Type"]="text/plain"
		self.response.out.write(len(r))

def main():
	application = webapp.WSGIApplication([('/scriptlist', ScriptList),
											('/delete', Delete),
											('/harddelete', HardDelete),
											('/undelete', Undelete),
											('/newscript', NewScript),
											('/duplicate', Duplicate),
											('/export', Export),
											('/rename', Rename),
											('/emailscript', EmailScript),
											('/convertprocess', ConvertProcess),
											('/share', Share),
											('/removeaccess', RemoveAccess),
											('/titlepage', TitlePage),
											('/titlepagesave', SaveTitlePage),
											('/newfolder', NewFolder),
											("/onescript", OneScript),
											("/changefolder", ChangeFolder),
											("/deletefolder", DeleteFolder),
											('/renamefolder', RenameFolder),
											('/settings', SettingsPage),
											('/synccontactspage', SyncContactsPage),
											('/removesynccontacts', RemoveSyncContacts),
											('/synccontacts', SyncContacts),
											('/changeusersetting', ChangeUserSetting),
											('/list', List),],
											debug=True)
	
	wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
	main()

