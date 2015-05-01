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


from flask import render_template, request, redirect, url_for, Response
from flask_user import login_required, current_user

from rawscripts import db, app
from flask_models import UsersScripts, TitlePageData
from flask_utils import get_current_user_email_with_default


@app.route('/titlepage')
def titlepage():
    resource_id = request.args.get('resource_id')
    if not current_user.is_authenticated() and resource_id != 'Demo':
        return redirect(url_for('welcome'))

    user_email = get_current_user_email_with_default()

    permission = UsersScripts.get_users_permission(resource_id, user_email)
    if permission != 'owner' and resource_id != 'Demo':
        return redirect(url_for('scriptlist'))

    fields = TitlePageData.get_fields_by_resource_id(resource_id)
    sign_out = '/user/sign-out'
    return render_template('titlepage.html', user=user_email, sign_out=sign_out, **fields)

@app.route('/titlepagesave', methods=['POST'])
@login_required
def titlepage_save():
    user_email = get_current_user_email_with_default()
    resource_id = request.form['resource_id']
    permission = UsersScripts.get_users_permission(resource_id, user_email)
    if permission != 'owner':
        return redirect(url_for('scriptlist'))

    obj = TitlePageData.get_or_create(resource_id)
    fields = [ 'title', 'written_by', 'contact' ]
    for field in fields:
        if field in request.form:
            setattr(obj, field, request.form[field])
    obj.migrated = True
    db.session.commit()
    return Response('1', mimetype='text/plain')
