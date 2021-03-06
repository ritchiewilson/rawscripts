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

from flask import request, make_response
from flask_user import login_required, current_user

from rawscripts import db, app
from flask_models import ScriptData, Screenplay
from flask_utils import resource_access


@app.route('/export', methods=['GET'])
@login_required
@resource_access(allow_collab=True)
def export_screenplay():
    user = current_user.name
    resource_id = request.args.get('resource_id')
    export_format = request.args.get('export_format')
    title_page = request.args.get('title_page', '0')
    if resource_id == 'Demo':
        return
    permission = Screenplay.get_users_permission(resource_id, user)
    if permission not in ['owner', 'collab']:
        return

    include_title_page = title_page == '1'
    export_file = Screenplay.export_to_file(resource_id, export_format, include_title_page)
    _file, title, content_type = export_file
    response = make_response(_file.getvalue())
    response.headers['Content-Type'] = content_type
    response.headers['Content-Disposition'] = \
        'attachment; filename="{}.{}"'.format(title, export_format)
    return response
