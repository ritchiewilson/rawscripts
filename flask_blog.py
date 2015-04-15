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

from flask import render_template, request, jsonify, redirect, url_for, Response
from werkzeug.contrib.atom import AtomFeed

from rawscripts import db, app
from flask_models import Blog


@app.route('/blog')
def blog():
    posts = Blog.query.order_by(Blog.timestamp.desc()).all()
    for post in posts:
        post.link = post.get_url()
        post.date = post.get_date_string()
    return render_template('flask_blog.html', mode="PRO", posts=posts)

@app.route('/blog/<path>')
def blog_single_post(path):
    path = path.lower()
    post = Blog.query.filter_by(path=path).first()
    if post is not None:
        post.link = post.get_url()
        post.date = post.get_date_string()
        post = [post]
    return render_template('flask_blog.html', mode="PRO", posts=post)

@app.route('/blogpostgui')
def blog_post_gui():
    return render_template('blogpostgui.html')

@app.route('/blogpost', methods=['POST'])
def new_blog_post():
    title = request.form['title']
    data = request.form['data']
    post = Blog(title=title, data=data)
    post.path = post.get_path_from_title()
    db.session.add(post)
    db.session.commit()
    return redirect(url_for('blog'))

@app.route('/rss')
def blog_feed():
    feed = AtomFeed('Recent Articles',
                    feed_url=request.url, url=request.url_root)
    posts = Blog.query.order_by(Blog.timestamp.desc()).all()
    for post in posts:
        feed.add(post.title, unicode(post.data),
                 content_type='html',
                 url=post.get_url(),
                 updated=post.timestamp)
    return Response(feed.to_string(), mimetype='text/xml')
