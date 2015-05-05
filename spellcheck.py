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
from enchant.checker import SpellChecker
from datetime import datetime

from flask import render_template, request, jsonify, redirect, url_for, Response
from flask_user import login_required, current_user

from rawscripts import app


@app.route('/spellcheck', methods=['POST'])
@login_required
def spellcheck():
    lines = request.form['batch']
    start_from = request.form.get('start_from', None)
    output = []
    line_index = start_from
    for line in json.loads(lines):
        line_segments = get_spelling_data_for_line(line['text'])
        if line_segments is None:
            continue # this line is correct
        data = {'index': line['index'], 'lineSegments': line_segments}
        output.append(data)
    return jsonify(spellingData=output, startFrom=start_from)

def get_spelling_data_for_line(text):
    line_segments = []
    spellchecker = SpellChecker('en_US')
    prev_index = 0
    spellchecker.set_text(text)
    for i, err in enumerate(spellchecker):
        good_words = {'err': False, 'text': text[prev_index:err.wordpos]}
        bad_word = {'err': True, 'text': err.word, 'suggest': err.suggest(), 'index': i}
        line_segments += [good_words, bad_word]
        prev_index = err.wordpos + len(err.word)
    if not line_segments:
        return None # Alls correct
    line_segments.append({'err': False, 'text': text[prev_index:]})
    return line_segments
