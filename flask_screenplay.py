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


from flask import Response, request
from flask_mail import Message
from flask_user import login_required, current_user

from rawscripts import db, app, mail
from flask_models import Screenplay, UsersScripts


@app.route('/newscript', methods=['POST'])
@login_required
def new_screenplay():
    filename = request.form['filename']
    user = current_user.name
    screenplay = Screenplay.create(filename, user)
    return Response(screenplay.resource_id, mimetype='text/plain')

@app.route('/emailscript', methods=['POST'])
@login_required
def email_screenplay():
    resource_id = request.form['resource_id']
    title_page = request.form['title_page']
    subject = request.form['subject']
    body_message = request.form['body_message']
    recipients = request.form['recipients'].split(',')

    # Build email body and html
    body = body_message + "\n\n\n    	"
    body += "--- This Script written and sent from RawScripts.com."
    body += " Check it out---"
    with app.open_resource('static/text/email.txt') as f:
        html_template = f.read()
    html = html_template.replace("FILLERTEXT", body_message)

    # get pdf file to attach
    export_file = Screenplay.export_to_file(resource_id, 'pdf')
    _file, title, content_type = export_file
    filename = title + '.pdf'

    msg = Message(subject, recipients=recipients, body=body, html=html)
    msg.attach(filename, content_type, _file.getvalue())
    mail.send(msg)

    return Response('sent', mimetype='text/plain')

@app.route('/rename', methods=['POST'])
@login_required
def rename_screenplay():
    resource_id = request.form['resource_id']
    rename = request.form['rename']
    screenplays = UsersScripts.query.filter_by(resource_id=resource_id).all()
    for screenplay in screenplays:
        screenplay.title = rename
    db.session.commit()
    return Response('done', mimetype='text/plain')

def switch_deletion_permissions(switches):
    resource_id = request.form['resource_id']
    screenplays = UsersScripts.query.filter_by(resource_id=resource_id).all()
    for screenplay in screenplays:
        if screenplay.permission in switches:
            screenplay.permission = switches[screenplay.permission]
    db.session.commit()

@app.route('/delete', methods=['POST'])
@login_required
def delete_screenplay():
    switches = {'owner': 'ownerDeleted',
                'collab': 'collabDeletedByOwner'}
    switch_deletion_permissions(switches)
    return Response('1', mimetype='text/plain')

@app.route('/undelete', methods=['POST'])
@login_required
def undelete_screenplay():
    switches = {'ownerDeleted': 'owner',
                'collabDeletedByOwner': 'collab'}
    switch_deletion_permissions(switches)
    return Response('1', mimetype='text/plain')

@app.route('/harddelete', methods=['POST'])
@login_required
def hard_delete_screenplay():
    resource_id = request.form['resource_id']
    screenplays = UsersScripts.query.filter_by(resource_id=resource_id).all()
    for screenplay in screenplays:
        screenplay.permission = 'hardDelete'
    db.session.commit()
    return Response('1', mimetype='text/plain')
