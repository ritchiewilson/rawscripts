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
import string
from datetime import datetime
import wsgiref.handlers
from google.appengine.api import users
from google.appengine.api import memcache
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
from django.utils import simplejson
import config
import models
import random
try:
    from Crypto.Cipher import AES
except:
    pass

class FetchPass(webapp.RequestHandler):
    def get(self):
        if not users.is_current_user_admin():
            return
        chars = string.uppercase + string.lowercase + string.digits
        def get_random_chars(n):
            return ''.join([random.choice(chars) for x in range(n)])
        password = get_random_chars(24)
        iv = get_random_chars(16)
        memcache.set(key='fetch_password', value=password)
        memcache.set(key='fetch_iv', value=iv)

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(password + " " + iv)


class FetchDB(webapp.RequestHandler):
    def get(self):
        password = memcache.get('fetch_password')
        iv = memcache.get('fetch_iv')
        if password is None or iv is None:
            self.response.headers['Content-Type'] = 'text/plain'
            self.response.out.write("Missing password or IV")
            return

        table = self.request.get('table')
        output = unicode('@')
        if table == "Users":
            output += self.fetch_by_timestamps('firstUse', models.Users,
                                               self.user_to_string)
        if table == "OpenID2":
            output += self.fetch_by_timestamps('timestamp', models.OpenIDData2,
                                               self.open_id2_to_string)
        if table == "ScriptData":
            output += self.fetch_by_timestamps('timestamp', models.ScriptData,
                                               self.script_data_to_string, do_json=True)
        if table == "DuplicateScripts":
            output += self.fetch_duplicate_scripts()

        if table == "Folders":
            output += self.fetch_folders()

        if table == "UsersScripts":
            output += self.fetch_by_timestamps('last_updated', models.UsersScripts,
                                               self.users_scripts_to_string, do_json=True)
        if table == "BlogDB":
            output += self.fetch_by_timestamps('timestamp', models.BlogDB,
                                               self.blog_to_string, do_json=True)
        diff = 16 - (len(output) % 16)
        output = ('!' * diff) + output
        obj = AES.new(password, AES.MODE_CBC, iv)
        ciphertext = obj.encrypt(output)
        import base64
        ciphertext = base64.b64encode(ciphertext)
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(ciphertext)

    def user_to_string(self, user):
        fields = [user.name, user.firstUse]
        fields = [str(field) for field in fields]
        return ','.join(fields)

    def open_id2_to_string(self, user):
        fields = [user.nickname, user.email, user.user_id,
                  user.federated_identity, user.federated_provider,
                  user.timestamp]
        fields = [str(field) for field in fields]
        return ','.join(fields)

    def script_data_to_string(self, script_data):
        d = [script_data.resource_id, script_data.data, script_data.version,
             str(script_data.timestamp), script_data.autosave,
             script_data.export, script_data.tag]
        return d

    def users_scripts_to_string(self, script):
        d = [script.user, script.resource_id, script.title,
             str(script.last_updated), script.permission, script.folder]
        return d

    def blog_to_string(self, blog):
        d = [blog.data, blog.title, str(blog.timestamp)]
        return d

    def fetch_by_timestamps(self, timestamp_field, model, str_func, do_json=False):
        limit = int(self.request.get('limit'))
        start_time = self.request.get('start_time')
        dt, microseconds = start_time.split('.')
        timestamp = datetime.strptime(dt, "%Y-%m-%dT%H:%M:%S")
        timestamp = timestamp.replace(microsecond=int(microseconds))
        query = model.all()
        query.order(timestamp_field)
        query.filter(timestamp_field + ' >', timestamp)
        if do_json:
            data = [str_func(row) for row in query.run(limit=limit)]
            return simplejson.dumps(data)
        output = ''
        for row in query.run(limit=limit):
            output += str_func(row) + '\n'
        return output

    def fetch_duplicate_scripts(self):
        query = models.DuplicateScripts.all()
        output = ''
        for row in query.run():
            vals = [str(row.key()), row.from_script,
                    row.new_script, str(row.from_version)]
            output += ','.join(vals) + '\n'
        return output

    def fetch_folders(self):
        query = models.Folders.all()
        output = []
        for row in query.run():
            vals = [str(row.key()), row.user, row.data]
            output.append(vals)
        return simplejson.dumps(output)

def main():
    application = webapp.WSGIApplication([('/fetchdb', FetchDB),
                                          ('/fetchpass', FetchPass),],
                                         debug=True)
    run_wsgi_app(application)


if __name__ == '__main__':
    main()
