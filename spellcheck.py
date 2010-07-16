import httplib
from xml.dom import minidom
import StringIO
from google.appengine.ext.webapp.util import run_wsgi_app
import wsgiref.handlers
from google.appengine.ext import webapp
from django.utils import simplejson
from google.appengine.ext import db
import logging

class ScriptData (db.Model):
  resource_id = db.StringProperty()
  data = db.TextProperty()
  version = db.IntegerProperty()
  timestamp = db.DateTimeProperty(auto_now_add=True)
  autosave = db.IntegerProperty()

class SpellingData (db.Model):
  resource_id = db.StringProperty()
  wrong = db.StringProperty()
  ignore = db.StringProperty()
  timestamp = db.DateTimeProperty(auto_now_add=True)

class UsersScripts (db.Model):
  user = db.StringProperty()
  resource_id = db.StringProperty()
  title = db.StringProperty()
  updated = db.StringProperty()
  permission = db.StringProperty()

class SpellDB(webapp.RequestHandler):
  def get(self):
    q=db.GqlQuery("SELECT * FROM UsersScripts")
    results = q.fetch(1000)
    for i in results:
      q=db.GqlQuery("SELECT * FROM SpellingData "+
                    "WHERE resource_id='"+i.resource_id+"'")
      r = q.fetch(2)
      if len(r)==0:
        s = SpellingData(resource_id=i.resource_id,
                         wrong="[]",
                         ignore="[]")
        s.put()
        q=db.GqlQuery("SELECT * FROM ScriptData "+
                      "WHERE resource_id='"+i.resource_id+"' "+
                      "ORDER BY version DESC")
        j = q.fetch(2)
        taskqueue.add(url="/spellcheckbigscript", params= {resource_id : i.resource_id})


class SpellCheckBigScript(webapp.RequestHandler):
  def post(self):
    resource_id = self.request.get('resource_id')
    q=GqlQuery("SELECT * FROM ScriptData "+
               "WHERE resource_id='"+resource_id+"' "+
               "ORDER BY version DESC")
    r = q.fetch(2)
    j = simplejson.loads(r[0].data)
    w=[]
    for i in j:
      word = i.split(" ")
      for t in word:
        w.append(t)

    keys = {} 
    for e in w: 
      keys[e] = 1
    words=keys.keys()

    i=0
    while i<len(words):
      j=0
      arr=[]
      while j<=50:
        j+=1
        arr.append(words.pop())
        if len(words)==0: j=60
      taskqueue.add(url="/spellcheck", params={resource_id :resource_id, data : simplejson.dumps(arr)})
    

    
                                   
class SpellCheck(webapp.RequestHandler):
    def post(self):
      resource_id=self.request.get('resource_id')
      data = self.request.get('data')
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
              logging.info(s)
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
          dom = minidom.parse(StringIO.StringIO(response.read()))
          con.close()
          for i in dom.getElementsByTagName('c'):
            tmp=[]
            tmp.append(text[int(i.getAttribute('o')):int(i.getAttribute('o'))+int(i.getAttribute('l'))])
            tmp.append(i.firstChild.data.split('\t'))
            if not tmp==[]:
                cr.append(tmp)
      if len(cr)==0:
        content = 'correct'
      else:
        q = db.GqlQuery("SELECT * FROM SpellingData "+
                        "WHERE resource_id='"+resource_id+"'")
        r=q.fetch(2)
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
                                        ('/spelldb', SpellDB)],
                                       debug=True)
  
  wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
  main()
