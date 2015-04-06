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
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
import random
import datetime
import logging
from django.utils import simplejson
import config
import models

from utils import gcu, permission, get_template_path


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
		if resource_id=="Demo":
			return
		p = permission(resource_id)
		if not p==False:
			q = db.GqlQuery("SELECT autosave, export, tag, timestamp, version FROM ScriptData "+
									 "WHERE resource_id='"+resource_id+"' "+
									 "ORDER BY version DESC")
			r = q.fetch(1000)
			for i in r:
				i.updated=i.timestamp.strftime("%b %d")
				J=simplejson.loads(i.export)
				"""
				if len(J[0])==0 and len(J[1])==0:
					i.e=""
				if len(J[0])>0 and len(J[1])==0:
					i.e="Emailed"
				if len(J[0])>0 and len(J[1])>0:
					i.e="Emailed/Exported"
				if len(J[0])==0 and len(J[1])>0:
					i.e="Exported"
				"""
				if len(J[0])>0:
					i.e="Emailed"
				else:
					i.e=""
				if i.tag=="":
					i.t=""
				else:
					i.t="Tag"
				if i.autosave==0:
					i.s='manualsave'
				else:
					i.s='autosave'
			user = users.get_current_user()
			if user:
				sign_out=users.create_logout_url('/')
				user_email = users.get_current_user().email()
			else:
				sign_out="/"
				user_email = "test@example.com"
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
		if resource_id=="Demo":
			return
		p=permission(resource_id)
		if p == False:
			return
		begining=False
		ids=[]
		new_script=resource_id
		while not begining:
			q=db.GqlQuery("SELECT autosave, export, tag, timestamp, version FROM DuplicateScripts "+
										"WHERE new_script='"+new_script+"'")
			r=q.fetch(1)
			if len(r)==0:
				begining=True
			else:
				new_script=r[0].from_script
				ids.append([new_script, r[0].from_version])
		i=0
		out=[]
		version=str(ids[0][1]+1)
		while i<len(ids):
			q=db.GqlQuery("SELECT autosave, export, tag, timestamp, version FROM ScriptData "+
										"WHERE resource_id='"+ids[i][0]+"' "+
										"AND version<"+version+" "+
										"ORDER BY version DESC")
			r=q.fetch(1000)
			for e in r:
				e.updated=e.timestamp.strftime("%b %d")
				if e.autosave==0:
					e.s='manualsave'
				else:
					e.s='autosave'
				out.append([ids[i][0], e.updated, e.version, e.autosave, e.export, e.tag])
			i+=1
			if not i==len(ids):
				version=str(ids[i][1]+1)
		j=simplejson.dumps(out)
		self.response.headers['Content-Type']= 'text/plain'
		self.response.out.write(j)

class GetVersion(webapp.RequestHandler):
	def post(self):
		resource_id=self.request.get('resource_id')
		if resource_id=="Demo":
			return
		p = permission(resource_id)
		if p == False:
			return
		version = self.request.get('version')
		if version =='latest':
			q = db.GqlQuery("SELECT * FROM ScriptData "+
											"WHERE resource_id='"+resource_id+"' "
											"ORDER BY version DESC")
			r=q.fetch(2)
		else:
			q = db.GqlQuery("SELECT * FROM ScriptData "+
											"WHERE version="+version+" "+
											"AND resource_id='"+resource_id+"'")
			r=q.fetch(2)
		J = simplejson.loads(r[0].data)
		v = ['s','a','c','d','p','t']
		contents=''
		for i in J:
			contents+='<p class="'+v[int(i[1])]+'">'+i[0]+"</p>"
		self.response.headers['Content-Type']='text/plain'
		self.response.out.write(contents)


class CompareVersions(webapp.RequestHandler):
	def post(self):
		import difflib

		v_o_id=self.request.get('v_o_id')
		v_t_id=self.request.get('v_t_id')
		if v_o_id=="Demo" or v_t_id=="Demo":
			return
		title=permission(v_o_id)
		p = permission(v_t_id)
		if title == False or p == False:
			return
		version_one = self.request.get('v_o')
		version_two = self.request.get('v_t')
		q = db.GqlQuery("SELECT * FROM ScriptData "+
										"WHERE version="+version_one+" "+
										"AND resource_id='"+v_o_id+"'")
		r_one=q.fetch(2)
		q = db.GqlQuery("SELECT * FROM ScriptData "+
										"WHERE version="+version_two+" "+
										"AND resource_id='"+v_t_id+"'")
		r_two=q.fetch(2)

		v = ['s','a','c','d','p','t']

		j_one = simplejson.loads(r_one[0].data)
		s_one=StringIO.StringIO()
		for i in j_one:
			s_one.write("<p class='"+v[int(i[1])]+"'>"+i[0]+"</p>\n")
		j_two = simplejson.loads(r_two[0].data)
		s_two=StringIO.StringIO()
		for i in j_two:
			s_two.write("<p class='"+v[int(i[1])]+"'>"+i[0]+"</p>\n")

		content = textDiff(s_one.getvalue(), s_two.getvalue())
		content=content.replace("<del><p", "<p")
		content=content.replace("<ins><p", "<p")
		content=content.replace("</p></del>", "</p>")
		content=content.replace("</p></ins>", "</p>")
		self.response.headers['Content-Type']='text/html'
		self.response.out.write(content)

import difflib, string

def isTag(x): return x[0] == "<" and x[-1] == ">"

def textDiff(a, b):
	"""Takes in strings a and b and returns a human-readable HTML diff."""

	out = []
	a, b = html2list(a), html2list(b)
	s = difflib.SequenceMatcher(None, a, b)
	for e in s.get_opcodes():
		if e[0] == "replace":
			# @@ need to do something more complicated here
			# call textDiff but not for html, but for some html... ugh
			# gonna cop-out for now
			out.append('<del>'+''.join(a[e[1]:e[2]]).replace("</p>","</del></p>").replace("'>","'><del>") + '</del><ins>'+''.join(b[e[3]:e[4]]).replace("</p>","</ins></p>").replace("'>","'><ins>")+"</ins>")
		elif e[0] == "delete":
			out.append('<del>'+ ''.join(a[e[1]:e[2]]).replace("</p>","</del></p>").replace("'>","'><del>") + "</del>")
		elif e[0] == "insert":
			out.append('<ins>'+''.join(b[e[3]:e[4]]).replace("</p>","</ins></p>").replace("'>","'><ins>") + "</ins>")
		elif e[0] == "equal":
			out.append(''.join(b[e[3]:e[4]]))
		else:
			raise "Um, something's broken. I didn't expect a '" + `e[0]` + "'."
	return ''.join(out)

def html2list(x, b=0):
	mode = 'char'
	cur = ''
	out = []
	for c in x:
		if mode == 'tag':
			if c == '>':
				if b: cur += ']'
				else: cur += c
				out.append(cur); cur = ''; mode = 'char'
			else: cur += c
		elif mode == 'char':
			if c == '<':
				out.append(cur)
				if b: cur = '['
				else: cur = c
				mode = 'tag'
			elif c in string.whitespace: out.append(cur+c); cur = ''
			else: cur += c
	out.append(cur)
	return filter(lambda x: x is not '', out)


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
