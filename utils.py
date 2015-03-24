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


def gcu():
    """
    Get current user. This is just the email string, lower cased.
    """
    user = users.get_current_user().email().lower()
    if user == 'mwap.cw@gmail.com':
        user = 'mwap.cw@googlemail.com'
    return user


def permission (resource_id):
    q = db.GqlQuery("SELECT * FROM UsersScripts "+
                    "WHERE resource_id='"+resource_id+"'")
    results = q.fetch(1000)
    user = gcu()
    p = False
    for i in results:
        if i.permission == 'owner' or i.permission == 'ownerDeleted' or i.permission == 'collab':
            if i.user == user or users.is_current_user_admin():
                p = i.title
                break
    return p

def ownerPermission (resource_id):
    q = db.GqlQuery("SELECT * FROM UsersScripts "+
                    "WHERE resource_id='"+resource_id+"'")
    results = q.fetch(1000)
    user = gcu()
    p = False
    for i in results:
        if i.permission == 'owner' or i.permission == 'ownerDeleted':
            if i.user == user:
                p = i.title
    return p
