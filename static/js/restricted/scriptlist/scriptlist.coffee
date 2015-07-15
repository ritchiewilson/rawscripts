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
    .filter 'folder', ->
        (input, currentFolder) ->
            if not input or not currentFolder
                return input
            if currentFolder is "trash"
                return (s for s in input when s.is_trashed)
            out = (s for s in input when not s.is_trashed)
            if currentFolder is "owned"
                return out
            return (screenplay for screenplay in out when screenplay.folder is currentFolder)
    .controller 'ScriptlistController', ($scope, $http, folderFilter) ->
        scriptlist = @
        scriptlist.defaultFolders =
            owned: "My Scripts"
            shared: "Shared With Me"
            trash: "Trash"
        $scope.screenplays = []
        $scope.sharedWithMe = []
        $scope.currentFolder = "owned"
        $scope.folders = []
        $scope.refreshing = false

        $scope.getScreenplayByResourceId = (resource_id) ->
            for s in $scope.screenplays
                if s.resource_id == resource_id
                    return s
            return null

        $scope.setCurrentFolder = (id) ->
            $scope.currentFolder = id
        scriptlist.getFolderName = (id, folders) ->
            names = (folder[0] for folder in folders when folder[1] == id)
            return if not names then null else names[0]
        $scope.getCurrentFolderName = () ->
            if $scope.currentFolder of scriptlist.defaultFolders
                return scriptlist.defaultFolders[$scope.currentFolder]
            return scriptlist.getFolderName($scope.currentFolder, $scope.folders)
        scriptlist.sharePrompt = (id) ->
            sharePrompt(id)
        scriptlist.emailPrompt = (id) ->
            emailPrompt(id)
        scriptlist.haveToUndelete = ->
            alert "You have to Undelete this script to view it."

        $scope.getCheckedScreenplays = ->
            visible = folderFilter($scope.screenplays, $scope.currentFolder)
            return (s for s in visible when s.is_checked)

        # Use this for both move into and out of trash
        $scope.trashCheckedScreenplays = (should_delete) ->
            url = if should_delete then "/delete" else "/undelete"
            for s in $scope.getCheckedScreenplays()
                s.is_processing = true
                $http.post(url, {resource_id: s.resource_id})
                    .success (data) ->
                        s = $scope.getScreenplayByResourceId(data)
                        s.is_trashed = should_delete
                        s.is_checked = false
                        s.is_processing = false

        $scope.hardDelete = ->
            if not confirm("Are you sure you want to delete these scripts? This cannot be undone.")
                return false
            for s in $scope.getCheckedScreenplays()
                s.is_processing = true
                $http.post("/harddelete", {resource_id: s.resource_id})
                    .success (data) ->
                        $scope.screenplays = (s for s in $scope.screenplays when s.resource_id != data)
                
        $scope.selectAll = (state) ->
            for s in $scope.screenplays
                s.is_checked = false
            for s in folderFilter($scope.screenplays, $scope.currentFolder)
                s.is_checked = state

        $scope.allAreSelected = ->
            toCheck = folderFilter($scope.screenplays, $scope.currentFolder)
            return false if toCheck.length == 0
            for s in toCheck
                return false if not s.is_checked
            return true

        $scope.numberOfUnopenedSharedScreenplays = ->
            return (s for s in $scope.sharedWithMe when s.unopened).length

        $scope.hasOwnedScreenplays = ->
            return (s for s in $scope.screenplays when !s.is_trashed).length > 0

        $scope.hasTrashedScreenplays = ->
            return (s for s in $scope.screenplays when s.is_trashed).length > 0

        $scope.newFolder = ->
            folderName = prompt("New Folder Name")
            return false if !folderName?
            folderName = folderName.trim()
            return false if folderName == ""
            id = String(Math.round(Math.random()*10000000000))
            $http.post("/newfolder", {folder_name: folderName, folder_id: id})
                .success (data) ->
                    $scope.folders.push([folderName, id])

        $scope.moveToFolder = ->
            folderId = scriptlist.moveToFolderSelection
            return false if folderId == ""
            screenplays = $scope.getCheckedScreenplays()
            if screenplays.length == 0
                scriptlist.moveToFolderSelection = ""
                return false
            for s in screenplays
                s.is_processing = true
            resource_ids = (s.resource_id for s in screenplays).join()
            $http.post("/changefolder", {resource_id: resource_ids, folder_id: folderId})
                .success (data) ->
                    for s in screenplays
                        s.folder = folderId
                        s.is_processing = false
                    scriptlist.moveToFolderSelection = ""

        $scope.duplicateScreenplay = ->
            selected = $scope.getCheckedScreenplays()
            if selected.length == 0
                alert "You must first select which screenplay to duplicate."
                return
            if selected.length > 1
                alert "Please select one screenplay at a time to duplicate."
                return
            resource_id = selected[0].resource_id
            $http.post("/duplicate", {resource_id: resource_id})
                .success (data) ->
                    window.open(data)
                    $scope.refreshList()
            
        $scope.refreshList = ->
            $scope.refreshing = true
            $http.post("/list")
                .success (data) ->
                    $scope.screenplays = data[0]
                    $scope.sharedWithMe = data[1]
                    $scope.folders = data[2]
                    $scope.refreshing = false
        $scope.refreshList()
