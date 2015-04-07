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
import config
import models
import unicodedata

from utils import gcu, permission, ownerPermission, get_template_path


class Deletion(webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		response = '0'
		p = ownerPermission(resource_id)
		if p != False:
			response = '1'
			screenplays = models.UsersScripts. \
				      get_by_resource_id(resource_id)
			for screenplay in screenplays:
				self.update_screenplay(screenplay)
		self.response.headers['Content-Type']='text/plain'
		self.response.out.write(response)

	def update_screenplay(self, screenplay):
		if self.request.path == '/delete':
			if screenplay.permission == 'owner':
				screenplay.permission = 'ownerDeleted'
			elif screenplay.permission == 'collab':
				screenplay.permission = 'collabDeletedByOwner'
		elif self.request.path == '/undelete':
			if screenplay.permission == 'ownerDeleted':
				screenplay.permission = 'owner'
			elif screenplay.permission == 'collabDeletedByOwner':
				screenplay.permission='collab'
		screenplay.put()


class HardDelete(webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		title = ownerPermission(resource_id)
		if title == False:
			return
		screenplays = models.UsersScripts.get_by_resource_id(resource_id)
		for screenplay in screenplays:
			screenplay.permission = 'hardDelete'
			screenplay.put()


class Rename (webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		p = ownerPermission(resource_id)
		if p == False:
			return
		rename = self.request.get('rename')
		screenplays = models.UsersScripts.get_by_resource_id(resource_id)
		for screenplay in screenplays:
			screenplay.title = rename
			screenplay.put()


class Export (webapp.RequestHandler):
	def get(self):
		resource_id = self.request.get('resource_id')
		if not resource_id or resource_id == "Demo":
			return
		export_format = self.request.get('export_format')
		title_page = self.request.get('title_page')
		p = permission(resource_id)
		if p == False:
			return
		title = p
		latest = models.ScriptData.get_latest_version(resource_id)
		if not latest:
			return
		data = simplejson.loads(latest.data)
		title_page_obj = None
		if str(title_page) == '1':
			title_page_obj = models.TitlePageData.get_or_create(resource_id, title)
		ascii_title = unicodedata.normalize("NFKD", title).encode("ascii", "ignore")
		if export_format =='txt':
			newfile = export.Text(data, title_page_obj)
			filename = 'filename=' + ascii_title + '.txt'
			self.response.headers['Content-Type'] = 'text/plain'
		elif export_format == 'pdf':
			newfile = export.Pdf(data, title_page_obj)
			filename = 'filename=' + ascii_title + '.pdf'
			self.response.headers['Content-Type'] = 'application/pdf'

		J = simplejson.loads(latest.export)
		arr = [export_format, str(datetime.datetime.today())]
		J[1].append(arr)
		latest.export = simplejson.dumps(J)
		latest.put()
		self.response.headers['Content-Disposition'] = 'attachment; ' +filename
		self.response.out.write(newfile.getvalue())


class EmailScript (webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		p = permission(resource_id)
		if p == False:
			return
		title_page = self.request.get('title_page')
		subject = self.request.get('subject')
		body_message = self.request.get('body_message')
		result = urlfetch.fetch("http://www.rawscripts.com/text/email.txt")
		htmlbody = result.content
		html = htmlbody.replace("FILLERTEXT", body_message)
		body = body_message + """


	--- This Script written and sent from RawScripts.com. Check it out---"""

		# Make Recipient list instead of just one
		recipients=self.request.get('recipients').split(',')
		title = p
		latest = models.ScriptData.get_latest_version(resource_id)
		if not latest:
			return
		data = simplejson.loads(latest.data)
		title_page_obj = None
		if str(title_page) == '1':
			title_page_obj = models.TitlePageData.get_or_create(resource_id, title)
		newfile = export.Pdf(data, title_page_obj)
		filename = title + '.pdf'

		try:
			mail.send_mail(sender=users.get_current_user().email(),
				       to=recipients,
				       subject=subject,
				       body=body,
				       html=html,
				       attachments=[(filename, newfile.getvalue())])
		except:
			self.response.headers['Content-Type'] = 'text/plain'
			self.response.out.write('not sent')
			return

		if ownerPermission(resource_id) != False:
			J = simplejson.loads(latest.export)
			t = str(datetime.datetime.today())
			for recipient in recipients:
				J[0].append([recipient, t])
			latest.export = simplejson.dumps(J)
			latest.put()

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
		data = simplejson.loads(data.data)
		newfile = 0
		filename = ''
		if pdf=='on':
			newfile = export.Pdf(data, None)
			filename=title+'.pdf'
		else:
			newfile = export.Text(data, None)
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
		resource_id = models.UsersScripts.create_unique_resource_id()

		s = models.ScriptData(resource_id=resource_id,
				      data='[["Fade In:",1],["Int. ",0]]',
				      version=1,
				      export='[[],[]]',
				      tag='',
				      autosave=0)
		s.put()

		s = models.SpellingData(resource_id=resource_id,
					wrong='[]',
					ignore='[]')
		s.put()

		user = gcu()
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
		title = ownerPermission(resource_id)
		if title == False:
			return
		new_resource_id = models.UsersScripts.create_unique_resource_id()
		screenplay = None
		if self.request.path =='/revisionduplicate':
			v = int(self.request.get('version'))
			screenplay = models.ScriptData.get_version(resource_id, v)
		else:
			screenplay = models.ScriptData.get_latest_version(resource_id)
		data = screenplay.data
		version = screenplay.version

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

		user = gcu()
		u = models.UsersScripts(key_name="owner"+user+new_resource_id,
					user=user,
					title='Copy of '+title,
					resource_id=new_resource_id,
					last_updated = datetime.datetime.today(),
					permission='owner',
					folder = "?none?")
		u.put()

		spelling_data = models.SpellingData.get_by_resource_id(resource_id)
		wrong = spelling_data.wrong if spelling_data else '[]'
		ignore = spelling_data.ignore if spelling_data else '[]'
		s = models.SpellingData(resource_id=new_resource_id,
					wrong=wrong,
					ignore=ignore)
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


		resource_id = models.UsersScripts.create_unique_resource_id()
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
		path = get_template_path('html/UploadComplete.html')
		self.response.out.write(template.render(path, template_values))

class Share (webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		p = ownerPermission(resource_id)
		if p == False:
			return
		collaborators = self.request.get('collaborators').lower()
		collabList = collaborators.split(',')

		#uniquify the list
		uCollabList = set([c for c in collabList if c != ''])

		#don't duplicate sharing
		rows = models.UsersScripts.get_by_resource_id(resource_id)
		existing_collaborators = set([row.user.lower() for row in rows])
		new_collaborators = list(uCollabList - existing_collaborators)

		for collaborator in new_collaborators:
			u = models.UsersScripts(key_name="collab"+collaborator+resource_id,
						resource_id=resource_id,
						permission="collab",
						user=collaborator,
						last_updated=datetime.datetime.today(),
						title=p,
						folder="?none?")
			u.put()
			s = models.ShareNotify(user=collaborator,
					       resource_id = resource_id,
					       timeshared = datetime.datetime.today(),
					       timeopened = datetime.datetime.today(),
					       opened=False)
			s.put()
		if new_collaborators and self.request.get('sendEmail') == 'y':
			user = users.get_current_user().email()
			subject = user + " has shared a script with you on RawScripts.com"
			body_message = "http://www.rawscripts.com/editor?resource_id="+resource_id
			result = urlfetch.fetch("http://www.rawscripts.com/text/notify.txt")
			htmlbody = result.content
			html = htmlbody.replace("SCRIPTTITLE", p)
			html = html.replace("USER",users.get_current_user().email())
			html = html.replace("SCRIPTURL", body_message)
			divArea = ''
			if self.request.get('addMsg') == 'y':
				divArea = "<div style='width:300px; margin-left:20px; font-size:12pt; font-family:serif'>"
				divArea += self.request.get('msg')
				divArea += "<br><b>--" + user + "</b></div>"
			html = html.replace("TEXTAREA", divArea)
			body = body_message + """


	--- This Script written and sent from RawScripts.com. Check it out---"""

			mail.send_mail(sender=users.get_current_user().email(),
				       to=new_collaborators,
				       subject=subject,
				       body = body,
				       html = html)
		self.response.headers['Content-Type'] = 'text/plain'
		self.response.out.write(",".join(new_collaborators))


class RemoveAccess (webapp.RequestHandler):
	def post(self):
		resource_id=self.request.get('resource_id')
		p = ownerPermission(resource_id)
		if p == False:
			return
		person = self.request.get('removePerson').lower()
		row = models.UsersScripts.get_by_resource_id_and_user(resource_id, person)
		if not row or row.permission != 'collab':
			return
		row.delete()

		notes = models.UnreadNotes.get_by_resource_id_and_user(resource_id, person)
		for note in notes:
			note.delete()

		notifications = models.ShareNotify.get_by_resource_id_and_user(resource_id, person)
		for n in notifications:
			n.delete()
		self.response.headers['Content-Type'] = 'text/plain'
		self.response.out.write(person)


class SyncContacts (webapp.RequestHandler):
	def post(self):
		# syncing contacts hasn't worked in a while. just shutting it
		# off.
		self.response.headers['Content-Type'] = 'text/plain'
		self.response.out.write('[]')
		return


class UploadHelp(webapp.RequestHandler):
	def get(self):
		path = get_template_path('html/uploadhelp.html')
		template_values={'GA' : config.GA}
		template_values['MODE'] = config.MODE
		self.response.headers['Content-Type'] = 'text/html'
		self.response.out.write(template.render(path, template_values))

class Convert(webapp.RequestHandler):
	def get(self):
		path = get_template_path('html/convert.html')
		template_values={'GA' : config.GA}
		template_values['MODE'] = config.MODE
		self.response.headers['Content-Type'] = 'text/html'
		self.response.out.write(template.render(path, template_values))

class YahooVerification(webapp.RequestHandler):
	def get(self):
		self.response.headers["content-Type"]="text/html"
		self.response.out.write("")


def main():
	application = webapp.WSGIApplication([('/delete', Deletion),
											('/undelete', Deletion),
											('/harddelete', HardDelete),
											('/newscript', NewScript),
											('/duplicate', Duplicate),
											('/revisionduplicate', Duplicate),
											('/export', Export),
											('/rename', Rename),
											('/emailscript', EmailScript),
											('/user_export', UserExport),
											('/convertprocess', ConvertProcess),
											('/share', Share),
											('/removeaccess', RemoveAccess),
											('/synccontacts', SyncContacts),
											('/uploadhelp', UploadHelp),
											('/convert', Convert),
											('/hUoVeIFNIgngfTnTdlGQRg--.html', YahooVerification),],
											debug=True)

	run_wsgi_app(application)


if __name__ == '__main__':
	main()
