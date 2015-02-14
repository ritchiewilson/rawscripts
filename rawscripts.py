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

from flask import Flask, render_template, send_from_directory
from flask.ext.sqlalchemy import SQLAlchemy
import json
import config

app = Flask(__name__, template_folder='html')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///rawscripts.db'
db = SQLAlchemy(app)

from flask_models import *
db.create_all()

import flask_editor

@app.route('/')
def welcome():
    return render_template('welcome.html')

@app.route('/scriptlist')
def scriptlist():
    return render_template('scriptlist.html', user="rawilson52@gmail.com")

@app.route('/list', methods=['POST'])
def list():
    user = 'rawilson52@gmail.com'
    screenplays = UsersScripts.query.filter_by(user=user). \
                      order_by(UsersScripts.last_updated.desc()).all()
    owned = []
    shared = []
    ownedDeleted = []
    folders = []
    for screenplay in screenplays:
        data = [screenplay.resource_id, screenplay.title, "seconds ago"]
        permission = screenplay.permission
        if permission == 'collab':
            permission = 'shared'
        data.append(permission)
        if screenplay.permission != 'collab':
            sharing_with = []
            data.append(sharing_with)
        new_notes = 0
        if permission != 'ownerDeleted':
            data.append(new_notes)

        data.append(screenplay.folder)

        if screenplay.permission == 'collab':
            # unopened
            data.append("False")

        if screenplay.permission == 'owner':
            owned.append(data)
        elif screenplay.permission == 'collab':
            shared.append(data)
        elif screenplay.permission == 'ownedDeleted':
            ownedDeleted.append(data)

    folders = [["Junk", "210283631"], ["Things to Shoot", "202865768"],
               ["Founding Fathers", "6128964918"],
               ["Fairy Tale", "1658192938"], ["Shot", "3891614880"]]
    output = [owned, ownedDeleted, shared, folders]
    return json.dumps(output)

@app.route('/synccontacts', methods=['POST'])
def synccontacts():
    return json.dumps([])

@app.route('/css/<css_file>')
def css_redirect(css_file):
    return send_from_directory('static/css', css_file)

@app.route('/css/min/<css_file>')
def css_min_redirect(css_file):
    return send_from_directory('static/css/min', css_file)

@app.route('/images/<img_file>')
def images_redirect(img_file):
    return send_from_directory('static/images', img_file)

@app.route('/js/min/<js_file>')
def js_redirect(js_file):
    return send_from_directory('static/js/min', js_file)


def apply_ops(string, ops):
    for op in ops:
        tag = ["insert", "delete", "replace"][op.action]
        if tag == "delete":
            string = string[:op.offset] + string[op.offset + op.amount:]
        if tag == "insert":
            string = string[:op.offset] + op.text + string[op.offset:]
        if tag == "replace":
            string = string[:op.offset] + op.text + string[op.offset + op.amount:]
    return string

@app.route('/test_rebuilding')
def test_rebuilding():
    return "Done"
    checks = MigrationCheck.query.all()
    done = 0
    for check in checks:
        resource_id = check.resource_id
        last = ScriptData.query.filter_by(resource_id=resource_id). \
                   order_by(ScriptData.version.desc()).first()
        check.verified_to = last.version
        done += 1
        if done % 1000 == 0:
            print "did", done
    db.session.commit()
    return "Done"
