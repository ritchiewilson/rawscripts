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


from google.appengine.api import users
from google.appengine.ext import db

from models import ScriptData

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
    row = ScriptData.get_by_resource_id_and_user(resource_id, user)
    if row.permission in permissions:
        return row.title
    return False

def permission (resource_id):
    permissions = ['owner', 'ownerDeleted', 'collab']
    return _permission_helper(resource_id, permissions)

def ownerPermission (resource_id):
    permissions = ['owner', 'ownerDeleted']
    return _permission_helper(resource_id, permissions)
