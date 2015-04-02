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
import wsgiref.handlers
from google.appengine.api import users
from google.appengine.api import urlfetch
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api import mail
from google.appengine.api.labs import taskqueue
import random
import datetime
import logging
from django.utils import simplejson
import mobileTest
import config
import models

from utils import gcu, ownerPermission

def permission (resource_id):
	q = db.GqlQuery("SELECT * FROM UsersScripts "+
									"WHERE resource_id='"+resource_id+"'")
	results = q.fetch(1000)
	user = gcu()
	p=False
	for i in results:
		if i.permission=='owner' or i.permission=="collab":
			if i.user==user:
				p=i.permission
	return p


class NewThread(webapp.RequestHandler):
	def post(self):
		resource_id=self.request.get('resource_id')
		fromPage=self.request.get('fromPage')
		try:
			user=gcu()
		except:
			user = 'test@example.com'
		row = self.request.get('row')
		col = self.request.get('col')
		thread_id = self.request.get('thread_id')
		content = self.request.get('content')
		d = str(datetime.datetime.today())
		if resource_id=="Demo":
			self.response.headers["Content-Type"]="text/plain"
			self.response.out.write(simplejson.dumps([row, col,thread_id, d, user]))
			return
		p = permission(resource_id)
		if p == False:
			return

		arr = [[content, user, d]]
		data = simplejson.dumps(arr)
		n=models.Notes(resource_id=resource_id,
						thread_id=thread_id,
						data=data,
						row=int(row),
						col=int(col))
		n.put()
		q=db.GqlQuery("SELECT * FROM UsersScripts "+
						"WHERE resource_id='"+resource_id+"'")
		r=q.fetch(500)
		for i in r:
			if not i.user==gcu():
				nn = models.UnreadNotes(key_name=i.user+resource_id+thread_id+d,
								resource_id=resource_id,
								user=i.user,
								thread_id=thread_id,
								msg_id=d)
				nn.put()
				taskqueue.add(url="/notesnotification", params= {'resource_id' : resource_id, 'to_user' : i.user, 'from_user' : user, 'msg_id' : d, 'thread_id' : thread_id})

		self.response.headers["Content-Type"]="text/plain"
		if fromPage=='mobileviewnotes':
			self.response.out.write('sent')
		else:
			self.response.out.write(simplejson.dumps([row, col,thread_id, d, user]))

class SubmitMessage(webapp.RequestHandler):
	def post(self):
		resource_id=self.request.get('resource_id')
		try:
			user=gcu()
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
		if p == False:
			return

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
				n = models.UnreadNotes(key_name=i.user+resource_id+thread_id+d,
								resource_id=resource_id,
								thread_id=thread_id,
								user=i.user,
								msg_id=d)
				n.put()
				taskqueue.add(url="/notesnotification", params= {'resource_id' : resource_id, 'to_user' : i.user, 'from_user' : user, 'msg_id' : d, 'thread_id' : thread_id})

		self.response.headers["Content-Type"]="text/plain"
		if fromPage=='mobileviewnotes':
			self.response.out.write('sent')
		else:
			self.response.out.write(output)

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
						if p!=False or i[1]==gcu():
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
			user=gcu()
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
							"user":gcu(),
							"sign_out": users.create_logout_url("/"),
							"title":title,
							"f":f
							}
			path = os.path.join(os.path.dirname(__file__), 'html/mobile/MobileViewNotes.html')
			self.response.out.write(template.render(path, template_values))


class Notification(webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		to_user = self.request.get('to_user')
		from_user = self.request.get('from_user')
		thread_id = self.request.get('thread_id')
		msg_id = self.request.get('msg_id')
		q = db.GqlQuery("SELECT * FROM UsersScripts "+
						"WHERE user='"+to_user+"' "+
						"AND resource_id='"+resource_id+"'")
		r = q.get()
		s = db.get(db.Key.from_path('UsersSettings', 'settings'+to_user))
		send = False
		if s == None:
			send = True
		elif r.permission=='owner':
			if s.owned_notify == 'every':
				send=True
			else:
				send=False
		else:
			if s.shared_notify=='every':
				send=True
			else:
				send=False

		q = db.GqlQuery("SELECT * FROM Users")
		uTest = q.fetch(1000)
		#check if user exists in db (ue)
		#need a better way to do this.
		ue=False
		for i in uTest:
			if i.name.lower()==to_user.lower():
				ue=True

		if send==True and ue==True:
			q = db.GqlQuery("SELECT * FROM Notes "+
							"WHERE resource_id='"+resource_id+"' "+
							"AND thread_id='"+thread_id+"'")
			J=simplejson.loads(q.get().data)
			data=None
			for i in J:
				if i[2]==msg_id:
					data=i[0]

			if not data==None:
				subject = from_user + ' Left A Note On The Script "' + r.title + '"'
				body_message="http://www.rawscripts.com/editor?resource_id="+resource_id
				result = urlfetch.fetch("http://www.rawscripts.com/text/notes.txt")
				htmlbody = result.content
				i = 0
				while i<2:
					i+=1
					html = htmlbody.replace("SCRIPTTITLE", r.title)
					html = html.replace("USER", from_user)
					html = html.replace("SCRIPTURL", "http://www.rawscripts.com/editor?resource_id="+resource_id)
					html = html.replace("NOTETEXT", data)

				body = body_message + """


		--- This Script written and sent from RawScripts.com. Check it out ---"""

				mail.send_mail(sender='RawScripts <noreply@rawscripts.com>',
								to=to_user,
								subject=subject,
								body = body,
								html = html)
				self.response.out.write('1')
				logging.info(html)

class SummaryEmailInit(webapp.RequestHandler):
	def get(self):
		q = db.GqlQuery("SELECT * FROM UsersSettings")
		r=q.fetch(1000)
		for i in r:
			if i.owned_notify=="daily" or i.shared_notify=="daily":
				taskqueue.add(url="/notessendsummaryemail", params= {'user' : i.key().name().replace('settings','')})

class SendSummaryEmail(webapp.RequestHandler):
	def post(self):
		user = self.request.get('user')
		now = datetime.datetime.now()
		q = db.GqlQuery("SELECT * From UnreadNotes "+
						"WHERE user='"+user+"' "+
						"ORDER BY resource_id DESC")
		notes = q.fetch(1000)
		recent = []
		for i in notes:
			t = now-i.timestamp
			if t.days == 0:
				recent.append(i)
		if len(recent)!=0:
			settings = db.get(db.Key.from_path('UsersSettings', "settings"+user))
			out = []
			cur = recent[0].resource_id
			arr = []
			for i in recent:
				if i.resource_id == cur:
					arr.append([i.resource_id, i.thread_id, i.msg_id])
				else:
					out.append(arr)
					cur = i.resource_id
					arr = [[i.resource_id, i.thread_id, i.msg_id]]
			out.append(arr)
			body=""
			if len(out)==0:
				return
			for i in out:
				q=db.GqlQuery("SELECT * FROM UsersScripts "+
								"WHERE resource_id='"+i[0][0]+"' "+
								"AND user='"+user.lower()+"'")
				us = q.get()
				notify=False
				if us.permission=="collab":
					if settings.shared_notify=='daily':
						notify=True
				elif us.permission=='owner':
					if settings.owned_notify=='daily':
						notify=True
				if notify==True:
					body +="<h2>Notes Left On the Script "+q.get().title+"</h1>"
					body +="<p>This script and all its notes can be found <a href='http://www.rawscripts.com/editor?resource_id="+i[0][0]+"'>here</a></p><div style='width:400px'>"
					for j in i:
						q=db.GqlQuery("SELECT  FROM Notes "+
										"WHERE resource_id='"+j[0]+"' "+
										"AND thread_id='"+j[1]+"'")
						J = simplejson.loads(q.get().data)
						found=False
						for u in J:
							if u[2]==j[2]:
								found=u
						if found!=False:
							body+='<div class="text">"'+found[0]+'"</div>'
							body+="<div align='right' class='signature'><b>--"+found[1]+"</b></div>"
					body+='</div>'
			if body!="":

				#now create the email and send it.
				subject = 'Daily Notes Summary'
				body_message="http://www.rawscripts.com/"
				result = urlfetch.fetch("http://www.rawscripts.com/text/dailysummary.txt")
				htmlbody = result.content
				html = htmlbody.replace("BODYHTML", body)

				body = body_message + """


		--- This Script written and sent from RawScripts.com. Check it out ---"""

				mail.send_mail(sender='RawScripts <noreply@rawscripts.com>',
								to=user,
								subject=subject,
								body = body,
								html = html)
				self.response.out.write('1')

def main():
	application=webapp.WSGIApplication([('/notessubmitmessage', SubmitMessage),
										('/notesposition', Position),
										('/notesdeletethread', DeleteThread),
										('/notesview', ViewNotes),
										('/notesdeletemessage', DeleteMessage),
										('/notesmarkasread', MarkAsRead),
										('/notesnotification', Notification),
										('/notessummaryemailinit', SummaryEmailInit),
										('/notessendsummaryemail', SendSummaryEmail),
										('/notesnewthread', NewThread)],
										debug=True)

	run_wsgi_app(application)


if __name__ == '__main__':
	main()
