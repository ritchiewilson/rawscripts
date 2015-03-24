import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
from google.appengine.dist import use_library
use_library('django', '1.2')
import wsgiref.handlers
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api import mail
from google.appengine.api.labs import taskqueue
from google.appengine.api import users
from django.utils import simplejson
import models
import difflib
import logging
from datetime import datetime

class BatchEmail(webapp.RequestHandler):
    def get(self):
        if not users.is_current_user_admin():
            return
        EMAIL_ROUND = 1
        subject = "Action required for your Rawscripts account"
        VERIFY_TEXT = "verify your email at Rawscripts.com"
        DOMAIN = "http://www.rawscripts.com/"
        # DOMAIN = "http://localhost:8080/"
        READMORE_URL = DOMAIN + "blog/Login-System-Changing-Soon"

        f = open('static/text/verify-base.html')
        template = f.read()
        f.close()
        content_path ="static/text/verify-body-" + str(EMAIL_ROUND) + ".html"
        f = open(content_path)
        content = f.read()
        f.close()

        # Build html message
        html_readmore = '<a href="' + READMORE_URL + '">Read more.</a>'
        html_verify = '<a href="' + DOMAIN + '">' + VERIFY_TEXT + "</a>"
        html_content = content.replace("READMORE", html_readmore)
        html_content = html_content.replace("VERIFY", html_verify)
        html = template.replace("BODYTEXT", html_content)

        # Build plain text message
        text_readmore = "Read more at " + READMORE_URL
        substitutions = [
            ("READMORE", text_readmore),
            ("VERIFY", VERIFY_TEXT),
            ("\n", ""),
            ("  ", " "),
            ("<p>", "\n"),
            ("</p>", "\n"),
            ("<br>", "\n"),
            ("<b>", "**"),
            ("</b>", "**"),
        ]
        text_content = content
        for s in substitutions:
            while s[0] in text_content:
                text_content = text_content.replace(s[0], s[1])

        mail.send_mail(sender="noreply@rawscripts.com",
                       to="rawilson52@gmail.com",
                       subject=subject,
                       body=text_content,
                       html=html)
        logging.info(text_content)
        logging.info(html)
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('sent')


def main():
    application = webapp.WSGIApplication([('/batch-email', BatchEmail),
                                      ],
                                         debug=True)

    run_wsgi_app(application)


if __name__ == '__main__':
    main()
