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

from flask import render_template

from rawscripts import db, app
import config


@app.route('/editor')
def editor():
    return render_template('editor.html', user="demo", mode=config.MODE)

@app.route('/scriptcontent', methods=['POST'])
def scriptcontent():
    sample = {'title': 'Duck Soup',
              'lines': [['Fade In.', 1]],
              'spelling': [],
              'sharedwith': [],
              'contacts': [],
              'autosave': 'true'}
    return json.dumps(sample)
