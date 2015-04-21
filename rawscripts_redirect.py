
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



class RawscriptsRedirect(webapp.RequestHandler):
    def get(self):
        self.redirect("https://www2.rawscripts.com")
        return

    def post(self):
        self.response.headers['Content-Type']='text/plain'
        self.response.out.write('')
        return


def main():
    application = webapp.WSGIApplication([('/.*', RawscriptsRedirect),],
                                         debug=True)

    run_wsgi_app(application)


if __name__ == '__main__':
    main()
