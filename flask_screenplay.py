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
from flask_models import Screenplay
from flask_utils import resource_access, get_resource_id_from_request

@app.route('/newscript', methods=['POST'])
@login_required
def new_screenplay():
    filename = request.form.get('filename', None)
    if filename is None:
        filename = request.json.get('filename', None)
    user = current_user.name
    screenplay = Screenplay.create(filename, user)
    return Response(screenplay.resource_id, mimetype='text/plain')

@app.route('/emailscript', methods=['POST'])
@login_required
@resource_access(allow_collab=True)
def email_screenplay():
    resource_id = get_resource_id_from_request()
    title_page = request.form.get('title_page', None)
    if title_page is None:
        title_page = request.json.get('title_page', None)
    subject = "Screenplay"
    body_message = ""
    raw_recipients = request.form.get('recipients', None)
    if raw_recipients is None:
        raw_recipients = request.json.get('recipients', None)
    recipients = raw_recipients.split(',')

    # Build email body and html
    body = body_message + "\n\n\n    	"
    body += "--- This screenplay written and sent from RawScripts.com."
    body += " Check it out---"
    with app.open_resource('static/text/email.txt') as f:
        html_template = f.read()
    html = html_template.replace("FILLERTEXT", body_message)

    # get pdf file to attach
    include_title_page = title_page == '1'
    export_file = Screenplay.export_to_file(resource_id, 'pdf', include_title_page)
    _file, title, content_type = export_file
    filename = title + '.pdf'

    msg = Message(subject, recipients=recipients, body=body, html=html)
    msg.attach(filename, content_type, _file.getvalue())
    try:
        mail.send(msg)
    except:
        return Response('failed', mimetype='text/plain')
    return Response('sent', mimetype='text/plain')

@app.route('/rename', methods=['POST'])
@login_required
@resource_access()
def rename_screenplay():
    resource_id = get_resource_id_from_request()
    rename = request.form.get('rename', None)
    if rename is None:
        rename = request.json.get('rename', None)
    Screenplay.rename(resource_id, rename)
    return Response('done', mimetype='text/plain')

@app.route('/delete', methods=['POST'])
@login_required
@resource_access()
def delete_screenplay():
    resource_id = get_resource_id_from_request()
    Screenplay.move_to_trash(resource_id)
    return Response(resource_id, mimetype='text/plain')

@app.route('/undelete', methods=['POST'])
@login_required
@resource_access()
def undelete_screenplay():
    resource_id = get_resource_id_from_request()
    Screenplay.remove_from_trash(resource_id)
    return Response(resource_id, mimetype='text/plain')

@app.route('/harddelete', methods=['POST'])
@login_required
@resource_access()
def hard_delete_screenplay():
    resource_id = get_resource_id_from_request()
    Screenplay.hard_delete(resource_id)
    return Response(resource_id, mimetype='text/plain')

@app.route('/duplicate', methods=['POST'])
@login_required
@resource_access()
def duplicate_screenplay():
    resource_id = get_resource_id_from_request()
    version = Screenplay.get_latest_version_number(resource_id)
    screenplay = Screenplay.duplicate(resource_id, version, current_user.name)
    url = '/editor?resource_id=' + screenplay.resource_id
    return Response(url, mimetype='text/plain')

@app.route('/revisionduplicate', methods=['POST'])
@login_required
@resource_access()
def revisionduplicate_screenplay():
    resource_id = request.form['resource_id']
    version = int(request.form['version'])
    screenplay = Screenplay.duplicate(resource_id, version, current_user.name)
    url = '/editor?resource_id=' + screenplay.resource_id
    return Response(url, mimetype='text/plain')
