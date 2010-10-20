import StringIO
import os
import wsgiref.handlers
from google.appengine.api import users
from google.appengine.api import urlfetch
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api.labs import taskqueue
import random
import datetime
import logging
from django.utils import simplejson
import activity
import mobileTest

def permission (resource_id):
	q = db.GqlQuery("SELECT * FROM UsersScripts "+
									"WHERE resource_id='"+resource_id+"'")
	results = q.fetch(1000)
	p=False
	for i in results:
		if i.permission=='owner' or i.permission=="collab":
			if i.user==users.get_current_user().email().lower():
				p=i.permission
	return p

def ownerPermission (resource_id):
	q = db.GqlQuery("SELECT * FROM UsersScripts "+
									"WHERE resource_id='"+resource_id+"'")
	results = q.fetch(1000)
	p=False
	for i in results:
		if i.permission=='owner':
			if i.user==users.get_current_user().email().lower():
				p=i.title
	return p

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

class DuplicateScripts (db.Model):
	new_script = db.StringProperty()
	from_script = db.StringProperty()
	from_version = db.IntegerProperty()

class SpellingData (db.Model):
	resource_id = db.StringProperty()
	wrong = db.TextProperty()
	ignore = db.TextProperty()
	timestamp = db.DateTimeProperty(auto_now_add=True)

class NewThread(webapp.RequestHandler):
	def post(self):
		resource_id=self.request.get('resource_id')
		fromPage=self.request.get('fromPage')
		try:
			user=users.get_current_user().email()
		except:
			user = 'test@example.com'
		row = self.request.get('row')
		col = self.request.get('col')
		thread_id = self.request.get('thread_id')
		content = self.request.get('content')
		d = str(datetime.datetime.today())
		if resource_id=="Demo":
			logging.info('hey')
			self.response.headers["Content-Type"]="text/plain"
			self.response.out.write(simplejson.dumps([row, col,thread_id, d, user]))
			return
		p = permission(resource_id)
		if not p==False:
			arr = [[content, user, d]]
			data = simplejson.dumps(arr)
			n=Notes(resource_id=resource_id,
							thread_id=thread_id,
							data=data,
							row=int(row),
							col=int(col))
			n.put()
			q=db.GqlQuery("SELECT * FROM UsersScripts "+
							"WHERE resource_id='"+resource_id+"'")
			r=q.fetch(500)
			for i in r:
				if not i.user==users.get_current_user().email().lower():
					nn = UnreadNotes(key_name=i.user+resource_id+thread_id+d,
									resource_id=resource_id,
									user=i.user,
									thread_id=thread_id,
									msg_id=d)
					nn.put()
					#taskqueue.add(url="/notesnotification", params= {'resource_id' : resource_id, 'user' : i.user, 'msg_id' : d, 'thread_id' : thread_id})
					
			self.response.headers["Content-Type"]="text/plain"
			if fromPage=='mobileviewnotes':
				self.response.out.write('sent')
			else:
				self.response.out.write(simplejson.dumps([row, col,thread_id, d, user]))
			mobile = mobileTest.mobileTest(self.request.user_agent)
			activity.activity("newthread", users.get_current_user().email().lower(), resource_id, mobile, len(data), None, None, thread_id, None,None,p,None,fromPage, None)
							
class SubmitMessage(webapp.RequestHandler):
	def post(self):
		resource_id=self.request.get('resource_id')
		try:
			user=users.get_current_user().email()
		except:
			user = 'test@example.com'
		thread_id = self.request.get('thread_id')
		content = self.request.get('content')
		msg_id = self.request.get('msg_id')
		fromPage = self.request.get('fromPage')
		d = str(datetime.datetime.today())
		if resource_id=="Demo":
			output = simplejson.dumps([content, msg_id, user, thread_id])
			self.response.headers["Content-Type"]="text/plain"
			self.response.out.write(output)
			return
		p = permission(resource_id)
		if not p==False:

			q = db.GqlQuery("SELECT * FROM Notes "+
									 "WHERE resource_id='"+resource_id+"' "+
									 "AND thread_id='"+thread_id+"'")
			r=q.get()
			J = simplejson.loads(r.data)
			found = False
			for i in J:
				if i[2]==msg_id:
					if i[1] == user:
						i[0]=content
						user = i[1]
						d = i[2]
					found=True
			if found==False:
				J.append([content,user,d])
			r.data=simplejson.dumps(J)
			r.put()
			output = simplejson.dumps([content, d, user, thread_id])
			
			q=db.GqlQuery("SELECT * FROM UsersScripts "+
							"WHERE resource_id='"+resource_id+"'")
			r=q.fetch(500)
			for i in r:
				if not i.user==user.lower():
					n = UnreadNotes(key_name=i.user+resource_id+thread_id+d,
									resource_id=resource_id,
									thread_id=thread_id,
									user=i.user,
									msg_id=d)
					n.put()
					#taskqueue.add(url="/notesnotification", params= {'resource_id' : resource_id, 'user' : i.user, 'msg_id' : d, 'thread_id' : thread_id})
						
			self.response.headers["Content-Type"]="text/plain"
			if fromPage=='mobileviewnotes':
				self.response.out.write('sent')
			else:
				self.response.out.write(output)
			mobile = mobileTest.mobileTest(self.request.user_agent)
			activity.activity("notesresponse", users.get_current_user().email().lower(), resource_id, mobile, len(content), None, None, thread_id, None,None,p,None,fromPage, None)

class Position (webapp.RequestHandler):
	def post(self):
		resource_id=self.request.get('resource_id')
		if resource_id=="Demo":
			return
		p = ownerPermission(resource_id)
		if not p==False:
			positions = self.request.get('positions')
			J = simplejson.loads(positions)
			for i in J:
				q=db.GqlQuery("SELECT * FROM Notes "+
							"WHERE resource_id='"+resource_id+"' "+
							"AND thread_id='"+str(i[2])+"'")
				r=q.fetch(1)
				r[0].row  = i[0]
				r[0].col = i[1]
				r[0].put()
			self.response.headers["Content-type"]="plain/text"
			self.response.out.write('1')


class DeleteThread (webapp.RequestHandler):
	def post(self):
		resource_id=self.request.get('resource_id')
		if resource_id=="Demo":
			return
		p = ownerPermission(resource_id)
		if not p==False:
			fromPage=self.request.get('fromPage')
			thread_id = self.request.get('thread_id')
			q=db.GqlQuery("SELECT * FROM Notes "+
						"WHERE resource_id='"+resource_id+"' "+
						"AND thread_id='"+thread_id+"'")
			r=q.fetch(1)
			r[0].delete()
			
			q=db.GqlQuery("SELECT * FROM UnreadNotes "+
							"WHERE resource_id='"+resource_id+"' "+
							"AND thread_id='"+thread_id+"'")
			un=q.fetch(1000)
			for i in un:
				i.delete()
			mobile = mobileTest.mobileTest(self.request.user_agent)
			activity.activity("deletethread", users.get_current_user().email().lower(), resource_id, mobile, None, None, None, thread_id, None,None,None,None,fromPage, None)

class DeleteMessage(webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		thread_id=self.request.get('thread_id')
		msg_id=self.request.get('msgId')
		if resource_id=="Demo":
			self.response.out.write('deleted')
			return
		else:
			q=db.GqlQuery("SELECT * FROM Notes "+
							"WHERE resource_id='"+resource_id+"' "+
							"AND thread_id='"+thread_id+"'")
			r=q.get()
			if r==None:
				self.response.out.write('no thread')
				return
			else:
				p = ownerPermission(resource_id)
				J = simplejson.loads(r.data)
				newJ=[]
				deleted=False
				for i in J:
					if i[2]==msg_id:
						if p!=False or i[1]==users.get_current_user().email().lower():
							deleted=True
						else:
							newJ.append(i)
					else:
						newJ.append(i)
				if len(newJ)==0:
					r.delete()
				else:
					r.data=simplejson.dumps(newJ)
					r.put()
				self.response.headers['Content-Type'] = 'text/plain'
				if deleted==True:
					q=db.GqlQuery("SELECT * FROM UnreadNotes "+
									"WHERE resource_id='"+resource_id+"' "+
									"AND thread_id='"+thread_id+"'")
					un=q.fetch(1000)
					for i in un:
						if i.msg_id==msg_id:
							i.delete()
					self.response.out.write('deleted')
				else:
					self.response.out.write('error')

class MarkAsRead(webapp.RequestHandler):
	def post(self):
		try:
			user=users.get_current_user().email()
		except:
			user = 'test@example.com'
		msg_id = self.request.get('msg_id')
		thread_id = self.request.get('thread_id')
		resource_id = self.request.get('resource_id')
		logging.info(user+resource_id+thread_id+msg_id)
		un = db.get(db.Key.from_path('UnreadNotes', user+resource_id+thread_id+msg_id))
		if un!=None:
			un.delete()
		self.response.headers['Content-Type'] = 'text/plain'
		self.response.out.write('ok')
		
class ViewNotes(webapp.RequestHandler):
	def get(self):
		resource_id=self.request.get('resource_id')
		if resource_id=="Demo":
			return
		title = permission(resource_id)
		if not title==False:
			f = ownerPermission(resource_id)
			q = db.GqlQuery("SELECT * FROM Notes "+
							"WHERE resource_id='"+resource_id+"'")
			r=q.fetch(500)
			export=[]
			for i in r:
				export.append([i.row, i.col, simplejson.loads(i.data), i.thread_id])
				
			template_values={'j':simplejson.dumps(export),
							"user":users.get_current_user().email(),
							"sign_out": users.create_logout_url("/"),
							"title":title,
							"f":f
							}
			path = os.path.join(os.path.dirname(__file__), 'html/mobile/MobileViewNotes.html')
			self.response.out.write(template.render(path, template_values))
			
			activity.activity("viewnotes", users.get_current_user().email().lower(), resource_id, 1, None, None, None, None, None,None,title,None,None, None)

class Notification(webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		user = self.request.get('user')
		thread_id = self.request.get('thread_id')
		msg_id = self.request.get('msg_id')
		q = db.GqlQuery("SELECT * FROM UsersScripts "+
						"WHERE user='"+user+"' "+
						"AND resource_id='"+resource_id+"'")
		r = q.get()
		s = db.get(db.Key.from_path('UsersSettings', 'settings'+user))
		send = False
		if s == None:
			send = True
		elif r.permission=='owner':
			if s.owned == 'every':
				send=True
			else:
				send=False
		else:
			if s.shared=='every':
				send=True
			else:
				send=False
		
		q = db.GqlQuery("SELECT * FROM Users")
		r = q.fetch(1000)
		#check if user exists in db (ue)
		#need a better way to do this.
		ue=False
		for i in r:
			if i.name.lower()==user.lower():
				ue=True
		
		if send==True and ue==True:
			q = db.GqlQuery("SELECT * FROM Notes "+
							"WHERE resource_id='"+resource_id+"' "+
							"AND thread_id='"+thread_id+"'")
			J=simplejson.loads(q.get())
			data=None
			for i in J:
				if i[2]==msg_id:
					data=i[0]
			
			if not data==None:
				subject = user + ' Left A Note On The Script "' + r.title + '"'
				body_message="http://www.rawscripts.com/editor?resource_id="+resource_id
				result = urlfetch.fetch("http://www.rawscripts.com/text/notes.txt")
				htmlbody = result.content
				i = 0
				while i<2:
					i+=1
					html = htmlbody.replace("SCRIPTTITLE", r.title)
					html = html.replace("USER", user)
					html = html.replace("SCRIPTURL", "http://www.rawscripts.com/editor?resource_id="+resource_id)
					html = html.replace("NOTETEXT", m.data)
				
				body = body_message + """


		--- This Script written and sent from RawScripts.com. Check it out ---"""
			
				mail.send_mail(sender='admin@rawscripts.com',
								to=user,
								subject=subject,
								body = body,
								html = html)
				self.response.out.write('1')

class SummaryEmail(webapp.RequestHandler):
	def post(self):
		q = db.GqlQuery("SELECT * FROM Users")
		r=q.fetch(1000)
		
				

def main():
	application = webapp.WSGIApplication([('/notessubmitmessage', SubmitMessage),
										('/notesposition', Position),
										('/notesdeletethread', DeleteThread),
										('/notesview', ViewNotes),
										('/notesdeletemessage', DeleteMessage),
										('/notesmarkasread', MarkAsRead),
										('/notesnotification', Notification),
										('/notessummaryemail', SummaryEmail),
										('/notesnewthread', NewThread)],
										debug=True)
	
	wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
	main()

