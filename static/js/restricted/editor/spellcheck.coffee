###
Rawscripts - Screenwriting Software
Copyright (C) Ritchie Wilson

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
###

class Spellcheck
    constructor: ->
        @LINES_PER_BATCH = 500
        @lines_with_errors = []
        @current_line_index = null
        @current_error_in_line = null
        @popupId = "spellcheckpopup"
        @popupElem = $("#" + @popupId)
        @popupElem.find(".close").click (event) => @closePopup(event)
        $("#sIgnore").click (event) => @ignore(event)
        $("#sIgnoreAll").click (event) => @ignoreAll(event)
        $("#sChange").click (event) => @change(event)

    launch: ->
        @lines_with_errors = []
        @popupElem.css "visibility", "visible"
        @fetchSpellingData(0)

    closePopup: (event) ->
        @popupElem.css "visibility", "hidden"

    fetchSpellingData: (startFrom) ->
        if startFrom >= lines.length
            return
        batch = lines[startFrom..(startFrom + @LINES_PER_BATCH)]
        lineIndex = startFrom
        for line in batch
            line.index = lineIndex
            lineIndex++
        data = {batch: JSON.stringify(batch), start_from: startFrom}
        startFrom += @LINES_PER_BATCH
        $.post('/spellcheck', data, (a, b, c) => @parseSpellingResponse(a, b, c))

    parseSpellingResponse: (data, textStatus, jqXHR) ->
        for line in data.spellingData
            @lines_with_errors.push line
        startFrom = data.startFrom + @LINES_PER_BATCH
        @fetchSpellingData startFrom
        if @current_line_index is null
            @nextError()
            @renderCurrentError()

    nextError: ->
        if @current_line_index is null
            @current_line_index = @current_error_in_line = 0
            return

    renderCurrentError: ->
        # render original text with bad word in red
        err_index = 0
        suggest = []
        for segment in @lines_with_errors[@current_line_index].lineSegments
            span = $("<span>").text(segment.text)
            if segment.err
                if err_index == @current_error_in_line
                    span.attr("id", "sFocus").css("color", "red")
                    suggest = segment.suggest
                err_index++
            $("#sSentance").append(span)

        # render suggestions box
        $(".spellcheckitem").remove()
        for s in suggest
            item = $("<div>").addClass("spellcheckitem").text(s).data("text", s)
            $("#sSuggest").append(item)
        $(".spellcheckitem").click((event) => @selectSuggestion(event))

    selectSuggestion: (event) ->
        $("#spellcheckfocus").removeAttr("id")
        elem = $(event.target)
        elem.attr("id", "spellcheckfocus")
        $("#sFocus").text(elem.data("text"))

    ignore: (event) ->
        console.log(event)

    ignoreAll: (event) ->
        console.log(event)

    change: (event) ->
        console.log(event)


spell = new Spellcheck()

