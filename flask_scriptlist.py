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
from flask_models import UsersScripts, Folder


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
    user = current_user.name
    screenplays = UsersScripts.query.filter_by(user=user). \
                      order_by(UsersScripts.last_updated.desc()).all()
    owned = []
    shared = []
    ownedDeleted = []
    for screenplay in screenplays:
        data = [screenplay.resource_id, screenplay.title]
        data.append(format_time(screenplay.last_updated))
        permission = screenplay.permission
        if permission == 'collab':
            permission = 'shared'
        data.append(permission)
        if screenplay.permission != 'collab':
            sharing_with = []
            data.append(sharing_with)
        new_notes = 0
        if permission != 'ownerDeleted':
            data.append(new_notes)

        data.append(screenplay.folder)

        if screenplay.permission == 'collab':
            # unopened
            data.append("False")

        if screenplay.permission == 'owner':
            owned.append(data)
        elif screenplay.permission == 'collab':
            shared.append(data)
        elif screenplay.permission == 'ownerDeleted':
            ownedDeleted.append(data)

    folders = []
    folders_data = Folder.query.filter_by(user=user).first()
    if folders_data:
        folders = json.loads(folders_data.data)
    output = [owned, ownedDeleted, shared, folders]
    return json.dumps(output)
