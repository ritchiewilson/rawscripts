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


import StringIO
import os
import cgi
import wsgiref.handlers
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
import datetime
from django.utils import simplejson
import mobileTest
from google.appengine.api import memcache
import config
import models

from utils import gcu, permission, get_template_path


# Get Current User String
def _gcu():
    c_user = users.get_current_user()
    if c_user:
        user = c_user.email().lower()
    else:
        user = 'test@example.com'
    if user == 'mwap.cw@gmail.com':
        user = 'mwap.cw@googlemail.com'
    return user

class Editor (webapp.RequestHandler):
    def get(self):
        user = users.get_current_user()
        user_string = _gcu()
        path = get_template_path('html/editor.html')
        template_values = {'EOV': "editor",
                           'user': user_string}
        resource_id = self.request.get('resource_id')
        mobile = mobileTest.mobileTest(self.request.user_agent)
        if mobile == 1:
            self.redirect('/scriptlist')
            return
        if user and resource_id != "Demo":
            template_values['sign_out'] = users.create_logout_url('/')
            screenplay = models.UsersScripts. \
                             get_by_resource_id_and_user(resource_id, gcu())
            if not screenplay:
                self.redirect("/")
                return
            if screenplay.permission != 'owner':
                template_values['EOV'] = "viewer"
            unopened = models.ShareNotify. \
                           get_by_resource_id_and_user(resource_id, gcu())
            if unopened and not unopened[0].opened:
                unopened[0].opened = True
                unopened[0].timeopened = datetime.datetime.today()
                unopened[0].put()
        elif resource_id == 'Demo':
            template_values['sign_out'] =  '/'
        else:
            url = '/editor?resource_id=' + resource_id
            template_values = {
                'google_sign_in': users.create_login_url(url, None, 'gmail.com'),
                'yahoo_sign_in': users.create_login_url(url, None, 'yahoo.com')}
            path = get_template_path('html/login.html')

        dev_js = ['base', 'calc', 'canvas-manipulate', 'ccp', 'dom-manipulate',
                  'draw', 'editor', 'findAndReplace', 'init', 'keyboard',
                  'menu', 'mouse', 'notes', 'prompts', 'sort', 'spellcheck',
                  'window']
        pro_js = ['editor-compiled']
        dev_css = ['menu', 'menuitem', 'menuseparator', 'common', 'toolbar',
                   'button', 'custombutton', 'autocomplete', 'dialog',
                   'linkbutton', 'tab', 'tabbar', 'colormenubutton', 'palette',
                   'colorpalette', 'editor/bubble', 'editor/dialog',
                   'editor/linkdialog', 'editortoolbar']
        pro_css = []
        template_values['resource_id'] = resource_id
        template_values['MODE'] = config.MODE
        template_values['EDITOR_JS'] = pro_js if config.MODE == "PRO" else dev_js
        template_values['EDITOR_CSS'] = pro_css if config.MODE == "PRO" else dev_css
        template_values['GA'] = config.GA
        self.response.headers['Content-Type'] = 'text/html'
        self.response.out.write(template.render(path, template_values))

class ScriptContent (webapp.RequestHandler):
    def post(self):
        resource_id = self.request.get('resource_id')
        p = False
        if resource_id=='Demo':
            p = True
            title = "Duck Soup"
        else:
            title = permission(resource_id)
            p = (title is not False)

        if not p:
            self.response.headers["Content-Type"]='text/plain'
            self.response.out.write('not found')
            return
        noteresults = models.Notes.get_by_resource_id(resource_id)
        user = users.get_current_user()
        if user:
            un = models.UnreadNotes.get_by_resource_id(resource_id, user=gcu())
        else:
            un=None
        notes=[]
        for i in noteresults:
            msgs = simplejson.loads(i.data)
            if un==None:
                for unit in msgs:
                    unit.append(1)
            else:
                for unit in msgs:
                    found=False
                    for j in un:
                        if j.msg_id==unit[2]:
                            unit.append(0)
                            found=True
                    if found==False:
                        unit.append(1)

            msgsArr=[]
            for j in msgs:
                msgsArr.append({'text':j[0], 'user':j[1], 'msg_id':j[2], 'readBool':j[3]})

            dic = { 'row':i.row,
                    'col':i.col,
                    'msgs':msgsArr,
                    'thread_id':i.thread_id}
            notes.append(dic)

        shareresults = models.UsersScripts.get_by_resource_id(resource_id)
        sharedwith = [s.user for s in shareresults if s.permission == 'collab']

        autosave = 'true'
        try:
            us = db.get(db.Key.from_path('UsersSettings', 'settings'+_gcu()))
            autosave = 'true' if us.autosave else 'false'
        except:
            pass

        screenplay = models.ScriptData.get_latest_version(resource_id)
        ja={}
        ja['title'] = title
        ja['lines'] = simplejson.loads(screenplay.data)
        ja['spelling'] = []
        ja['notes'] = notes
        ja['sharedwith'] = sharedwith
        ja['contacts'] = []
        ja['autosave'] = autosave
        self.response.headers["Content-Type"]='text/plain'
        self.response.out.write(simplejson.dumps(ja))


class Save (webapp.RequestHandler):
    def post(self):
        resource_id = self.request.get('resource_id')
        if resource_id == None:
            return
        self.response.headers['Content-Type'] = 'text/plain'
        if resource_id == 'Demo':
            self.response.out.write('demo')
            return
        current_user = _gcu()
        q = models.UsersScripts.all()
        q.filter('resource_id', resource_id)
        q.filter('user =', current_user)
        q.filter('permission =', 'owner')
        screenplay = q.get()
        if screenplay == None:
            self.response.out.write('0')
            return

        last_version_number = None
        cache_key = 'last_saved_version#' + resource_id
        cache_hit = memcache.get(cache_key)
        if cache_hit:
            last_version_number = int(cache_hit)
        else:
            most_recent = models.ScriptData.get_latest_version(resource_id)
            last_version_number = most_recent.version

        new_version_number = last_version_number + 1
        data = self.request.get('data')
        autosave = 0 if self.request.get('autosave') == "0" else 1
        a = models.ScriptData(resource_id=resource_id,
                              title='title',
                              data=data,
                              version=new_version_number,
                              export='[[],[]]',
                              tag='',
                              autosave=autosave)
        a.put()
        memcache.set(cache_key, new_version_number)

        screenplay.last_updated=datetime.datetime.today()
        screenplay.put()

        self.response.out.write('1')


def main():
    application = webapp.WSGIApplication([('/editor', Editor),
                               ('/scriptcontent', ScriptContent),
                               ('/save', Save),],
                                debug=True)

    run_wsgi_app(application)


if __name__ == '__main__':
    main()
