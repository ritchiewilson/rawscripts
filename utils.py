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

import urllib
import os

from google.appengine.api import users
from google.appengine.ext import db
from google.appengine.api import mail
from google.appengine.api import urlfetch
import logging

from models import UsersScripts

def gcu():
    """
    Get current user. This is just the email string, lower cased.
    """
    user = users.get_current_user().email().lower()
    if user == 'mwap.cw@gmail.com':
        user = 'mwap.cw@googlemail.com'
    return user


def _permission_helper(resource_id, permissions):
    user = gcu()
    row = UsersScripts.get_by_resource_id_and_user(resource_id, user)
    if row.permission in permissions:
        return row.title
    return False

def permission (resource_id):
    permissions = ['owner', 'ownerDeleted', 'collab']
    return _permission_helper(resource_id, permissions)

def ownerPermission (resource_id):
    permissions = ['owner', 'ownerDeleted']
    return _permission_helper(resource_id, permissions)

def send_mail(sender=None, to=None, subject=None, body=None, html=None):
    if None in [sender, to, subject, body]:
        raise Exception("Error when sending mail")
    try:
        mail.send_mail(sender=sender,
                       to=to,
                       subject=subject,
                       body = body,
                       html = html)
        return True
    except:
        pass
    form_fields = {
        'sender': sender,
        "to": to,
        'subject': subject,
        'body': body,
        'html': html
    }
    url = "http://rawscripts-emailer.appspot.com"
    form_data = urllib.urlencode(form_fields)
    result = urlfetch.fetch(url=url,
                            payload=form_data,
                            method=urlfetch.POST,
                            headers={'Content-Type': 'application/x-www-form-urlencoded'})
    return result.content == 'worked'

def get_template_path(path):
    return os.path.join(os.path.dirname(__file__), path)
