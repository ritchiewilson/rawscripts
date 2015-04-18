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

from datetime import datetime
import json

from flask import Response, request
from flask_mail import Message
from flask_user import login_required, current_user

from rawscripts import db, app, mail
from flask_models import Note
from flask_utils import get_current_user_email_with_default


@app.route('/notesnewthread', methods=['POST'])
def notes_new_thread():
    resource_id = request.form['resource_id']
    row = int(request.form['row'])
    col = int(request.form['col'])
    thread_id = request.form['thread_id']
    content = request.form['content']
    msg_id = str(datetime.utcnow())
    user = get_current_user_email_with_default()
    if resource_id != "Demo":
        message = [content, user, msg_id]
        data = json.dumps([message])
        note = Note(resource_id=resource_id, thread_id=thread_id,
                    data=data, row=row, col=col)
        db.session.add(note)
        db.session.commit()

    if request.form['fromPage'] == 'mobileviewnotes':
        return Response('sent', mimetype='text/plain')
    dump = json.dumps([row, col, thread_id, msg_id, user])
    return Response(dump, mimetype='text/plain')

@app.route('/notessubmitmessage', methods=['POST'])
def notes_submit_message():
    resource_id = request.form['resource_id']
    thread_id = request.form['thread_id']
    content = request.form['content']
    msg_id = request.form['msg_id'] # only if this edits a previous message
    user = get_current_user_email_with_default()
    if resource_id == 'Demo':
        output = json.dumps([content, msg_id, user, thread_id])
        return Response(output, mimetype='text/plain')

    thread = Note.get_by_thread_id(thread_id)
    msgs = json.loads(thread.data)
    was_new_message = True
    for msg in msgs:
        _content, _user, _id = msg
        if _id == msg_id and _user == user:
            msg[0] = content
            was_new_message = False

    if was_new_message:
        msg_id = str(datetime.utcnow())
        msgs.append([content, user, msg_id])

    thread.data = json.dumps(msgs)
    thread.updated = datetime.utcnow()
    db.session.commit()
    if request.form['fromPage'] == 'mobileviewnotes':
        return Response('sent', mimetype='text/plain')
    output = json.dumps([content, msg_id, user, thread_id])
    return Response(output, mimetype='text/plain')
