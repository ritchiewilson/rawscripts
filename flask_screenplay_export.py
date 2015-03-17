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
import unicodedata
import StringIO

from flask import request, make_response

from rawscripts import db, app
from flask_models import UsersScripts, ScriptData
from export import Text, Pdf


@app.route('/export', methods=['GET'])
def export_screenplay():
    user = 'rawilson52@gmail.com'
    resource_id = request.args.get('resource_id')
    export_format = request.args.get('export_format')
    title_page = request.args.get('title_page')
    if resource_id == 'Demo':
        return
    permission = UsersScripts.get_users_permission(resource_id, user)
    if permission not in ['owner', 'collab']:
        return
    screenplay = UsersScripts.query.filter_by(resource_id=resource_id,
                                              user=user).first()
    latest_version = ScriptData.get_latest_version(resource_id)
    if not latest_version:
        return
    output = None
    content_type = None
    data = json.loads(latest_version.data)
    if export_format == 'txt':
        output = Text(data, None)
        content_type = 'text/plain'
    elif export_format == 'pdf':
        output = Pdf(data, None)
        content_type = 'application/pdf'
    if output is None:
        return
    ascii_title = unicodedata.normalize("NFKD", screenplay.title). \
                      encode("ascii", "ignore")
    response = make_response(output.getvalue())
    response.headers['Content-Type'] = content_type
    response.headers['Content-Disposition'] = \
        'attachment; filename={}.{}'.format(ascii_title, export_format)
    return response
