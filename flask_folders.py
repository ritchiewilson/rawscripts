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

from flask import request, url_for, Response
from flask_user import login_required, current_user

from rawscripts import db, app
from flask_models import Screenplay, Folder


@app.route('/newfolder', methods=['POST'])
@login_required
def new_folder():
    folder_name = request.json.get('folder_name', None)
    folder_id = request.json.get('folder_id', None)
    if folder_name is None or folder_id is None:
        return Response('0', mimetype='text/plain')
    user = current_user.email
    folder = Folder.get_by_user(user)
    if folder is None:
        folder = Folder(user=user, data='[]')
        db.session.add(folder)
    J = json.loads(folder.data)
    J.append([folder_name, folder_id])
    folder.data = json.dumps(J)
    folder = Folder(id=int(folder_id), owner=current_user, name=folder_name)
    db.session.add(folder)
    db.session.commit()
    return Response('1', mimetype='text/plain')

@app.route('/changefolder', methods=['POST'])
@login_required
def change_folder():
    resource_ids = request.json.get('resource_id', None)
    folder_id = request.json.get('folder_id', None)
    if resource_ids is None or folder_id is None:
        return Response('0', mimetype='text/plain')
    user = current_user.email
    for resource_id in resource_ids.split(','):
        if Screenplay.get_users_permission(resource_id, user) != 'owner':
            continue
        Screenplay.set_folder(resource_id, folder_id)
    return Response('1', mimetype='text/plain')

@app.route('/deletefolder', methods=['POST'])
@login_required
def delete_folder():
    folder_id = request.json.get('folder_id', None)
    if folder_id is None:
        return Response('0', mimetype='text/plain')
    user = current_user.email
    Screenplay.remove_all_from_folder(folder_id, user)
    row = Folder.get_by_user(user)
    folders = json.loads(row.data)
    arr = [f for f in folders if f[1] != folder_id]
    row.data = json.dumps(arr)
    folder = Folder.query.filter_by(id=int(folder_id), owner=current_user).first()
    if folder:
        db.session.delete(folder)
    db.session.commit()
    return Response('1', mimetype='text/plain')

@app.route('/renamefolder', methods=['POST'])
@login_required
def rename_folder():
    folder_name = request.json.get('folder_name', None)
    folder_id = request.json.get('folder_id', None)
    if folder_name is None or folder_id is None:
        return Response('0', mimetype='text/plain')
    user = current_user.email
    row = Folder.get_by_user(user)
    folders = json.loads(row.data)
    for folder in folders:
        if folder[1] == folder_id:
            folder[0] = folder_name
    row.data = json.dumps(folders)
    folder = Folder.query.filter_by(id=int(folder_id), owner=current_user).first()
    folder.name = folder_name
    db.session.commit()
    return Response('1', mimetype='text/plain')
