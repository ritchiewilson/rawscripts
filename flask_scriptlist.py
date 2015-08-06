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

import json
from datetime import datetime

from flask import render_template, request, jsonify, redirect, url_for, get_flashed_messages
from flask_user import login_required, current_user

from rawscripts import db, app
from flask_models import Folder, UnreadNote, ShareNotify, Screenplay


@app.route('/scriptlist')
@login_required
def scriptlist():
    sign_out = '/user/sign-out'
    user = current_user.name
    email_verified = True
    # TODO: display flashed messages in scriptlist. For now, just clear queue
    get_flashed_messages()
    return render_template('scriptlist.html', user=user, sign_out=sign_out,
                           email_verified=email_verified)

def format_time(time):
    time = time.replace(tzinfo=None)
    d = datetime.utcnow() - time
    if d.days > 0:
        return time.strftime("%b %d")
    elif d.seconds > 7200:
        return str(int(round(d.seconds/3600))) + " hours ago"
    elif d.seconds > 60:
        return str(int(round(d.seconds/60))) + " minutes ago"
    return "Seconds ago"

@app.route('/list', methods=['POST'])
@login_required
def list():
    user = current_user.email

    # count all unread notes by resource_id
    unread_notes = {}
    for unread_note in UnreadNote.query.filter_by(user=user).all():
        r_id = unread_note.resource_id
        if r_id not in unread_notes:
            unread_notes[r_id] = 0
        unread_notes[r_id] += 1

    share_notifications = ShareNotify.get_by_email(user)
    unopened_screenplays = set([n.resource_id for n in share_notifications if not n.opened])
    shared = []
    read_only = current_user.read_only_screenplays
    for screenplay in sorted(read_only, key=lambda obj: obj.last_updated, reverse=True):
        if screenplay.is_trashed or screenplay.is_hard_deleted:
            continue
        resource_id = screenplay.resource_id
        obj = {
            'resource_id': resource_id,
            'title': screenplay.title,
            'last_updated': format_time(screenplay.last_updated),
            'owner': screenplay.owner.email,
            'new_notes': unread_notes.get(resource_id, 0),
            'unopened': resource_id in unopened_screenplays
        }
        shared.append(obj)

    owned = []
    screenplays = current_user.screenplays
    for screenplay in sorted(screenplays, key=lambda obj: obj.last_updated, reverse=True):
        if screenplay.is_hard_deleted:
            continue
        resource_id = screenplay.resource_id
        obj = {
            'resource_id': resource_id,
            'title': screenplay.title,
            'last_updated': format_time(screenplay.last_updated),
            'is_trashed': screenplay.is_trashed,
            'shared_with': Screenplay.get_all_collaborators(resource_id),
            'new_notes': unread_notes.get(resource_id, 0),
            'folder': screenplay.get_folder()
        }
        owned.append(obj)

    folders = []
    folders_data = Folder.query.filter_by(user=user).first()
    if folders_data:
        folders = json.loads(folders_data.data)
    output = [owned, shared, folders]
    return json.dumps(output)
