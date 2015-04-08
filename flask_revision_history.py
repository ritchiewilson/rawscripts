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

from flask import render_template, request, jsonify

from rawscripts import db, app
from flask_models import ScriptData, UsersScripts


@app.route('/revisionhistory')
def revision_history():
    user = 'rawilson52@gmail.com'
    resource_id = request.args.get('resource_id')
    version = request.args.get('version')
    revisions = ScriptData.get_historical_metadata(resource_id, version)
    data = []
    for revision in revisions:
        d = {'updated': revision.timestamp.strftime("%b %d")}
        d['version'] = revision.version
        d['autosave_class'] = 'autosave' if revision.autosave else 'manualsave'
        d['emailed'] = ""
        d['tagged'] = ''
        exports = []
        for tag in revision.tags:
            if tag._type == 'email':
                d['emailed'] = 'Emailed'
                exports.append([tag.value, str(tag.timestamp)])
            if tag._type == 'tag':
                d['tagged'] = 'Tag'
                d['tag'] = tag.value
        d['export'] = json.dumps([exports, []])
        data.append(d)

    title = UsersScripts.get_title(resource_id)
    return render_template('revisionhistory.html', user=user, mode="PRO",
                           resource_id=resource_id, r=data, title=title)
