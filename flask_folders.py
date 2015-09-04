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
    folder = Folder.query.filter_by(id=int(folder_id), owner=current_user).first()
    folder.name = folder_name
    db.session.commit()
    return Response('1', mimetype='text/plain')
