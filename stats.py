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


import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
from google.appengine.dist import use_library
use_library('django', '1.2')
import wsgiref.handlers
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
import logging
from django.utils import simplejson
import os
import models
import datetime

from utils import get_template_path

class StatsCache(webapp.RequestHandler):
    def get(self):
        for year in [2014, 2015]:
            for month in range(1,13):
                self.count_month(year, month)

        q = db.GqlQuery("SELECT __key__ FROM Users")
        c = q.count(100000)

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(c)

    def count_month(self, year, month):
        end_year = datetime.datetime.now().year
        end_month = datetime.datetime.now().month
        if year >= end_year and month > end_month:
            return

        q = db.GqlQuery("SELECT * from NewUserCounting "+
                        "WHERE month=" + str(month) +
                        " AND year=" + str(year))
        cache = q.get()
        month_2 = month + 1 if month < 12 else 1
        year_2 = year + 1 if month_2 == 1 else year

        q = db.GqlQuery("SELECT __key__ from Users "+
                        "WHERE firstUse >= DATETIME("+str(year)+","+str(month)+",1,0,0,0) "+
                        "AND firstUse < DATETIME("+str(year_2)+","+str(month_2)+",1,0,0,0) ")
        c = q.count(10000)
        if not cache:
            cache = models.NewUserCounting(month=month, year=year, count=c)
        else:
            cache.count = c
        cache.put()


class Stats(webapp.RequestHandler):
    def get(self):

        # Get User
        q=db.GqlQuery("SELECT * FROM NewUserCounting")
        months=q.fetch(10000)
        template_values= { 'months': months}

        total = 0
        for month in months:
            total += month.count
        template_values['users']=total

        # count scripts
        q=db.GqlQuery("SELECT * FROM UsersScripts WHERE permission='owner'")
        #s=q.fetch(10000)
        template_values['scripts']=q.count(100000)

        path = get_template_path('html/stats.html')
        self.response.headers['Content-Type'] = 'text/html'
        self.response.out.write(template.render(path, template_values))


class StatsEmail(webapp.RequestHandler):
    def get(self):
        query = db.GqlQuery("SELECT name FROM Users")
        names = query.fetch(None)
        domains = {}
        for name in names:
            if "@" not in name.name:
                continue
            domain = name.name.split("@", 1)[-1]
            if not domain in domains:
                domains[domain] = 0
            domains[domain] += 1
        output = "\n".join([d + ", " + str(c) for d, c in domains.items()])
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(output)


def main():
    application = webapp.WSGIApplication([('/stats', Stats),
                                          ('/statscache', StatsCache),
                                          ('/statsemail', StatsEmail),
                                            ],
                                         debug=True)

    run_wsgi_app(application)


if __name__ == '__main__':
    main()
