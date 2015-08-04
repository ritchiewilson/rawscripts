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
from flask_models import User, Screenplay
from flask_admin import Admin, BaseView, expose, AdminIndexView
from flask_admin.contrib.sqla import ModelView


class StatsView(AdminIndexView):

    def is_accessible(self):
        return current_user.email == 'rawilson52@gmail.com'

    @expose('/')
    def index(self):
        query = User.query.with_entities(db.extract('year', User.firstUse),
                                         db.extract('month', User.firstUse),
                                         db.func.count()). \
                    group_by(db.extract('year', User.firstUse),
                             db.extract('month', User.firstUse)). \
                    order_by(db.extract('year', User.firstUse),
                             db.extract('month', User.firstUse))
        months = []
        users = 0
        for row in query.all():
            year, month, count = row
            months.append({'year': year, 'month': month, 'count':count})
            users += count
        scripts = Screenplay.count()
        return self.render('stats.html', months=months, users=users, scripts=scripts)


class MyUsersView(ModelView):
    can_create = False
    column_searchable_list= ('email',)
    form_excluded_columns = ('reset_password_token', 'password', 'appengine_user')

    def __init__(self, session, **kwargs):
        super(MyUsersView, self).__init__(User, session, **kwargs)

    def is_accessible(self):
        return current_user.email == 'rawilson52@gmail.com'


admin = Admin(app, index_view=StatsView())
admin.add_view(MyUsersView(db.session))
