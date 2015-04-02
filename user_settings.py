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
import wsgiref.handlers
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
import config
import models
from utils import gcu, permission, ownerPermission, get_template_path


class SettingsPage (webapp.RequestHandler):
    def get(self):
        user = users.get_current_user()
        if not user:
            self.redirect('/')
            return

        path = get_template_path('html/settings.html')
        template_values = { 'sign_out': users.create_logout_url('/') }
        template_values['user'] = users.get_current_user().email()
        try:
            us = db.get(db.Key.from_path('UsersSettings', 'settings'+gcu()))
        except:
            us = None
        if us==None:
            us = models.UsersSettings(key_name='settings'+gcu(),
                                autosave=True,
                                owned_notify = 'every',
                                shared_notify = 'every')
            us.put()
            template_values['autosaveEnabled']='checked'
            template_values['autosaveDisabled']=''
            template_values['owned_every_selected']='selected'
            template_values['owned_daily_selected']=''
            template_values['owned_none_selected']=''
            template_values['shared_every_selected']='selected'
            template_values['shared_daily_selected']=''
            template_values['shared_none_selected']=''

        else:
            if us.autosave==True:
                template_values['autosaveEnabled']='checked'
                template_values['autosaveDisabled']=''
            else:
                template_values['autosaveEnabled']=''
                template_values['autosaveDisabled']='checked'
            if us.owned_notify=='every':
                template_values['owned_every_selected']='selected'
                template_values['owned_daily_selected']=''
                template_values['owned_none_selected']=''
            elif us.owned_notify=='daily':
                template_values['owned_every_selected']=''
                template_values['owned_daily_selected']='selected'
                template_values['owned_none_selected']=''
            else:
                template_values['owned_every_selected']=''
                template_values['owned_daily_selected']=''
                template_values['owned_none_selected']='selected'
            if us.shared_notify=='every':
                template_values['shared_every_selected']='selected'
                template_values['shared_daily_selected']=''
                template_values['shared_none_selected']=''
            elif us.shared_notify=='daily':
                template_values['shared_every_selected']=''
                template_values['shared_daily_selected']='selected'
                template_values['shared_none_selected']=''
            else:
                template_values['shared_every_selected']=''
                template_values['shared_daily_selected']=''
                template_values['shared_none_selected']='selected'
        template_values['GA'] = config.GA
        template_values['MODE'] = config.MODE
        self.response.headers['Content-Type'] = 'text/html'
        self.response.out.write(template.render(path, template_values))


class ChangeUserSetting(webapp.RequestHandler):
    def post(self):
        user = users.get_current_user()
        if not user:
            return

        k = self.request.get('k')
        v = self.request.get('v')
        try:
            us = db.get(db.Key.from_path('UsersSettings', 'settings'+gcu()))
        except:
            us = None
        if us==None:
            us = models.UsersSettings(key_name='settings'+gcu(),
                                autosave=True,
                                owned_notify = 'every',
                                shared_notify = 'every')
        if k=='autosave':
            if v=='Enable':
                value=True
            else:
                value=False
            us.autosave=value
            us.put()
            output = "sent"
        elif k=='owned_notify':
            us.owned_notify=v
            us.put()
            output = 'owned_notifySaved'
        elif k=='shared_notify':
            us.shared_notify = v
            us.put()
            output = 'shared_notifySaved'
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(output)

def main():
    application = webapp.WSGIApplication([('/settings', SettingsPage),
                                          ('/changeusersetting', ChangeUserSetting),],
                                         debug=True)
    run_wsgi_app(application)

if __name__ == '__main__':
    main()
