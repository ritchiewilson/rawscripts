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

from flask import render_template, request, jsonify, redirect, url_for

from rawscripts import db, app
from flask_models import Blog


@app.route('/blog')
def full_blog():
    posts = Blog.query.order_by(Blog.timestamp.desc()).all()
    for post in posts:
        post.link = post.get_url()
        post.date = post.get_date_string()
    return render_template('blog.html', mode="PRO", posts=posts)

@app.route('/blog/<path>')
def blog_single_post(path):
    path = path.lower()
    post = Blog.query.filter_by(path=path).first()
    if post is not None:
        post.link = post.get_url()
        post.date = post.get_date_string()
        post = [post]
    return render_template('blog.html', mode="PRO", posts=post)
