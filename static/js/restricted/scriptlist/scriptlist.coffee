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
    .controller 'ScriptlistController', ($scope) ->
        scriptlist = @
        scriptlist.defaultFolders =
            owned: "My Scripts"
            shared: "Shared With Me"
            trash: "Trash"
        scriptlist.currentFolder = "owned"
        scriptlist.folders = []
        scriptlist.setCurrentFolder = (id) ->
            scriptlist.currentFolder = id
            tabs(id)
