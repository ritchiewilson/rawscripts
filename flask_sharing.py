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
from flask_models import UsersScripts, ScriptData, Screenplay, Note, UnreadNote
from flask_utils import get_current_user_email_with_default


@app.route('/share', methods=['POST'])
@login_required
def share_screenplay():
    resource_id = request.form['resource_id']
    collaborators = request.form['collaborators'].split(',')
    new_collaborators = Screenplay.add_access(resource_id, collaborators)

    if new_collaborators and request.form.get('sendEmail', '') == 'y':
        user = current_user.email
        subject = 'Rawscripts.com: ' + user + " has shared a screenplay with you."
        title = Screenplay.get_title(resource_id)

        # build email body and html
        script_url = app.config['SERVER_NAME'] + "/editor?resource_id=" + resource_id
        body = script_url + "\n\n\n    	"
        body += "--- This screenplay written and sent from RawScripts.com."
        divArea = ''
        if request.form.get('addMsg', '') == 'y':
            divArea = "<div style='width:300px; margin-left:20px; font-size:12pt; font-family:serif'>"
            divArea += request.form.get('msg', '')
            divArea += "<br><b>--" + user + "</b></div>"

        replacements = {
            'SCRIPTTITLE': title, 'USER': user,
            'SCRIPTURL': script_url, 'TEXTAREA': divArea}
        with app.open_resource('static/text/notify.txt') as f:
            html_template = f.read()
        for key, val in replacements.items():
            html_template.replace(key, val)

        # TODO: send the danged email
    output = ",".join(new_collaborators)
    return Response(output, mimetype='text/plain')
