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
import random
import string

class Unsubscribe(webapp.RequestHandler):
    def get(self):
        token = self.request.get('token')
        query = models.Users.all()
        query.filter('unsubscribe_token =', token)
        user_row = query.get()

        template_values = {'verified': False}
        if user_row:
            user_row.unsubscribed = True
            user_row.put()
            template_values['email_address'] = user_row.name
            template_values['verified'] = True

        path = os.path.join(os.path.dirname(__file__), 'html/unsubscribe.html')
        self.response.headers['Content-Type'] = 'text/html'
        self.response.out.write(template.render(path, template_values))


class BatchEmail(webapp.RequestHandler):
    def get(self):
        if not users.is_current_user_admin():
            return

        params = {'start_from': ''}
        taskqueue.add(url="/batch-email", params=params,
                      queue_name='batch-email')
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('Started')

    def post(self):
        self.EMAIL_ROUND = 1
        self.VERIFY_TEXT = "verify your email at Rawscripts.com"
        self.DOMAIN = "http://www.rawscripts.com/"
        # DOMAIN = "http://localhost:8080/"
        self.READMORE_URL = self.DOMAIN + "blog/Login-System-Changing-Soon"

        q = models.Users.all()
        q.order('name')
        start_from = self.request.get('start_from')
        if start_from != '':
            q.filter('name >', start_from)

        last_done = ''
        message_content = self.get_message_content()
        html = self.get_html_template(message_content)
        body = self.get_text_template(message_content)
        for user in q.run(limit=100):
            self.email_user(user, html, body)
            last_done = user.name

        if last_done == '':
            return

        params = {'start_from': last_done}
        taskqueue.add(url="/batch-email", params=params,
                      queue_name='batch-email')

    def email_user(self, user, html, body):
        if user.name == '':
            return
        if user is None:
            return
        if user.verified or user.unsubscribed:
            return
        if user.reminder_sent >= self.EMAIL_ROUND:
            return

        if not user.unsubscribe_token:
            chars = string.uppercase + string.lowercase + string.digits
            token = ''.join([random.choice(chars) for x in range(40)])
            user.unsubscribe_token = token
            user.unsubscribed = False
            user.put()

        unsubscribe_link = self.DOMAIN + "unsubscribe?token="
        unsubscribe_link += user.unsubscribe_token

        html_unsub = '<a href="' + unsubscribe_link + '">unsubscribe</a>'
        html = html.replace('UNSUBSCRIBE', html_unsub)

        text_unsub = "unsubscribe at this link: " + unsubscribe_link
        body = body.replace("UNSUBSCRIBE", text_unsub)

        subject = "Action required for your Rawscripts account"
        mail.send_mail(sender="noreply@rawscripts.com",
                       to=user.name,
                       subject=subject,
                       body=body,
                       html=html)
        user.reminder_sent = self.EMAIL_ROUND
        user.put()

    def get_message_content(self):
        content_path ="static/text/verify-body-" + str(self.EMAIL_ROUND) + ".html"
        f = open(content_path)
        content = f.read()
        f.close()
        return content

    def get_text_template(self, content):
        text_readmore = "Read more at " + self.READMORE_URL
        substitutions = [
            ("READMORE", text_readmore),
            ("VERIFY", self.VERIFY_TEXT),
            ("\n", ""),
            ("  ", " "),
            ("<p>", "\n"),
            ("</p>", "\n"),
            ("<br>", "\n"),
            ("<b>", "**"),
            ("</b>", "**"),
        ]
        for s in substitutions:
            while s[0] in content:
                content = content.replace(s[0], s[1])
        return content

    def get_html_template(self, content):
        f = open('static/text/verify-base.html')
        template = f.read()
        f.close()
        html_readmore = '<a href="' + self.READMORE_URL + '">Read more.</a>'
        html_verify = '<a href="' + self.DOMAIN + '">' + self.VERIFY_TEXT + "</a>"
        content = content.replace("READMORE", html_readmore)
        content = content.replace("VERIFY", html_verify)
        html = template.replace("BODYTEXT", content)
        return html

def main():
    application = webapp.WSGIApplication([('/batch-email', BatchEmail),
                                          ('/unsubscribe', Unsubscribe),
                                      ],
                                         debug=True)

    run_wsgi_app(application)


if __name__ == '__main__':
    main()
