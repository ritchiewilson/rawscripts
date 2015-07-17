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

from flask import Flask, render_template, request
from flask_user import current_user, login_required

from rawscripts import db, app
from flask_models import Screenplay
from convert import Text, FinalDraft, Celtx

def _get_origin():
    netloc =  app.config['SERVER_NAME']
    protocol = 'http://' if netloc.startswith('localhost') else 'https://'
    return protocol + netloc

@app.route('/convert')
@login_required
def convert():
    origin = _get_origin()
    return render_template('convert.html', origin=origin)

@app.route('/convertprocess', methods=['POST'])
@login_required
def convert_process():
    fileformat = request.form['ff']
    filename = 'Untitled'
    if 'filename' in request.form:
        filename = request.form['filename']
        filename = filename.replace('%20', ' ').replace('C:\\fakepath\\', '')
    data = request.files['script']
    content = None
    if fileformat == 'celtx':
        content = Celtx(data)
    elif fileformat == 'fdx':
        content = FinalDraft(data)
    else:
        content = Text(data)
    screenplay = Screenplay.create(filename, current_user.name, content)
    origin = _get_origin()
    return render_template('UploadComplete.html', url=screenplay.resource_id,
                           origin=origin)
