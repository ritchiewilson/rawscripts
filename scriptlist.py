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
import StringIO, os, cgi, re
import string
import random
import logging
import wsgiref.handlers
from google.appengine.api import users
from google.appengine.api import mail
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
import datetime
from django.utils import simplejson
import mobileTest
import config
import models

from utils import gcu

def openid_data():
    u = users.get_current_user()
    q = models.OpenIDData2.all()
    q.filter('nickname =', u.nickname())
    q.filter('email = ', u.email())
    q.filter('user_id =', u.user_id())
    q.filter('federated_identity = ', u.federated_identity())
    q.filter('federated_provider =', u.federated_provider())

    result = q.get()
    if result == None:
        n = models.OpenIDData2()
        n.nickname = u.nickname()
        n.email = u.email()
        n.user_id = u.user_id()
        n.federated_identity = u.federated_identity()
        n.federated_provider = u.federated_provider()
        n.put()

def get_user_row():
    user = users.get_current_user().email()
    query = models.Users.all()
    query.filter('name =', user)
    user_row = query.get()
    if not user_row:
        user_row = models.Users(name=users.get_current_user().email())
        user_row.put()
    return user_row

class ScriptList(webapp.RequestHandler):
    """Requests the list of the user's Screenplays in the RawScripts folder."""

    def get(self):
        openid_data()
        template_values = { 'sign_out': users.create_logout_url('/') }
        template_values['user'] = users.get_current_user().email()
        template_values['MODE'] = config.MODE
        template_values['GA'] = config.GA

        dev_js = ['base', 'scriptlist']
        pro_js = []
        dev_css = ['menu','menuitem','menuseparator','common','toolbar','button',    'custombutton',    'autocomplete']
        pro_css = []
        template_values['SCRIPTLIST_CSS'] = pro_css if config.MODE=="PRO" else dev_css
        template_values['SCRIPTLIST_JS'] = pro_js if config.MODE=="PRO" else dev_js

        user_row = get_user_row()
        template_values['email_verified'] = (user_row.verified == True)

        path = os.path.join(os.path.dirname(__file__), 'html/scriptlist.html')
        mobile = mobileTest.mobileTest(self.request.user_agent)
        if mobile==1:
            path = os.path.join(os.path.dirname(__file__), 'html/mobile/MobileScriptlist.html')

        self.response.headers['Content-Type'] = 'text/html'
        self.response.out.write(template.render(path, template_values))

class List (webapp.RequestHandler):
    def post(self):
        mobile = mobileTest.mobileTest(self.request.user_agent)
        user = gcu()
        q=db.GqlQuery("SELECT * FROM UnreadNotes "+
                      "WHERE user='"+user+"'")
        unread = q.fetch(1000)

        q=db.GqlQuery("SELECT * FROM ShareNotify "+
                      "WHERE user='"+user+"' "+
                      "AND opened=False")
        unopened = q.fetch(500)

        q= db.GqlQuery("SELECT * FROM UsersScripts "+
                       "WHERE user='"+user+"' "+
                       "ORDER BY last_updated DESC")
        results = q.fetch(1000)
        now = datetime.datetime.today()
        owned = []
        shared = []
        ownedDeleted = []
        for i in results:
            d = now - i.last_updated
            if d.days>0:
                i.updated=i.last_updated.strftime("%b %d")
            elif d.seconds>7200:
                i.updated = str(int(round(d.seconds/3600))) + " hours ago"
            elif d.seconds>60:
                i.updated= str(int(round(d.seconds/60))) + " minutes ago"
            else:
                i.updated = "Seconds ago"

            #Count notes
            new_notes=0
            for c in unread:
                if c.resource_id==i.resource_id:
                    new_notes=new_notes+1
            #now put these bits in the right array
            if i.permission=='owner':
                q=db.GqlQuery("SELECT user FROM UsersScripts "+
                              "WHERE resource_id='"+i.resource_id+"'")
                p=q.fetch(500)
                sharingArr=[]
                for j in p:
                    if j.user.lower()!=user:
                        sharingArr.append(j.user)
                owned.append([i.resource_id, i.title, i.updated, i.permission, sharingArr, new_notes, i.folder])
            elif i.permission=="ownerDeleted":
                q=db.GqlQuery("SELECT user FROM UsersScripts "+
                              "WHERE resource_id='"+i.resource_id+"'")
                p=q.fetch(500)
                sharingArr=[]
                for j in p:
                    if j.user.lower()!=user:
                        sharingArr.append(j.user)
                ownedDeleted.append([i.resource_id, i.title, i.updated, i.permission, sharingArr,  i.folder])
            elif i.permission=="collab":
                q=db.GqlQuery("SELECT user FROM UsersScripts "+
                              "WHERE resource_id='"+i.resource_id+"' "+
                              "AND permission='owner'")
                p=q.get()
                uo=False
                for ra in unopened:
                    if i.resource_id==ra.resource_id:
                        uo=True
                shared.append([i.resource_id, i.title, i.updated, 'shared', new_notes,  i.folder, str(uo)])

        q=db.GqlQuery("SELECT * FROM Folders WHERE user='"+user+"'")
        f = q.fetch(1)
        if len(f)==0:
            folders=[]
        else:
            folders=simplejson.loads(f[0].data)
        pl=[owned, ownedDeleted, shared, folders]

        j = simplejson.dumps(pl)
        self.response.headers['Content-Type']='text/plain'
        self.response.out.write(j)

class VerifyEmail (webapp.RequestHandler):
    def post(self):
        status = None
        user_row = get_user_row()
        if user_row.verified:
            status = 'verified'
        else:
            user_row = self.add_verification_token(user_row)
            mail_status = self.email_verification(user_row)
            status = mail_status
        self.response.headers['Content-Type']='text/plain'
        self.response.out.write(status)

    def add_verification_token(self, user_row):
        if user_row.verification_token is not None:
            return user_row
        chars = string.uppercase + string.lowercase + string.digits
        token = ''.join([random.choice(chars) for x in range(40)])
        user_row.verification_token = token
        user_row.verified_email = self.request.get('email')
        user_row.verified = False
        user_row.put()
        return user_row

    def email_verification(self, user_row):
        subject = "Rawscripts Email Verification"
        link = "http://www.rawscripts.com/verify-email?token=" + user_row.verification_token
        paragraphs = [ "Thanks for verifying your email with Rawscripts. Step one is done. Now to finish, just follow this link back to Rawscripts:",
                       link,
                       "You may need to copy and paste the above link into your browser.",
                       "Thanks, from Rawscripts"]
        body = "\n\n".join(paragraphs)
        html = ""
        for paragraph in paragraphs:
            html += "<p>"
            if paragraph == link:
                html += '<a href="' + link + '">' + link + "</a>"
            else:
                html += paragraph
            html += "</p>"

        logging.info(html)
        mail.send_mail(sender='Rawscripts <noreply@rawscripts.com>',
                       to=user_row.verified_email,
                       subject=subject,
                       body = body,
                       html = html)
        return "sent"

    def get(self):
        token = self.request.get(token)

def main():
    application = webapp.WSGIApplication([('/scriptlist', ScriptList),
                                          ('/list', List),
                                          ('/verify-email', VerifyEmail)],
                                         debug=True)
    run_wsgi_app(application)

if __name__ == '__main__':
    main()
