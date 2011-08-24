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
from django.utils import simplejson
import datetime
import logging
from google.appengine.ext import db
from google.appengine.api import users
import config

class ActivityDB (db.Model):
	activity = db.StringProperty()
	user = db.StringProperty()
	resource_id = db.StringProperty()
	timestamp = db.DateTimeProperty(auto_now_add=True)
	mobile = db.IntegerProperty()
	size = db.IntegerProperty()
	new_notes = db.IntegerProperty()
	autosave = db.IntegerProperty()
	thread_id = db.StringProperty()
	numberOfScripts = db.IntegerProperty()
	scriptName = db.StringProperty()
	format = db.StringProperty()
	numberOfRecipients = db.IntegerProperty()
	fromPage = db.StringProperty()
	error = db.StringProperty()
	
def activity(activity, user, resource_id, mobile, size, new_notes, autosave, thread_id, numberOfScripts, scriptName, format, numberOfRecipients, fromPage, error):
	a = ActivityDB(activity=activity,
					user=user,
					resource_id=resource_id,
					mobile=mobile,
					size=size,
					new_notes=new_notes,
					autosave=autosave,
					thread_id=thread_id,
					numberOfScripts=numberOfScripts,
					scriptName=scriptName,
					format=format,
					numberOfRecipients=numberOfRecipients,
					fromPage=fromPage,
					error=error)
	a.put()
