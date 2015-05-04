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
    words = request.form.get('data', '')
    spellchecker = SpellChecker('en_US')
    spellchecker.set_text(words)
    output = []
    for err in spellchecker:
        incorrect_word = [err.word]
        suggestions = err.suggest()
        if not suggestions:
            suggestions = ['No Suggestions']
        incorrect_word.append(suggestions)
        output.append(incorrect_word)
    return Response(json.dumps(output), mimetype='text/plain')
