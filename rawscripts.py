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
import os
import sys

app_settings = os.environ['APP_SETTINGS']
init_script = sys.argv[0]
if init_script == 'runserver.py':
    if app_settings == 'flask_config.MigrationConfig':
        raise Exception("Wait, make sure you're using the right environment")
if init_script in ['manage.py', 'fetch_script.py']:
    if app_settings[13:-6] not in ['Migration', 'Staging']:
        raise Exception("Wait, make sure you're using the right environment")

from flask import Flask, render_template, send_from_directory
from flask.ext.sqlalchemy import SQLAlchemy
from flask_mail import Mail

app = Flask(__name__, template_folder='html')
app.config.from_object(os.environ['APP_SETTINGS'])
db = SQLAlchemy(app)
mail = Mail(app)

from flask_models import *
# db.create_all()

import flask_editor
import flask_scriptlist
import flask_screenplay_export
import flask_blog
import flask_revision_history
import flask_screenplay

@app.route('/')
def welcome():
    return render_template('welcome.html')

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
