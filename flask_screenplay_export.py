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
    title = unicodedata.normalize("NFKD", screenplay.title). \
                encode("ascii", "ignore")
    output = None
    content_type = None
    if export_format == 'txt':
        output = generate_txt_file(latest_version.data, title)
        content_type = 'text/plain'
    elif export_format == 'pdf':
        output = generate_pdf_file(latest_version.data, title)
        content_type = 'application/pdf'
    if output is None:
        return
    response = make_response(output.getvalue())
    response.headers['Content-Type'] = content_type
    response.headers['Content-Disposition'] = \
        'attachment; filename={}.{}'.format(title, export_format)
    return response

def generate_txt_file(data, title):
    # Max char length, margin, blank spaces after
    widths = [
        [62, 15, 1], # Slugline
        [62, 15, 1], # Action
        [40, 35, 0], # Character
        [35, 25, 1], # Dialog
        [35, 30, 0], # Paren
        [62, 61, 1]  # Transition
    ]

    txt = json.loads(data)
    s = StringIO.StringIO()

    # TODO: build title page

    s.write('\n\n\n')
    parenTest = False
    for i in txt:
        text, line_format = i[0], int(i[1])
        # lingering parentheses problem
        if parenTest == True and line_format != 4:
            s.write('\n')
        parenTest = False

        words = i[0].split(' ')
        spaces = widths[line_format][1]
        if line_format == 5:
            diff = 0
            for j in words:
                diff += len(j) + 1
            spaces = 77 - diff
        s.write(' ' * spaces)

        linewidth = 0

        for j in words:
            if linewidth + len(j) > widths[line_format][0]:
                linewidth=0
                s.write('\n')
                s.write(' ' * spaces)
            if line_format in [0, 2, 5]:
                s.write(j.upper())
            else:
                s.write(j)
            s.write(' ')
            linewidth += len(j) + 1
        s.write('\n')
        #save paren for next time around to be sure
        if line_format == 3:
            parenTest = True
        elif widths[line_format][2]==1:
            s.write('\n')
    return s
