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

from flask import render_template, request, jsonify, redirect, url_for, Response
from flask_user import login_required, current_user

from rawscripts import db, app
from flask_models import UsersScripts, ScriptData, Screenplay, Note, UnreadNote, ShareNotify
from flask_utils import get_current_user_email_with_default


@app.route('/editor')
def editor():
    resource_id = request.args.get('resource_id')
    if not current_user.is_authenticated() and resource_id != 'Demo':
        return redirect(url_for('welcome'))

    user_email = get_current_user_email_with_default()

    permission = UsersScripts.get_users_permission(resource_id, user_email)
    if permission is None and resource_id != 'Demo':
        return redirect(url_for('scriptlist'))

    notification = ShareNotify.query. \
                       filter_by(resource_id=resource_id, user=user_email).first()
    if notification:
        notification.opened = True
        notification.timeopened = datetime.utcnow()
        db.session.commit()

    EOV = 'editor' if permission == 'owner' else 'viewer'
    sign_out = '/user/sign-out'
    return render_template('editor.html', user=user_email, mode="PRO",
                           resource_id=resource_id, EOV=EOV, sign_out=sign_out)

@app.route('/scriptcontent', methods=['POST'])
def scriptcontent():
    resource_id = request.form['resource_id']
    if resource_id == 'Demo':
        latest_version = ScriptData.get_latest_version('Demo')
        lines = [["Fade in:", 1], ["INT. ", 0]]
        if latest_version is not None:
            lines = json.loads(latest_version.data)
        return jsonify(title='Duck Soup', lines=lines,
                       notes=[], sharedwith=[], contacts=[], autosave='true')

    user_email = get_current_user_email_with_default()
    screenplay = UsersScripts.query.filter_by(resource_id=resource_id,
                                              user=user_email).first()
    if not screenplay:
        return 'not found'

    latest_version = ScriptData.get_latest_version(resource_id)
    sharedwith = UsersScripts.get_all_collaborators(resource_id)

    user = current_user.name
    unread_notes = UnreadNote.query. \
                       filter_by(resource_id=resource_id, user=user).all()
    unread_msg_ids = set([n.msg_id for n in unread_notes])
    note_rows = Note.get_by_resource_id(resource_id)
    notes = [note.to_dict(unread_msg_ids) for note in note_rows]

    return jsonify(title=screenplay.title,
                   lines=json.loads(latest_version.data),
                   lastSavedVersionNumber=latest_version.version,
                   notes=notes,
                   sharedwith=sharedwith,
                   autosave='true')

@app.route('/save', methods=['POST'])
@login_required
def save_screenplay():
    resource_id = request.form['resource_id']
    if resource_id == 'Demo':
        return Response('demo', mimetype='text/plain')

    failed = Response('0', mimetype='text/plain')

    user_email = current_user.name
    permission = UsersScripts.get_users_permission(resource_id, user_email)
    if permission != 'owner':
        return failed

    latest_version_number = Screenplay.get_latest_version_number(resource_id)
    new_version_number = latest_version_number + 1

    expected_version_number = request.form.get('expected_version_number', None)
    if expected_version_number is not None:
        expected_version_number = int(expected_version_number)
        if Screenplay.version_exists(resource_id, expected_version_number):
            return failed
        if expected_version_number > (latest_version_number + 5):
            return failed
        new_version_number = expected_version_number

    data = request.form['data']
    # set some limit on how much data can be saved
    if len(data) > 800 * 1000:
        return failed
    autosave  = (int(request.form['autosave']) == 1)
    now = datetime.utcnow()
    new_save = ScriptData(resource_id=resource_id,
                          data=data,
                          version=new_version_number,
                          timestamp=now,
                          export='[[],[]]',
                          tag='',
                          autosave=autosave)
    db.session.add(new_save)
    screenplays = UsersScripts.query.filter_by(resource_id=resource_id).all()
    for screenplay in screenplays:
        screenplay.last_updated = now
    db.session.commit()
    if expected_version_number is None:
        return Response('1', mimetype='text/plain')
    return jsonify(success=True, versionSaved=new_version_number)
