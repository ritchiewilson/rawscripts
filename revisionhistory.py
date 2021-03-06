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


import os, cgi
import difflib, string
import StringIO
import wsgiref.handlers
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
import random
import datetime
import logging
from django.utils import simplejson
from lxml.html.diff import htmldiff
import config
import models

from utils import gcu, permission, ownerPermission, get_template_path


class RevisionTag(webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		p = permission(resource_id)
		if p == False:
			return
		version = self.request.get('version')
		tag = self.request.get('tag')
		screenplay = None
		if version == "latest":
			screenplay = models.ScriptData.get_latest_version(resource_id)
		else:
			screenplay = models.ScriptData.get_version(resource_id, version)
		if screenplay is None:
			return
		screenplay.tag = tag
		screenplay.put()
		self.response.out.write('tagged')


class RevisionHistory(webapp.RequestHandler):
	def get(self):
		resource_id = self.request.get('resource_id')
		p = ownerPermission(resource_id)
		if p == False:
			return
		r = models.ScriptData.get_historical_metadata(resource_id)
		for i in r:
			i.updated=i.timestamp.strftime("%b %d")
			J=simplejson.loads(i.export)
			i.emailed = "Emailed" if len(J[0]) > 0 else ''
			i.tagged = "" if i.tag == '' else 'Tag'
			i.autosave_class = 'autosave' if i.autosave else 'manualsave'
		sign_out = users.create_logout_url('/')
		user_email = gcu()
		template_values={'r':r,
										 'title':p,
										 'resource_id':resource_id,
										 'sign_out':sign_out,
										 'user': user_email,
										 }
		path = get_template_path('html/revisionhistory.html')
		template_values['MODE'] = config.MODE
		template_values['GA'] = config.GA
		self.response.out.write(template.render(path, template_values))

class RevisionList(webapp.RequestHandler):
	def post(self):
		resource_id=self.request.get('resource_id')
		p = ownerPermission(resource_id)
		if p == False:
			return
		ids = []
		new_script = resource_id
		while True:
			q = models.DuplicateScripts.all()
			q.filter('new_script =', new_script)
			r = q.get()
			if r is None:
				break
			new_script = r.from_script
			ids.append([new_script, r.from_version])
		out=[]
		for past_resource_id, past_version in ids:
			data = models.ScriptData.get_historical_metadata(past_resource_id, past_version)
			for e in data:
				updated = e.timestamp.strftime("%b %d")
				out.append([past_resource_id, updated, e.version, e.autosave, e.export, e.tag])
		j = simplejson.dumps(out)
		self.response.headers['Content-Type']= 'text/plain'
		self.response.out.write(j)

class GetVersion(webapp.RequestHandler):
	def post(self):
		resource_id=self.request.get('resource_id')
		p = ownerPermission(resource_id)
		if p == False:
			return
		screenplay = None
		version = self.request.get('version')
		if version =='latest':
			screenplay = models.ScriptData.get_last_version_number(resource_id)
		else:
			screenplay = models.ScriptData.get_version(resource_id, int(version))
		data = simplejson.loads(screenplay.data)
		v = ['s','a','c','d','p','t']
		contents=''
		for text, line_format in data:
			text = cgi.escape(text, quote=True)
			contents+='<p class="'+v[line_format]+'">'+text+"</p>"
		self.response.headers['Content-Type']='text/plain'
		self.response.out.write(contents)


class CompareVersions(webapp.RequestHandler):
	def post(self):
		v_o_id=self.request.get('v_o_id')
		v_t_id=self.request.get('v_t_id')
		title = permission(v_o_id)
		p = permission(v_t_id)
		if title == False or p == False:
			return
		version_one = self.request.get('v_o')
		version_two = self.request.get('v_t')
		r_one = models.ScriptData.get_version(v_o_id, version_one)
		r_two = models.ScriptData.get_version(v_t_id, version_two)
		v = ['s','a','c','d','p','t']

		def to_html(raw_data):
			j = simplejson.loads(raw_data)
			s = StringIO.StringIO()
			for text, line_format in j:
				text = cgi.escape(text, quote=True)
				s.write("<p class='"+v[line_format]+"'>"+text+"</p>")
			return s.getvalue()

		s_one = to_html(r_one.data)
		s_two = to_html(r_two.data)
		content = htmldiff(s_one, s_two)
		self.response.headers['Content-Type']='text/html'
		self.response.out.write(content)


def main():
	application = webapp.WSGIApplication([('/revisionhistory', RevisionHistory),
																				('/revisionget', GetVersion),
																				('/revisionlist', RevisionList),
																				('/revisiontag' , RevisionTag),
																				('/revisioncompare', CompareVersions)],
																			 debug=True)

	run_wsgi_app(application)


if __name__ == '__main__':
	main()
