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
from flask_models import UsersScripts, Folder, UnreadNote, ShareNotify


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
    screenplays = UsersScripts.query.filter_by(user=user). \
                      order_by(UsersScripts.last_updated.desc()).all()

    # One query for all the collaborators and owner information
    resource_ids = [screenplay.resource_id for screenplay in screenplays]
    shared_screenplays = []
    if resource_ids:
        shared_screenplays = UsersScripts.query.filter(UsersScripts.user != user). \
                                 filter(UsersScripts.resource_id.in_(resource_ids)).all()
    share_data = {}
    for s in shared_screenplays:
        if s.resource_id not in share_data:
            share_data[s.resource_id] = {'collabs': []}
        if s.permission == 'owner':
            share_data[s.resource_id]['owner'] = s.user
        else:
            share_data[s.resource_id]['collabs'].append(s.user)

    # count all unread notes by resource_id
    unread_notes = {}
    for unread_note in UnreadNote.query.filter_by(user=user).all():
        r_id = unread_note.resource_id
        if r_id not in unread_notes:
            unread_notes[r_id] = 0
        unread_notes[r_id] += 1

    share_notifications = ShareNotify.get_by_email(user)
    unopened_screenplays = set([n.resource_id for n in share_notifications if not n.opened])
    owned = []
    shared = []
    for screenplay in screenplays:
        if screenplay.permission == "hardDelete":
            continue
        resource_id = screenplay.resource_id
        data = [resource_id, screenplay.title]
        obj = {
            'resource_id': resource_id,
            'title': screenplay.title,
            'last_updated': format_time(screenplay.last_updated),
            'permission': screenplay.permission,
            'folder': screenplay.folder
        }
        permission = screenplay.permission
        if permission == 'collab':
            obj['owner'] = share_data.get(resource_id, {}).get('owner', 'shared')
        if screenplay.permission != 'collab':
            sharing_with = share_data.get(resource_id, {}).get('collabs', [])
            obj['shared_with'] = sharing_with
        new_notes = unread_notes.get(screenplay.resource_id, 0)
        obj['new_notes'] = new_notes

        if screenplay.permission == 'collab':
            unopened = resource_id in unopened_screenplays
            obj["unopened"] = unopened

        if screenplay.permission == 'collab':
            shared.append(obj)
        elif screenplay.permission in ['owner', 'ownerDeleted']:
            obj["is_trashed"] = screenplay.permission == 'ownerDeleted'
            owned.append(obj)

    folders = []
    folders_data = Folder.query.filter_by(user=user).first()
    if folders_data:
        folders = json.loads(folders_data.data)
    output = [owned, shared, folders]
    return json.dumps(output)

@app.route('/screenplay_data')
@login_required
def screenplay_data():
    user = current_user.email.lower()
    screenplays = UsersScripts.query.filter(db.func.lower(UsersScripts.user) == user). \
                      filter_by(permission='owner'). \
                      order_by(UsersScripts.last_updated.desc()).all()

    return render_template('flask_screenplay_data.html', user=user, screenplays=screenplays)
