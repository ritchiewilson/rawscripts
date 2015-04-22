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
    folder_name = request.form.get('folder_name', None)
    folder_id = request.form.get('folder_id', None)
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
    db.session.commit()
    return Response('1', mimetype='text/plain')
