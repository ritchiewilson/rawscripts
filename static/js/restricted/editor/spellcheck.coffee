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
        if EOV != 'editor'
            return
        @LINES_PER_BATCH = 100
        @popupId = "spellcheckpopup"
        @popupElem = $("#" + @popupId)
        @popupElem.find(".close").click (event) => @closePopup(event)
        $("#sIgnore").click (event) => @ignore(event)
        $("#sIgnoreAll").click (event) => @ignoreAll(event)
        $("#sChange").click (event) => @change(event)
        $("#sSentance").on "input", (event) => @textChanged(event)

    launch: ->
        if EOV != 'editor'
            return
        setTypeToScript(false)
        @lines_with_errors = []
        @current_line_index = null
        @current_error_in_line = null
        @ignoreWords = []
        @popupElem.css "visibility", "visible"
        @disableInputs()
        @fetchSpellingData(0)
        @lastLineChanged = null

    closePopup: (event) ->
        @emptyInputs()
        if @lastLineChanged isnt null
            for line in @lines_with_errors[..@lastLineChanged]
                newText = (s.text for s in line.lineSegments).join('')
                lines[line.index].text = newText
            saveTimer()
        wrapAll()
        pagination()
        @popupElem.css "visibility", "hidden"
        setTypeToScript(true)

    disableInputs: ->
        @emptyInputs()
        @popupElem.find("input").prop("disabled", true)
        $("#spellcheck-title").css "display", "none"
        $("#spellcheck-waiting").css "display", "block"

    enableInputs: ->
        @popupElem.find("input").prop("disabled", false)
        $("#spellcheck-title").css "display", "block"
        $("#spellcheck-waiting").css "display", "none"

    fetchSpellingData: (startFrom) ->
        if startFrom >= lines.length
            if @current_line_index is null
                @renderCurrentError()
            return
        batch = lines[startFrom...(startFrom + @LINES_PER_BATCH)]
        lineIndex = startFrom
        for line in batch
            line.index = lineIndex
            lineIndex++
        data = {batch: JSON.stringify(batch), start_from: startFrom}
        $.post('/spellcheck', data, (a, b, c) => @parseSpellingResponse(a, b, c))

    parseSpellingResponse: (data, textStatus, jqXHR) ->
        for line in data.spellingData
            @lines_with_errors.push line
        startFrom = @LINES_PER_BATCH + parseInt(data.startFrom)
        if @current_line_index is null and @lines_with_errors.length > 0
            @nextError()
            @renderCurrentError()
        @fetchSpellingData startFrom

    getCurrentError: ->
        if @lines_with_errors == [] or @current_line_index is null
            return null
        segments = @lines_with_errors[@current_line_index].lineSegments
        return (s for s in segments when s.err)[@current_error_in_line]

    getCurrentLine: ->
        if @lines_with_errors == [] or @current_line_index is null
            return null
        return @lines_with_errors[@current_line_index]

    nextError: ->
        if @lines_with_errors == []
            @current_line_index = @current_error_in_line = null
            return # there is no 'next' if there are no errors
        if @current_line_index is null
            @current_line_index = 0
            @current_error_in_line = -1
        @current_error_in_line++
        segments = @lines_with_errors[@current_line_index].lineSegments
        num_errors = (s for s in segments when s.err).length
        if num_errors <= @current_error_in_line
            @current_error_in_line = 0
            @current_line_index++

        # check if this has gone past last error
        if @current_line_index >= @lines_with_errors.length
            @current_line_index = @current_error_in_line = null
            return

        if @getCurrentError().text in @ignoreWords
            @nextError()

    renderCurrentError: ->
        @manuallyChanged = false
        @emptyInputs()
        if @current_line_index is null
            @alertDoneChecking()
            return

        # render original text with bad word in red
        err_index = 0
        suggest = []
        currentError = @getCurrentError()
        currentLine = @getCurrentLine()
        preContext = postContext = acc = ""
        for segment in currentLine.lineSegments
            if segment is currentError
                preContext = acc
                acc = ""
                continue
            acc += segment.text
        postContext = acc
        addSpan = (text, id) =>
            span = $("<span>").text(@getStringInCorrectCase(text))
            span.attr("id", id)
            $("#sSentance").append(span)
            return span.text()
        transform = if @currentLineIsUpperCase() then "uppercase" else "none"
        $("#sSentance").css('text-transform', transform)

        @expectedPreContext = addSpan(preContext, "spellcheck-pre-context")
        @expectedErrorText = addSpan(currentError.text, "sFocus")
        @expectedPostContext = addSpan(postContext, "spellcheck-post-context")

        # render suggestions box
        for s in currentError.suggest
            displayText = @getStringInCorrectCase(s)
            item = $("<div>").addClass("spellcheckitem").text(displayText).data("text", s)
            $("#sSuggest").append(item)
        $(".spellcheckitem").click((event) => @selectSuggestion(event))
        @enableInputs()

    selectSuggestion: (event) ->
        $("#spellcheckfocus").removeAttr("id")
        elem = $(event.target)
        elem.attr("id", "spellcheckfocus")
        text = @getStringInCorrectCase(elem.data("text"))
        $("#sFocus").text(text)

    alertDoneChecking: ->
        @emptyInputs()
        alert "Done Spell Checking."
        @closePopup()

    currentLineIsUpperCase: ->
        currentLine = @lines_with_errors[@current_line_index]
        return lines[currentLine.index].format in [0, 2, 5]

    getStringInCorrectCase: (string)->
        toUpper = @currentLineIsUpperCase()
        return if toUpper then string.toUpperCase() else string

    emptyInputs: ->
        $("#sSentance").empty()
        $(".spellcheckitem").remove()

    ignore: (event) ->
        @nextError()
        @renderCurrentError()

    ignoreAll: (event) ->
        word = @getCurrentError().text
        if word not in @ignoreWords
            @ignoreWords.push(word)
        @ignore()

    change: (event) ->
        @lastLineChanged = @current_line_index
        if @manuallyChanged
            @useManualChange()
            return
        elem = $("#spellcheckfocus")
        if elem.length == 0
            return
        replaceWith = elem.data("text")
        error = @getCurrentError()
        error.old_text = error.text
        error.text = replaceWith
        @nextError()
        @renderCurrentError()

    useManualChange: ->
        lineWithError = @getCurrentLine()
        newText = $("#sSentance").text()
        line = lines[lineWithError.index]
        line.text = newText
        line.index = lineWithError.index
        @disableInputs()
        data = {batch: JSON.stringify([line]), startFrom: line.index}
        $.post('/spellcheck', data, (data, textStatus, jqXHR) =>
            if data.spellingData.length > 0
                newData = data.spellingData[0]
                lineWithError.lineSegments = newData.lineSegments
                @currentError = 0
            else
                @lines_with_errors.splice(@lines_with_errors.indexOf(lineWithError), 1)
                if @lines_with_errors.length <= @current_line_index
                    @current_line_index = null
            @renderCurrentError()
        )

    textChanged: (event) ->
        $("#sFocus").removeAttr("id")
        $(".spellcheckitem").off("click").addClass("disabled")
        $("#spellcheckfocus").removeAttr("id")
        @manuallyChanged = true

spell = new Spellcheck()

