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

from flask import Response, request, render_template
from flask_mail import Message
from flask_user import login_required, current_user

from rawscripts import db, app, mail
from flask_models import Screenplay, Note, UnreadNote, UsersScripts
from flask_utils import get_current_user_email_with_default, resource_access


def new_note_notification(resource_id, from_user, thread_id, msg_id):
    for peer in UsersScripts.query.filter_by(resource_id=resource_id).all():
        if peer.user.lower() == from_user.lower():
            continue
        unread = UnreadNote(resource_id=resource_id,
                             user=peer.user,
                             thread_id=thread_id,
                             msg_id=msg_id)
        db.session.add(unread)
    db.session.commit()

@app.route('/notesnewthread', methods=['POST'])
@resource_access(allow_collab=True)
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
        new_note_notification(resource_id, user, thread_id, msg_id)
        db.session.commit()

    if request.form['fromPage'] == 'mobileviewnotes':
        return Response('sent', mimetype='text/plain')
    dump = json.dumps([row, col, thread_id, msg_id, user])
    return Response(dump, mimetype='text/plain')

@app.route('/notessubmitmessage', methods=['POST'])
@resource_access(allow_collab=True)
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
    new_note_notification(resource_id, user, thread_id, msg_id)
    db.session.commit()
    if request.form['fromPage'] == 'mobileviewnotes':
        return Response('sent', mimetype='text/plain')
    output = json.dumps([content, msg_id, user, thread_id])
    return Response(output, mimetype='text/plain')

@app.route('/notesposition', methods=['POST'])
@resource_access()
def notes_position():
    resource_id = request.form['resource_id']
    positions = request.form['positions']
    now = datetime.utcnow()
    for row, col, thread_id in json.loads(positions):
        thread = Note.get_by_thread_id(thread_id)
        thread.row = row
        thread.col = col
        thread.updated = now
    db.session.commit()
    return Response('1', mimetype='text/plain')

@app.route('/notesdeletethread', methods=['POST'])
@login_required
@resource_access()
def notes_delete_thread():
    resource_id = request.form['resource_id']
    thread_id = request.form['thread_id']
    thread = Note.get_by_thread_id(thread_id)
    db.session.delete(thread)
    unread_notes = UnreadNote.query.filter_by(thread_id=thread_id).all()
    for note in unread_notes:
        db.session.delete(note)
    db.session.commit()
    return Response('1', mimetype='text/plain')

@app.route('/notesdeletemessage', methods=['POST'])
@login_required
@resource_access(allow_collab=True)
def notes_delete_message():
    resource_id = request.form['resource_id']
    thread_id = request.form['thread_id']
    # TODO: fix inconsistant field name
    msg_id = request.form['msgId']
    user = current_user.name
    thread = Note.get_by_thread_id(thread_id)
    if thread is None:
        return Response('no thread', mimetype='text/plain')

    # TODO: check if actually is owner
    is_owner = True

    def should_keep(msg):
        _content, _user, _id = msg
        # lack permission to delete
        if not (_user == user or is_owner):
            return True
        # keep if it's not the message we're looking for
        return _id != msg_id

    msgs = json.loads(thread.data)
    new_msgs = filter(should_keep, msgs)
    if len(msgs) == len(new_msgs):
        return Response('error', mimetype='text/plain')
    if len(new_msgs) == 0:
        db.session.delete(thread)
    else:
        thread.data = json.dumps(new_msgs)
        thread.updated = datetime.utcnow()
    unread_notes = UnreadNote.query.filter_by(msg_id=msg_id).all()
    for note in unread_notes:
        db.session.delete(note)
    db.session.commit()
    return Response('deleted', mimetype='text/plain')

@app.route('/notesview')
@login_required
@resource_access(allow_collab=True)
def notes_view():
    resource_id = request.args.get('resource_id')
    title = Screenplay.get_title(resource_id)
    notes = Note.get_by_resource_id(resource_id)
    output = [[n.row, n.col, json.loads(n.data), n.thread_id] for n in notes]
    j = json.dumps(output)
    # TODO: figure out correct permission here
    f = False # is allowed to delete threads? defaulting to NO
    return render_template('mobile/MobileViewNotes.html', j=j, title=title, f=f,
                           user=current_user.name, sign_out='/user/sign-out')

@app.route('/notesmarkasread', methods=['POST'])
@login_required
@resource_access(allow_collab=True)
def notes_mark_as_read():
    resource_id = request.form['resource_id']
    thread_id = request.form['thread_id']
    msg_id = request.form['msg_id']
    user = current_user.name
    # TODO: I think javascript is double calling this endpoint each time
    unread_note = UnreadNote.query.filter_by(user=user, msg_id=msg_id).first()
    if unread_note:
        db.session.delete(unread_note)
        db.session.commit()
    return Response('ok', mimetype='text/plain')
