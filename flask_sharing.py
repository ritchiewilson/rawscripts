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


from flask import request, Response, url_for, jsonify
from flask_mail import Message
from flask_user import login_required, current_user

from rawscripts import db, app, mail
from flask_models import Screenplay
from flask_utils import resource_access, get_resource_id_from_request


@app.route('/share', methods=['POST'])
@login_required
@resource_access()
def share_screenplay():
    resource_id = get_resource_id_from_request()
    collaborators_raw = request.form.get('collaborators', None)
    if collaborators_raw is None:
        collaborators_raw = request.json.get('collaborators', None)
    collaborators = collaborators_raw.split(',')
    new_collaborators = Screenplay.add_access(resource_id, collaborators)

    if new_collaborators and request.json.get('sendEmail', '') == 'y':
        user = current_user.email
        subject = 'Rawscripts.com: ' + user + " has shared a screenplay with you."
        title = Screenplay.get_title(resource_id)

        # build email body and html
        script_url = url_for('editor', _external=True, resource_id=resource_id)
        body = script_url + "\n\n\n    	"
        body += "--- This screenplay written and sent from RawScripts.com."
        divArea = ''

        replacements = {
            'SCRIPTTITLE': title, 'USER': user,
            'SCRIPTURL': script_url, 'TEXTAREA': divArea}
        with app.open_resource('static/text/notify.txt') as f:
            html = f.read()
        for key, val in replacements.items():
            html = html.replace(key, val)

        msg = Message(subject, recipients=new_collaborators, body=body, html=html)
        mail.send(msg)

        # TODO: send the danged email
    output = ",".join(new_collaborators)
    return Response(output, mimetype='text/plain')

@app.route('/removeaccess', methods=['POST'])
@login_required
@resource_access(allow_collab=True)
def remove_access_to_screenplay():
    resource_id = request.json['resource_id']
    collaborator = request.json['removePerson'].lower()
    screenplay = Screenplay.get_by_resource_id(resource_id)
    if not current_user.owns_screenplay(screenplay):
        if not current_user.is_collaborator_on_screenplay(screenplay):
            return Response(collaborator, mimetype='text/plain')
        collaborator = current_user.email.lower()
    Screenplay.remove_access(resource_id, collaborator)
    return jsonify(collaborator=collaborator, resource_id=resource_id)
