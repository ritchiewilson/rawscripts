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

angular
    .module('scriptlist', [],
        ($interpolateProvider) ->
            $interpolateProvider.startSymbol('{[')
            $interpolateProvider.endSymbol(']}')
    )
    .filter 'filterFolder', ->
        (input, currentFolder) ->
            if not input or not currentFolder
                return input
            if currentFolder is "trash"
                return (s for s in input when s.is_trashed)
            out = (s for s in input when not s.is_trashed)
            if currentFolder is "owned"
                return out
            return (screenplay for screenplay in out when screenplay.folder is currentFolder)
    .controller 'ScriptlistController', ($scope) ->
        scriptlist = @
        scriptlist.screenplays = []
        scriptlist.defaultFolders =
            owned: "My Scripts"
            shared: "Shared With Me"
            trash: "Trash"
        scriptlist.currentFolder = "owned"
        scriptlist.folders = []
        scriptlist.setCurrentFolder = (id) ->
            scriptlist.currentFolder = id
        scriptlist.getFolderName = (id, folders) ->
            names = (folder[0] for folder in folders when folder[1] == id)
            return if not names then null else names[0]
        scriptlist.getCurrentFolderName = (id, folders) ->
            if id of scriptlist.defaultFolders
                return scriptlist.defaultFolders[id]
            return scriptlist.getFolderName(id, folders)
        scriptlist.sharePrompt = (id) ->
            sharePrompt(id)
        scriptlist.emailPrompt = (id) ->
            emailPrompt(id)
        scriptlist.haveToUndelete = ->
            haveToUndelete()
