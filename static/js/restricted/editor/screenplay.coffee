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

class Screenplay
    constructor: (resource_id) ->
        @resource_id = resource_id
        @saveInFlight = false

    getLastSavedVersionNumber: ->
        if not @lastSavedVersionNumber?
            @lastSavedVersionNumber = window["lastSavedVersionNumber"]
        return @lastSavedVersionNumber

    save: (autosave) ->
        if EOV != 'editor' or @saveInFlight
            return
        linesToSend = ([line.text, line.format] for line in lines)
        data = {
            data: JSON.stringify(linesToSend),
            autosave: autosave,
            resource_id: resource_id,
            expected_version_number: @getLastSavedVersionNumber() + 1
        }
        @saveInFlight = true
        @setSaveUI("Saving...", disabled = true)
        $.post("/save", data,  (a, b, c) => @saveResponseHandler(a, b, c))
            .fail( => @saveResponseHandler(data = {success: false}))

    setSaveUI: (text, disabled, errorDisplay = false) ->
        $("#saveButton").val(text).prop("disabled", disabled)
        $("#saveError").css("display", if errorDisplay then "table" else "none")

    saveResponseHandler: (data, textStatus, jqXHR) ->
        @saveInFlight = false
        if data.success
            @setSaveUI("Saved", disabled = true)
            @lastSavedVersionNumber = data.versionSaved
        else
            @setSaveUI("Save", disabled = false, errorDisplay = true)


screenplay = new Screenplay(resource_id)
