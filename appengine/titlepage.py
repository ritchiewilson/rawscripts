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
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
import config
from models import TitlePageData

from utils import ownerPermission, get_template_path

class TitlePage(webapp.RequestHandler):
    def get(self):
        resource_id = self.request.get('resource_id')
        if resource_id == "Demo":
            p = "Duck Soup"
        else:
            user = users.get_current_user()
            if not user:
                self.redirect('/')
                return
            p = ownerPermission(resource_id)
        if p == False:
            return

        if resource_id == "Demo":
            template_values = { 'sign_out': "/" }
            template_values['user'] = "test@example.com"

        else:
            template_values = { 'sign_out': users.create_logout_url('/') }
            template_values['user'] = users.get_current_user().email()

        if resource_id == "Demo":
            template_values = {
                'title' : "Duck Soup",
                'authorOne' : "Arthur Sheekman",
                'authorTwo' : "Harry Ruby",
                'authorTwoChecked' : "checked",
                'authorThree' : "Bert Kalmar",
                'authorThreeChecked': "checked",
                'based_on' : "none",
                'based_onChecked' : "",
                'address' : "183 E. 93rd St\nSuite 9\nNY, NY",
                'addressChecked' : "checked",
                'phone' : "212-555-5555",
                'phoneChecked' : "checked",
                'cell' : "",
                'cellChecked' : "",
                'email' : "test@example.com",
                'emailChecked' : "checked",
                'registered': "",
                'registeredChecked' : "",
                'other' : "",
                'otherChecked' : ""
            }

        else:
            r = TitlePageData.get_or_create(resource_id, p)
            template_values = {
                'title' : r.title,
                'authorOne' : r.authorOne,
                'authorTwo' : r.authorTwo,
                'authorTwoChecked' : r.authorTwoChecked,
                'authorThree' : r.authorThree,
                'authorThreeChecked': r.authorThreeChecked,
                'based_on' : r.based_on.replace("LINEBREAK", '\n'),
                'based_onChecked' : r.based_onChecked,
                'address' : r.address.replace("LINEBREAK", '\n'),
                'addressChecked' : r.addressChecked,
                'phone' : r.phone,
                'phoneChecked' : r.phoneChecked,
                'cell' : r.cell,
                'cellChecked' : r.cellChecked,
                'email' : r.email,
                'emailChecked' :r.emailChecked,
                'registered': r.registered,
                'registeredChecked' : r.registeredChecked,
                'other' : r.other,
                'otherChecked' : r.otherChecked
            }

        template_values['MODE'] = config.MODE
        template_values['GA'] = config.GA
        path = get_template_path('html/titlepage.html')
        self.response.headers['Content-Type'] = 'text/html'
        self.response.out.write(template.render(path, template_values))

class SaveTitlePage (webapp.RequestHandler):
    def post(self):
        resource_id = self.request.get('resource_id')
        if resource_id == "Demo":
            return
        title = ownerPermission(resource_id)
        if title == False:
            return

        i = TitlePageData().get_or_create(resource_id, title)

        i.resource_id = resource_id
        i.title = self.request.get('title')
        i.authorOne = self.request.get('authorOne')
        i.authorTwo = self.request.get('authorTwo')
        i.authorTwoChecked = self.request.get('authorTwoChecked')
        i.authorThree = self.request.get('authorThree')
        i.authorThreeChecked = self.request.get('authorThreeChecked')
        i.based_on = self.request.get('based_on')
        i.based_onChecked = self.request.get('based_onChecked')
        i.address = self.request.get('address')
        i.addressChecked = self.request.get('addressChecked')
        i.phone = self.request.get('phone')
        i.phoneChecked = self.request.get('phoneChecked')
        i.cell = self.request.get('cell')
        i.cellChecked = self.request.get('cellChecked')
        i.email = self.request.get('email')
        i.emailChecked = self.request.get('emailChecked')
        i.registered = self.request.get('registered')
        i.registeredChecked = self.request.get('registeredChecked')
        i.other = self.request.get('other')
        i.otherChecked = self.request.get('otherChecked')
        i.put()

        self.response.headers['Content-Type']='text/plain'
        self.response.out.write('1')

def main():
    application = webapp.WSGIApplication([('/titlepage', TitlePage),
                                          ('/titlepagesave', SaveTitlePage)],
                                         debug=True)

    run_wsgi_app(application)

if __name__ == '__main__':
    main()
