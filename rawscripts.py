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
from urlparse import urlparse

from flask import Flask, render_template, send_from_directory, request, redirect, url_for, Response
from flask.ext.sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_user import UserManager, SQLAlchemyAdapter, current_user
from flask_utils import length_password_validator

app = Flask(__name__, template_folder='html')
app.config.from_object(os.environ['APP_SETTINGS'])
db = SQLAlchemy(app)
mail = Mail(app)

from flask_models import User
db_adapter = SQLAlchemyAdapter(db, User)
user_manager = UserManager(db_adapter, app,
                           password_validator=length_password_validator)

# add my templates to flask-user so it can find my base.html
my_templates = app.jinja_loader.searchpath[0]
app.blueprints['flask_user'].jinja_loader.searchpath.insert(0, my_templates)

import flask_editor
import flask_scriptlist
import flask_screenplay_export
import flask_blog
import flask_revision_history
import flask_screenplay
import flask_convert
import flask_notes
import flask_titlepage
import flask_sharing

@app.context_processor
def inject_config():
    return dict(MODE='PRO', GA='UA-16492540-1')

@app.route('/')
def welcome():
    if current_user.is_authenticated():
        if not request.referrer:
            return redirect(url_for('scriptlist'))
        url = urlparse(request.referrer)
        paths = ['/blog', '/contact', '/about', '/scriptlist']
        if url.netloc == app.config['SERVER_NAME'] and url.path not in paths:
            return redirect(url_for('scriptlist'))
    form = user_manager.login_form(next='/scriptlist')
    return render_template('flask_welcome.html', form=form, login_form=form)

@app.route('/contact')
def contact():
    return render_template('flask_contact.html')

@app.route('/synccontacts', methods=['POST'])
def synccontacts():
    return Response('[]', mimetype='text/plain')

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

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static/images'), 'favicon.ico')
