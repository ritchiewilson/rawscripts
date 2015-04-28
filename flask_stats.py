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


from flask import render_template, abort
from flask_user import login_required, current_user

from rawscripts import db, app
from flask_models import User, UsersScripts


@app.route('/stats')
@login_required
def stats():
    if current_user.email != 'rawilson52@gmail.com':
        abort(401)
        return
    # TODO: counting users per month can be done in one query, but keeps
    # screwing up in development db.
    users = User.query.with_entities(User.firstUse).all()
    time_periods = {}
    for user in users:
        t = user.firstUse.strftime('%Y-%m')
        if t not in time_periods:
            time_periods[t] = 0
        time_periods[t] += 1

    months = []
    for key, val in time_periods.items():
        month, year = t.split('-')
        months.append({'month': month, 'year': year, 'count': val})
    scripts = db.session.query(db.func.count(db.distinct(UsersScripts.resource_id))).first()[0]
    return render_template('stats.html', months=months, users=len(users), scripts=scripts)
