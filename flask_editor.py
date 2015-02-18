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

from flask import render_template, request, jsonify, redirect, url_for

from rawscripts import db, app
from flask_models import UsersScripts, ScriptData
import config


@app.route('/editor')
def editor():
    user = 'rawilson52@gmail.com'
    resource_id = request.args.get('resource_id')
    permission = UsersScripts.get_users_permission(resource_id, user)
    if permission is None:
        return redirect(url_for('welcome'))
    EOV = 'editor' if permission == 'owner' else 'viewer'
    return render_template('editor.html', user=user, mode=config.MODE,
                           resource_id=resource_id, EOV=EOV)

@app.route('/scriptcontent', methods=['POST'])
def scriptcontent():
    user = 'rawilson52@gmail.com'
    resource_id = request.form['resource_id']
    if resource_id == 'Demo':
        return jsonify(title='Duck Soup', lines=[['Fade In.', 1]], spelling=[],
                       notes=[], sharedwith=[], contacts=[], autosave='true')

    screenplay = UsersScripts.query.filter_by(resource_id=resource_id,
                                              user=user).first()
    if not screenplay:
        return 'not found'

    latest_version = ScriptData.get_latest_version(resource_id)
    sharedwith = UsersScripts.get_all_collaborators(resource_id)

    return jsonify(title=screenplay.title,
                   lines=json.loads(latest_version.data),
                   spelling=[],
                   notes=[],
                   sharedwith=sharedwith,
                   contacts=[],
                   autosave='true')
