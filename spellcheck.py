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
import httplib
from xml.dom import minidom
import StringIO
from google.appengine.ext.webapp.util import run_wsgi_app
import wsgiref.handlers
from google.appengine.ext import webapp
from django.utils import simplejson
from google.appengine.ext import db
import logging
from google.appengine.api.labs import taskqueue
import config
import models


class SpellDB(webapp.RequestHandler):
	def get(self):
		q=db.GqlQuery("SELECT * FROM UsersScripts "+
									"where permission='owner'")
		results = q.fetch(1000)
		for i in results:
			q=db.GqlQuery("SELECT * FROM SpellingData "+
										"WHERE resource_id='"+i.resource_id+"'")
			r = q.fetch(2)
			if len(r)==0:
				s = models.SpellingData(resource_id=i.resource_id,
												 wrong="[]",
												 ignore="[]")
				s.put()
				taskqueue.add(url="/spellcheckbigscript", params= {'resource_id' : i.resource_id})


class SpellCheckBigScript(webapp.RequestHandler):
	def post(self):
		resource_id = self.request.get('resource_id')
		q=db.GqlQuery("SELECT * FROM ScriptData "+
							 "WHERE resource_id='"+resource_id+"' "+
							 "ORDER BY version DESC")
		r = q.fetch(2)
		j = simplejson.loads(r[0].data)
		w=[]
		for i in j:
			word = i[0].split(" ")
			for t in word:
				w.append(t)
		
		# make a unique list of words
		keys = {} 
		for e in w: 
			keys[e] = 1
		words=keys.keys()

		i=0
		while i<len(words):
			j=0
			arr=[]
			while j<=200:
				j+=1
				arr.append(words.pop())
				if len(words)==0: break
			taskqueue.add(url="/spellcheck", params={'resource_id' :resource_id, 'data' : simplejson.dumps(arr)})
		

		
																	 
class SpellCheck(webapp.RequestHandler):
		def post(self):
			resource_id=self.request.get('resource_id')
			data = self.request.get('data')
			output=self.request.get('output')
			w = simplejson.loads(data)
			
			keys = {} 
			for e in w: 
					keys[e] = 1
			words=keys.keys()

			n=0
			cr=[]
			while n<len(words):
					i=0
					arr=[]
					while i<=10:
							s = words.pop()
							arr.append(s)
							i+=1
							if len(words)==0:
									i=13
					text=" ".join(arr)

					lang = "en"

					#data_len = int(environ.get('HTTP_CONTENT_LENGTH', 0))
					#data = environ.get("wsgi.input").read(data_len)
					data = '<?xml version="1.0" encoding="utf-8" ?>'
					data=data+'<spellrequest textalreadyclipped="0" ignoredups="1" ignoredigits="0" ignoreallcaps="0">'
					data=data+'<text>'+text+'</text>'
					data=data+'</spellrequest>'
					con = httplib.HTTPSConnection("www.google.com")
					con.request("POST", "/tbproxy/spell?lang=%s" % lang, data)
					response = con.getresponse()
					r=response.read()
					dom = minidom.parse(StringIO.StringIO(r))
					con.close()
					for i in dom.getElementsByTagName('c'):
						tmp=[]
						tmp.append(text[int(i.getAttribute('o')):int(i.getAttribute('o'))+int(i.getAttribute('l'))])
						if not len(i.childNodes)==0:
							tmp.append(i.firstChild.data.split('\t'))
						else:
							tmp.append(["No Suggestions"])
						if not tmp==[]:
								cr.append(tmp)
			if len(cr)==0:
				content = 'correct'
			else:
				q = db.GqlQuery("SELECT * FROM SpellingData "+
												"WHERE resource_id='"+resource_id+"'")
				r=q.fetch(2)
				if len(r)==0:
					s=models.SpellingData(resource_id=resource_id,
												 wrong="[]",
												 ignore='[]')
					s.put()
					q = db.GqlQuery("SELECT * FROM SpellingData "+
												"WHERE resource_id='"+resource_id+"'")
					r=q.fetch(2)
					item=r[0]
				else:
					item=r[0]
				J = simplejson.loads(item.wrong)
				for t in cr:
					J.append(t)
				P = simplejson.dumps(J)
				item.wrong=P
				item.put()
				content = simplejson.dumps(cr)
			
			self.response.headers['Content-type']='text/plain'
			self.response.out.write(content)

def main():
	application = webapp.WSGIApplication([('/spellcheck', SpellCheck),
																				('/spellcheckbigscript', SpellCheckBigScript),
																				('/spelldb', SpellDB)],
																			 debug=True)
	
	wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
	main()
