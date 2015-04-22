/**
 * Rawscripts - Screenwriting Software
 * Copyright (C) Ritchie Wilson
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */



/* Closure Compiler for JS changes all function
 * names. To have human readable function names
 * in the html, need to attach those functions
 * to the window object; as done here.
 */
window['removeAccess'] = removeAccess;
window['haveToUndelete'] = haveToUndelete;
window['sharePrompt'] = sharePrompt;
window['init'] = init;
window['hideEmailPrompt'] = hideEmailPrompt;
window['emailScript'] = emailScript;
window['hideRenamePrompt'] = hideRenamePrompt;
window['renameScript'] = renameScript;
window['hideUploadPrompt'] = hideUploadPrompt;
window['hideNewScriptPrompt'] = hideNewScriptPrompt;
window['createScript'] = createScript;
window['hideExportPrompt'] = hideExportPrompt;
window['exportScripts'] = exportScripts;
window['hideSharePrompt'] = hideSharePrompt;
window['shareScript'] = shareScript;
window['newScriptPrompt'] = newScriptPrompt;
window['uploadPrompt'] = uploadPrompt;
window['renamePrompt'] = renamePrompt;
window['duplicate'] = duplicate;
window['exportPrompt'] = exportPrompt;
window['batchProcess'] = batchProcess;
window['moveToFolder'] = moveToFolder;
window['exportPrompt'] = exportPrompt;
window['batchProcess'] = batchProcess;
window['refreshList'] = refreshList;
window['newFolder'] = newFolder;
window['selectAll'] = selectAll;
window['script'] = script;
window['emailPrompt'] = emailPrompt;
window['emailNotifyShare'] = emailNotifyShare;
window['emailNotifyMsg'] = emailNotifyMsg;
window['hardDelete'] = hardDelete;




function init(){
	// grab scripts, and create lists
	refreshList();
	// prevent some defaults on forms in prompt
	goog.events.listen(goog.dom.getElement('renameField'), goog.events.EventType.KEYDOWN,
		function(e){
			if(e.keyCode==13){
				e.preventDefault();
				renameScript()
			}
		}
	);
	goog.events.listen(goog.dom.getElement('subject'), goog.events.EventType.KEYDOWN,
		function(e){
			if(e.keyCode==13){
				e.preventDefault();
			}
		}
	);
	goog.events.listen(goog.dom.getElement('newScript'), goog.events.EventType.KEYDOWN,
		function(e){
			if(e.keyCode==13){
				e.preventDefault();
				createScript();
			}
		}
	);
	// Some setup for contextual menus on the
	// user defined folders
	goog.events.listen(window, goog.events.EventType.CLICK, removeContextMenu)
	goog.events.listen(window, goog.events.EventType.CONTEXTMENU, contextmenu)
	// Put some listens on folder tabs
	var arr = ['ownedFolder', 'sharedFolder', 'trashFolder'];
	for (i in arr){
		var f = goog.dom.getElement(arr[i]);
		goog.events.listen(f, goog.events.EventType.CLICK, function(e){
			goog.dom.getElementByClass('current').style.backgroundColor='white';
			goog.dom.getElementByClass('current').className='tab';
			e.target.className='tab current';
			tabs(e.target.id)
			e.target.style.backgroundColor = '#2352AE';
		});
		goog.events.listen(f, goog.events.EventType.MOUSEOVER, function(e){
			if(e.target.className!='tab current'){
				e.target.style.backgroundColor = '#ccf'
			}
			else{
				e.target.style.backgroundColor = '#2352AE'
			}
		});
		goog.events.listen(f, goog.events.EventType.MOUSEOUT, function(e){
			if(e.target.className!='tab current'){
				e.target.style.backgroundColor = '#fff'
			}
		});
	}
	// get contacts from server and put in autocomplete
	try{
		goog.net.XhrIo.send('/synccontacts',
			function(e){
				if(e.target.getResponseText()=='none')return;
				try{
					var arr = e.target.getResponseJson();
					var emailAutoComplete = new goog.ui.AutoComplete.Basic(arr, goog.dom.getElement('recipient'), true);
					var shareAutoComplete = new goog.ui.AutoComplete.Basic(arr, goog.dom.getElement('collaborator'), true);
				}
				catch(e){};
			},
			'POST'
		);
	}
	catch(e){};

}

/**
 * Calls the server for all screenplay information
 * including names, last modified, folders,
 * permissions, unread notes, unread shared scripts,
 * etc. Server responds with JSON, function cleans
 * out old data, then puts new data in it's place
 * @param {string} v Script ID for if share prompt
 * is opened
 */
function refreshList(v){
	goog.dom.getElement("refresh_icon").style.visibility="visible";
	goog.net.XhrIo.send('/list',
		function(d){
		    //update with new info
			var j = d.target.getResponseJson();
		    var x=j[0];
		    var z=j[1];
		    var ss=j[2];
			var folders=j[3];
			// know which tab is current, to be rest
			//set up folders
			var current = goog.dom.getElementByClass('current').id;
			var fc = goog.dom.getElementsByClass('content_plus_header');
			for (i in fc){
				if(fc[i].id!='owned' && fc[i].id!='shared' && fc[i].id!='trash'){
					goog.dom.removeNode(fc[i])
				}
			}
			var d=goog.dom.getElement('user_folders');
			goog.dom.removeChildren(d);
			var select = goog.dom.getElement('move_to_folder');
			select.innerHTML="<option value='move_to'>Move To Folder...</option><option value='?none?'>Remove From Folder</option>";
			for(i in folders){
				var f = d.appendChild(document.createElement('div'));
				f.className="tab";
				f.id="Folder"+folders[i][1];
				f.appendChild(document.createElement('img')).src="images/folder.png";
				f.appendChild(document.createTextNode(' '+folders[i][0]))
				var option = select.appendChild(document.createElement('option'))
				option.appendChild(document.createTextNode(folders[i][0]));
				option.value=folders[i][1];
				var content_plus_header=goog.dom.getElement('scriptlists').appendChild(document.createElement("div"));
				content_plus_header.id=folders[i][1];
				content_plus_header.className='content_plus_header';
				content_plus_header.style.display="none";
				var ch = content_plus_header.appendChild(document.createElement('div'))
				ch.className="contentsHeader";
				var table = ch.appendChild(document.createElement('table'));
				table.width="100%";
				tr = table.appendChild(document.createElement('tr'));
				var td = tr.appendChild(document.createElement('td'));
				td.style.width="15px";
				var cb = td.appendChild(document.createElement('input'));
				cb.type='checkbox';
				cb.style.visibility="hidden"
				var n = tr.appendChild(document.createElement('td'))
				n.appendChild(document.createTextNode(folders[i][0]));
				td = tr.appendChild(document.createElement('td'));
				td.style.width="120px";
				td.align = "center";
				td.appendChild(document.createTextNode("Shared With"));
				td = tr.appendChild(document.createElement('td'));
				td.style.width="120px";
				td.align = "center";
				td.appendChild(document.createTextNode("Email"));
				td = tr.appendChild(document.createElement('td'));
				td.style.width="160px";
				td.align = "center";
				td.appendChild(document.createTextNode("Last Modified"));
				var contents = content_plus_header.appendChild(document.createElement('div'));
				contents.id = folders[i][1]+"_contents";
				contents.className = "folderContents"
				goog.events.listen(f, goog.events.EventType.CLICK, function(e){
					goog.dom.getElementByClass('current').style.backgroundColor='white';
					goog.dom.getElementByClass('current').className='tab';
					e.target.className='tab current';
					tabs(e.target.id)
					e.target.style.backgroundColor = '#2352AE';
				});
				goog.events.listen(f, goog.events.EventType.MOUSEOVER, function(e){
					if(e.target.className!='tab current'){
						e.target.style.backgroundColor = '#ccf'
					}
					else{
						e.target.style.backgroundColor = '#2352AE'
					}
				});
				goog.events.listen(f, goog.events.EventType.MOUSEOUT, function(e){
					if(e.target.className!='tab current'){
						e.target.style.backgroundColor = '#fff'
					}
				});
			}
			goog.dom.getElement("loading").style.display = 'none';
		    //remove old data
		    var childs = goog.dom.getElement('owned_contents').childNodes;
		    for (var i=0; i<childs.length; i++){
		        childs[i].parentNode.removeChild(childs[i]);
		        i--;
		    }
			var listDiv = goog.dom.getElement('owned_contents').appendChild(document.createElement('div'));
		    listDiv.id = 'list';
			goog.dom.getElement('noentries').style.display=(x.length==0 ? "block" : "none");
		    for (var i=0; i<x.length; i++){
		        var title = x[i][1];
		        var resource_id = x[i][0];
		        var updated = x[i][2];
		        var shared_with=x[i][4];
				var new_notes=x[i][5];
				var folder = x[i][6];
		        var entryDiv = listDiv.appendChild(document.createElement('div'));
		        entryDiv.id = resource_id;
		        entryDiv.className = 'entry';
		        var entryTable = entryDiv.appendChild(document.createElement('table'));
		        entryTable.width = '100%';
		        var entryTr = entryTable.appendChild(document.createElement('tr'));
		        //make checkbox
		        var checkboxTd = entryTr.appendChild(document.createElement('td'));
		        checkboxTd.className='checkboxCell';
		        var input = checkboxTd.appendChild(document.createElement('input'));
		        input.type='checkbox';
		        input.name = 'listItems';
		        input.value = resource_id;
		        //make title
		        var titleCell = entryTr.appendChild(document.createElement('td'));
		        var titleLink = titleCell.appendChild(document.createElement('a'));
		        titleLink.id = 'name'+resource_id;
		        if (new_notes!=0){
		            var newNotesSpan = titleCell.appendChild(document.createElement('span'));
		            newNotesSpan.appendChild(document.createTextNode((new_notes==1 ? " New Note" : " "+new_notes+' New Notes')));
		            newNotesSpan.className = 'redAlertSpan';
		        }
		        var href = 'javascript:script("'+resource_id+'")';
		        titleLink.href=href;
		        titleLink.appendChild(document.createTextNode(title));
				//folder column
				var folderTd  = entryTr.appendChild(document.createElement('td'));
				folderTd.align = "center";
				folderTd.className="folderCell";
				if(folder!="?none?"){
					for(fold in folders){
						if (folders[fold][1]==folder){
							var span = folderTd.appendChild(document.createElement('span'));
							span.appendChild(document.createTextNode(folders[fold][0]));
							span.className="folderSpan";
						}
					}
				}
		        //shared column
		        var sharedTd = entryTr.appendChild(document.createElement('td'));
		        sharedTd.className = 'sharedCell';
		        sharedTd.align = 'right';
        
		        if (shared_with.length==0){
		            var collabs = '';
		        }
		        else{
		            if (shared_with.length==1){
		                var collabs = '1 person ';
		            }
		            else {
		                var collabs = String(shared_with.length)+" people ";
		            }
		        }
		        sharedTd.appendChild(document.createTextNode(collabs));
		        var manage = sharedTd.appendChild(document.createElement('a'));
		        var href = "javascript:sharePrompt('"+resource_id+"')";
		        manage.href=href;
		        manage.appendChild(document.createTextNode('Manage'));
		        manage.id = 'share'+resource_id;
		        manage.title = shared_with.join('&');
        
		        //email column
		        var emailTd = entryTr.appendChild(document.createElement('td'));
		        emailTd.className = 'emailCell';
		        emailTd.align='center';
		        var emailLink = emailTd.appendChild(document.createElement('a'));
		        emailLink.className = 'emailLink';
		        href = 'javascript:emailPrompt("'+resource_id+'")';
		        emailLink.href=href;
		        emailLink.appendChild(document.createTextNode('Email'));
		        // Last updated
		        var updatedTd = entryTr.appendChild(document.createElement('td'));
		        updatedTd.className = 'updatedCell';
		        updatedTd.align='center';
		        updatedTd.appendChild(document.createTextNode(updated));
				if(folder!="?none?"){
					var obj = entryDiv.cloneNode(true);
					var obj = goog.dom.getElement(folder+"_contents").appendChild(obj);
					obj.getElementsByTagName("input")[0].name="listItems"+folder;
				}
			}
		    // showing sharing scripts
		    //remove old data
		    var childs = goog.dom.getElement('shared_contents').childNodes;
		    for (var i=0; i<childs.length; i++){
		        childs[i].parentNode.removeChild(childs[i]);
		        i--;
		    }
		    goog.dom.getElement('sharedLoading').style.display='none';
		    goog.dom.getElement('sharedNoEntries').style.display=(ss.length==0 ? 'block' :'none');
		    var listDiv = goog.dom.getElement('shared_contents').appendChild(document.createElement('div'));
		    listDiv.id = 'sharedList';
			var number_unopened = 0;
		    for (i in ss){
		        var resource_id=ss[i][0];
		        var title = ss[i][1];
		        var updated = ss[i][2];
		        var owner = ss[i][3];
				var new_notes=ss[i][4];
				var unopened = ss[i][6];
		        var entryDiv = listDiv.appendChild(document.createElement('div'));
		        entryDiv.id = resource_id;
		        entryDiv.className = 'entry';
		        var entryTable = entryDiv.appendChild(document.createElement('table'));
		        entryTable.width = '100%';
		        var entryTr = entryTable.appendChild(document.createElement('tr'));
		        //make checkbox
		        var checkboxTd = entryTr.appendChild(document.createElement('td'));
		        checkboxTd.className='checkboxCell';
		        var input = checkboxTd.appendChild(document.createElement('input'));
		        input.type='checkbox';
		        input.name = 'sharedListItems';
		        input.value = resource_id;
		        //make title
		        var titleCell = entryTr.appendChild(document.createElement('td'));
		        var titleLink = titleCell.appendChild(document.createElement('a'));
		        titleLink.id = 'name'+resource_id;
		        var href = 'javascript:script("'+resource_id+'")';
		        titleLink.href=href;
		        titleLink.appendChild(document.createTextNode(title));
				if (unopened=="True"){
					var newNotesSpan = titleCell.appendChild(document.createElement('span'));
		            newNotesSpan.appendChild(document.createTextNode(" New Script"));
		            newNotesSpan.className = 'redAlertSpan';
					number_unopened++;
				}
				else if (new_notes!=0){
		            var newNotesSpan = titleCell.appendChild(document.createElement('span'));
		            newNotesSpan.appendChild(document.createTextNode((new_notes==1 ? " New Note  " : " "+new_notes+' New Notes  ')));
		            newNotesSpan.className = 'redAlertSpan';
		        }
		        //show owner
		        var ownerTd = entryTr.appendChild(document.createElement('td'));
		        ownerTd.appendChild(document.createTextNode(owner));
		        ownerTd.align="right";
		        ownerTd.className='ownerCell';
		        //updated
		        var updatedTd = entryTr.appendChild(document.createElement('td'));
		        updatedTd.className="updatedCell";
		        updatedTd.align="center";
		        updatedTd.appendChild(document.createTextNode(updated));
		    }
		    goog.dom.getElement("sharedFolder").innerHTML = "Shared With Me"+(number_unopened==0 ? "" : " ("+number_unopened+")")
    
		    goog.dom.getElement('trashLoading').style.display = 'none';
		    goog.dom.getElement('trashNoEntries').style.display=(z.length==0 ? 'block' :'none');
		    //remove old data
		    var childs = goog.dom.getElement('trash_contents').childNodes;
		    for (var i=0; i<childs.length; i++){
		        childs[i].parentNode.removeChild(childs[i]);
		        i--;
		    }
		    //update with new info
		    var listDiv = goog.dom.getElement('trash_contents').appendChild(document.createElement('div'));
		    listDiv.id = 'trashList';
			x=z;
		    for(i in x){
		        var title = x[i][1];
		        var resource_id = x[i][0];
		        var updated = x[i][2]
		        var shared_with=x[i][4]
				var folder = x[i][5];
		        var entryDiv = listDiv.appendChild(document.createElement('div'));
		        entryDiv.id = resource_id;
		        entryDiv.className = 'entry';
		        var entryTable = entryDiv.appendChild(document.createElement('table'));
		        entryTable.width = '100%';
		        var entryTr = entryTable.appendChild(document.createElement('tr'));
		        //make checkbox
		        var checkboxTd = entryTr.appendChild(document.createElement('td'));
		        checkboxTd.className='checkboxCell';
		        var input = checkboxTd.appendChild(document.createElement('input'));
		        input.type='checkbox';
		        input.name = 'trashListItems';
		        input.value = resource_id;
		        //make title
		        var titleCell = entryTr.appendChild(document.createElement('td'));
		        var titleLink = titleCell.appendChild(document.createElement('a'));
		        titleLink.id = 'name'+resource_id;
		        /*
		        if (newNotes==true){
		            var newNotesSpan = titleCell.appendChild(document.createElement('span'));
		            newNotesSpan.appendChild(document.createTextNode(' New Notes'));
		            newNotesSpan.className = 'redAlertSpan';
		        }
		        */
		        var href = 'javascript:haveToUndelete()';
		        titleLink.href=href;
		        titleLink.appendChild(document.createTextNode(title));
				//folder column
				var folderTd  = entryTr.appendChild(document.createElement('td'));
				folderTd.align = "center";
				folderTd.className="folderCell";
				if(folder!="?none?"){
					for(fold in folders){
						if (folders[fold][1]==folder){
							var span = folderTd.appendChild(document.createElement('span'));
							span.appendChild(document.createTextNode(folders[fold][0]));
							span.className="folderSpan";
						}
					}
				}
				folderTd.style.display="none";
		        //shared column
		        var sharedTd = entryTr.appendChild(document.createElement('td'));
		        sharedTd.className = 'sharedCell';
		        sharedTd.align = 'right';
        
		        if (shared_with.length==0){
		            var collabs = '';
		        }
		        else{
		            if (shared_with.length==1){
		                var collabs = '1 person ';
		            }
		            else {
		                var collabs = String(shared_with.length)+" people ";
		            }
		        }
		        sharedTd.appendChild(document.createTextNode(collabs));
		        var manage = sharedTd.appendChild(document.createElement('a'));
		        var href = "javascript:sharePrompt('"+resource_id+"')";
		        manage.href=href;
		        manage.appendChild(document.createTextNode('Manage'));
		        manage.id = 'share'+resource_id;
		        manage.title = shared_with.join('&');
				sharedTd.style.display="none";
        
		        //email column
		        var emailTd = entryTr.appendChild(document.createElement('td'));
		        emailTd.className = 'emailCell';
		        emailTd.align='center';
		        var emailLink = emailTd.appendChild(document.createElement('a'));
		        emailLink.className = 'emailLink';
		        href = 'javascript:emailPrompt("'+resource_id+'")';
		        emailLink.href=href;
		        emailLink.appendChild(document.createTextNode('Email'));
				emailTd.style.display="none";
		        // Last updated
		        var updatedTd = entryTr.appendChild(document.createElement('td'));
		        updatedTd.className = 'updatedCell';
		        updatedTd.align='center';
		        updatedTd.appendChild(document.createTextNode(updated));
		
		    }
			if(goog.dom.getElement(current)==null)current="ownedFolder"
			goog.dom.getElement(current).className = goog.dom.getElement(current).className.replace(" current","")+" current";
			goog.dom.getElement(current).style.backgroundColor="#2352AE";
			tabs(current);
			if(v && typeof(v)!='object'){
				sharePrompt(v);
			}
			goog.dom.getElement("refresh_icon").style.visibility="hidden";
		},
		'POST'
	);
}


function selectAll(obj, which){
	var listItems = document.getElementsByTagName('input');
	var bool = obj.checked
	for(var i=0; i<listItems.length; i++){
		if(listItems[i].type == 'checkbox'){
			if(listItems[i].name ==which){
				listItems[i].checked = bool;
			}
		}
	}
}

/**
 * Opens a script in a new Tab
 * @param {string} v Resource ID of
 * Script to be opened.
 */
function script(v){
	url = '/editor?resource_id=' + v;
	window.open(url);
	setTimeout('refreshList()',5000);
}

/**
 * Opens the New Script Popup with the button
 * is clicked
 */
function newScriptPrompt(){
	goog.dom.getElement('newscriptpopup').style.visibility = 'visible';
	goog.dom.getElement('newScript').value = "Untitled Screenplay";
	goog.dom.getElement('newScript').focus();
	goog.dom.getElement('newScript').select();
}
/**
 * Hides the New Script Popup with the X icon
 * is clicked
 */
function hideNewScriptPrompt(){
	goog.dom.getElement('newScript').value = "";
	goog.dom.getElement('newscriptpopup').style.visibility = 'hidden';
	goog.dom.getElement('createScriptButton').disabled=false;
	goog.dom.getElement('createScriptButton').value="Create";
	goog.dom.getElement('createScriptIcon').style.visibility="hidden";
}
/**
 * Sends the user created screenplay title to
 * the server. Server creates new screenplay,
 * responds with new, unique resource id.
 */
function createScript (){
	var filename = goog.dom.getElement('newScript').value;
	if (filename!=''){
		goog.dom.getElement('createScriptButton').disabled=true;
		goog.dom.getElement('createScriptButton').value="Creating Script...";
		goog.dom.getElement('createScriptIcon').style.visibility="visible";
		goog.net.XhrIo.send('/newscript',
			function(d){
				window.open('/editor?resource_id='+d.target.getResponseText());
				hideNewScriptPrompt();
				refreshList();
			},
			'POST',
			'fromPage=scriptlist&filename='+encodeURIComponent(filename)
		);
	}
}

/**
 * Opens the upload prompt on click
 */
function uploadPrompt(){
	goog.dom.getElement('uploadpopup').style.visibility = 'visible';
}
/**
 * Hides the upload prompt on click
 */
function hideUploadPrompt(){
	goog.dom.getElement('uploadFrame').src = '/convert';
	goog.dom.getElement('uploadpopup').style.visibility = 'hidden';
}

/**
 * Add listener for messages from upload iframes
 */
window.addEventListener("message", recieveMessage, false);

/**
 * Takes that message from iframe and shows correct
 * GUI, either "Loading" bar, or "Complete" message
 * @param {event object} e Contains data from cross
 * iframe message event
 */
function recieveMessage(e){
	if(e.origin!="http://www.rawscripts.com")return;
	if(e.data=="uploading"){
		goog.dom.getElement("uploading").style.display="block";
		goog.dom.getElement("uploadFrame").style.display="none";
	}
	else{
		goog.dom.getElement("uploading").style.display="none";
		goog.dom.getElement("uploadFrame").style.display="block";
		window.open("/editor?resource_id="+e.data);
		refreshList();
	}
    
}
/**
 * Opens the rename prompt on click
 */
function renamePrompt(){
	// first check that user has selected only
	// one script to rename
	var counter = 0;
	var listItems = document.getElementsByTagName('input');
	for (var i=0; i<listItems.length; i++){
		if(listItems[i].type == 'checkbox'){
			if (listItems[i].checked == true){
				if (listItems[i].name != 'trashListItems' && listItems[i].name != 'sharedListItems'){
					var resource_id = listItems[i].value;
					counter++;
				}
			}
		}
	}
	if(counter>1)alert("Please select one at a time");
	else if (counter==1){
		// if only one script, open rename prompt
		var title = 'name' + resource_id;
		goog.dom.getElement('renameTitle').innerHTML = "Rename " + goog.dom.getElement(title).innerHTML;
		goog.dom.getElement('renameField').value = goog.dom.getElement(title).innerHTML;
		goog.dom.getElement('renamepopup').style.visibility = 'visible';
		goog.dom.getElement('resource_id').value = resource_id;
	}
	
}
/**
 * hides the rename prompt on click
 */
function hideRenamePrompt(){
	goog.dom.getElement('renameField').value = "";
	goog.dom.getElement('renamepopup').style.visibility = 'hidden';
}

/**
 * Collects new user inputed title, updates GUI,
 * then sends new title and resource_id to server
 */	
function renameScript(){
	// Collect resource_id and new name
	var resource_id = goog.dom.getElement('resource_id').value;
	var rename = goog.dom.getElement('renameField').value;
	if (rename==""){return;}
	// Update DOM
	var id = "name"+resource_id;
	var a = document.getElementsByTagName('a');
	for (i in a){
		if (a[i].id==id){
			a[i].innerHTML = rename;
		}
	}
	// Send data to server
	goog.net.XhrIo.send('/rename',
		function(){},
		'POST',
		'resource_id='+resource_id+'&rename='+rename+'&fromPage=scriptlist'
	);
	// Hide prompt
	hideRenamePrompt()
}

/**
 * Makes a copy of selected script
 */
function duplicate(){
	// make sure only one script is selected
    var counter = 0;
	var listItems = document.getElementsByTagName('input');
	for (var i=0; i<listItems.length; i++){
		if(listItems[i].type == 'checkbox'){
			if (listItems[i].checked == true){
				if (listItems[i].name != 'trashListItems' && listItems[i].name != 'sharedListItems'){
					var resource_id = listItems[i].value;
					counter++;
				}
			}
		}
	}
	if(counter>1)alert("select one at a time");
	else if (counter==1){
		// if only one script, post data to server
		goog.net.XhrIo.send('/duplicate',
			function(d){
				if(d.target.getResponseText()=='fail')return;
				else{
					window.open(d.target.getResponseText());
					refreshList()
				}
			},
			'POST',
			'resource_id='+resource_id+'&fromPage=scriptlist'
		);
    }
}

/**
 * Takes checked boxes (selected scripts),
 * then creates a table in the export prompt
 * giving options for title page and export
 * format.
 */
function exportPrompt(){
	var counter = 0;
	var listItems = document.getElementsByTagName('input');
	for (var i=0; i<listItems.length; i++){
		if(listItems[i].type == 'checkbox'){
			if (listItems[i].checked == true){
				if (listItems[i].name.match(/listitems/gi)){
					var newRow = document.createElement('tr');
					var row = goog.dom.getElement('exportList').appendChild(newRow);
					var newData = row.appendChild(document.createElement('td'));
					var newTxt = document.createTextNode(goog.dom.getElement('name'+listItems[i].value).innerHTML);
					newData.appendChild(newTxt);
					//Create Selection cell					
					newData = row.appendChild(document.createElement('td'));
					var newSelect = document.createElement('select');
					var select = newData.appendChild(newSelect);
					select.name = listItems[i].value;
					select.className='export_format_select';
					var option = select.appendChild(document.createElement('option'));
					option.appendChild(document.createTextNode('Adobe PDF'));
					option = select.appendChild(document.createElement('option'));
					option.appendChild(document.createTextNode('.txt'));
                    newData = newRow.appendChild(document.createElement('td'));
                    newSelect = newData.appendChild(document.createElement('select'));
                    newSelect.name="export_format";
                    option = newSelect.appendChild(document.createElement('option'));
                    option.appendChild(document.createTextNode('Without Title Page'));
                    option = newSelect.appendChild(document.createElement('option'));
                    option.appendChild(document.createTextNode('With Title Page'));
                    var a = newRow.appendChild(document.createElement('td')).appendChild(document.createElement('a'));
                    a.appendChild(document.createTextNode('Edit Title page'));
                    a.href="/titlepage?resource_id="+listItems[i].value;
                    a.target="_blank"
					a.style.color="blue"
					counter++;
				}
			}
		}
	}
	if (counter>0){
		goog.dom.getElement('exportpopup').style.visibility = 'visible';
	}
}
/**
 * Hides export promt. Called when user clicks
 * close icon. Also called after user actually 
 * exports scripts.
 */
function hideExportPrompt(){
	goog.dom.getElement('exportpopup').style.visibility = 'hidden';
	goog.dom.getElement('exportList').innerHTML = '';
}
/**
 * Cycles through scripts to be exported. For
 * each script to be exported, collects options
 * and opens a new window at a url with those
 * options.
 */
function exportScripts(){
	var id;
	var format;
	var exports = document.getElementsByTagName('select');
	for (var i=0; i<exports.length; i++){
        if(exports[i].className=='export_format_select'){
            id = exports[i].name;
            if (exports[i].selectedIndex == 0){format = 'pdf';}
            else{format = 'txt';}
            var n = exports[i].parentNode;
            n = n.nextSibling;
            if(n.nodeName=="#text")n=n.nextSibling;
            n=n.firstChild;
            if(n.nodeName=="#text")n=n.nextSibling;
            var title = "&title_page="+n.selectedIndex;
            url = '/export?resource_id=' + id + '&export_format=' + format + '&fromPage=scriptlist'+title;
            window.open(url);
        }
    }
	hideExportPrompt();
}

/**
 * Moves Script to trash. First greys the scripts
 * to be deleted, and when the server confirms the 
 * scripts are in the trash, it moves them.
 * @param { string object } v resource_id of script
 */
function deleteScript(v){
	var scriptDiv = goog.dom.getElement(v);
	scriptDiv.style.backgroundColor = '#ccc';
	scriptDiv.style.opacity = '0.5';
	var c = document.getElementsByTagName('div');
	for (i in c){
		if(c[i].className=="entry" && c[i].id==v && c[i]!=scriptDiv){
			c[i].style.backgroundColor = '#ccc';
			c[i].style.opacity = '0.5';
		}
	}
	goog.net.XhrIo.send('/delete',
		function(){
	        scriptDiv.parentNode.removeChild(scriptDiv);
	        goog.dom.getElement('trashList').appendChild(scriptDiv);
	        scriptDiv.style.backgroundColor='#f9f9fc';
	        scriptDiv.style.opacity='1';
	        var t=scriptDiv.firstChild;
	        t=(t.nodeName=='#text' ? t.nextSibling : t);
	        t.getElementsByTagName('input')[0].name='trashListItems';
	        var c = t.getElementsByTagName('td');
	        c[2].style.display="none";
			c[3].style.display='none';
			c[4].style.display="none";
			c[1].firstChild.href="javascript:haveToUndelete()";
			goog.dom.getElement("trashNoEntries").style.display="none";
			var c = document.getElementsByTagName('div');
			for (i in c){
				if(c[i].className=="entry" && c[i].id==v && c[i]!=scriptDiv){
					c[i].parentNode.removeChild(c[i])
				}
			}
        },
		'POST',
		'resource_id='+v
		);
}
/**
 * Remove Script from trash
 * @param {string} v resource_id of script to revive
 */
function undelete(v){
    var scriptDiv = goog.dom.getElement(v);
	scriptDiv.style.backgroundColor = '#ccc';
	scriptDiv.style.opacity = '0.5';
	goog.net.XhrIo.send('/undelete',
		function(){
			scriptDiv.parentNode.removeChild(scriptDiv);
			goog.dom.getElement('list').appendChild(scriptDiv);
			scriptDiv.style.backgroundColor='#f9f9fc';
			scriptDiv.style.opacity='1';
			var t=scriptDiv.firstChild;
			t=(t.nodeName=='#text' ? t.nextSibling : t);
			t=t.firstChild;
			t=(t.nodeName=='#text' ? t.nextSibling : t);
			var c = t.getElementsByTagName('td');
			t.getElementsByTagName('input')[0].name='listItems';
			t.getElementsByTagName('a')[0].href="javascript:script('"+v+"')"
			for (i in c){
				if (c[i].style!=undefined)c[i].style.display="table-cell"
			}
			goog.dom.getElement("noentries").style.display="none";
		},
		'POST',
		'resource_id='+v
	);
}

/**
 * An alert if a user tries to open a trashed
 * script. (sucky UI, need to fix)
 */
function haveToUndelete(){
	alert("You have to Undelete this script to view it.\n\nThe Undelete button is right above your scriptlist.");
}

/**
 * Permananetly delete a script
 * @param {string} v resource_id of script
 */
function hardDelete(v){
    var scriptDiv = goog.dom.getElement(v);
    scriptDiv.style.backgroundColor = '#ccc';
    scriptDiv.style.opacity = '0.5';
	goog.net.XhrIo.send('/harddelete',
		function(){
			scriptDiv.parentNode.removeChild(scriptDiv);
		},
		'POST',
		'resource_id='+v
	);
}

/**
 * For actions done on multiple scripts, namely
 * delete, undelete, and harddelete, this is what
 * is called on user input (click). This goes through
 * what is selected and sendes the resource_id to 
 * the expected function.
 * @param {string} v delete, undelete, or hardDelete
 */
function batchProcess(v){
    var con = true;
    if(v=='hardDelete'){
        con=false;
        if (confirm("Are you sure you want to delete these scripts? This cannot be undone."))con=true;
    }
    if(con){
		var found=false;
        var listItems = document.getElementsByTagName('input');
        for (var i=0; i<listItems.length; i++){
            if(listItems[i].type == 'checkbox'){
                if (listItems[i].checked == true){
                    if (listItems[i].name.match(/listitems/gi)){
                        if(v=='delete')	deleteScript(listItems[i].value);
                        if(v=='undelete')undelete(listItems[i].value);
                        if(v=='hardDelete')hardDelete(listItems[i].value);
						found=true;
                    }			
                }
            }
        }
		if(found==true)setTimeout("refreshList()", 5000);
    }
}

/**
 * Opens email prompt GUI on click
 * @param { string } v resource_id of script
 */
function emailPrompt(v){
	var resource_id=v;
	goog.dom.getElement('emailpopup').style.visibility = 'visible';
    goog.dom.getElement('edit_title_href').href='/titlepage?resource_id='+resource_id
}

/**
 * Hide email prompt when email is complete
 * or when user chooses.
 */
function hideEmailPrompt(){
	goog.dom.getElement('emailpopup').style.visibility = 'hidden';
	goog.dom.getElement('recipient').value = "";
	goog.dom.getElement('subject').value = "";
	goog.dom.getElement('email_message').innerHTML = "";
}

/**
 * Does the job of collecting recipient names,
 * subject, and message, then sends that and
 * the resource_id to server.
 */
function emailScript(){
	var r = goog.format.EmailAddress.parseList(goog.dom.getElement('recipient').value)
	var arr=[];
	for(i in r){
		if(r[i].address_!="")arr.push(r[i].address_);
	}
	if(arr.length==0){
		alert('You need to add at least one email address.')
		return;
	}
	var recipients = arr.join(',');
	var subject = goog.dom.getElement('subject').value;
	if(subject=="")subject="Script";
	var body_message = goog.dom.getElement('email_message').innerHTML;
    var title_page = goog.dom.getElement("emailTitle").selectedIndex;
    var resource_id = goog.dom.getElement('edit_title_href').href.split('=')[1];
	goog.net.XhrIo.send('/emailscript',
		emailComplete,
		'POST',
		'resource_id='+resource_id+'&recipients='+recipients+'&subject='+encodeURIComponent(subject)+'&body_message='+encodeURIComponent(body_message)+'&fromPage=scriptlist&title_page='+title_page
	);
	goog.dom.getElement('emailS').disabled = true;
	goog.dom.getElement('emailS').value = 'Sending...';
}

/**
 * If email sent, good. If not, alert
 */
function emailComplete(e){
    console.log(e)
	goog.dom.getElement('emailS').disabled = false;
	goog.dom.getElement('emailS').value = 'Send';
	if (e.target.getResponseText()=='sent'){
		alert("Email Sent")
		hideEmailPrompt();
	}
	else{
		alert("There was a problem sending your email. Please try again later.")
	}
}

/**
 * Opens the share prompt, and populate the
 * table with info on who already has access
 * @param { string } v Resource_id of script
 */
function sharePrompt(v){
	goog.dom.getElement('shareS').disabled = false;
	goog.dom.getElement('shareS').value = "Send Invitation";
	var collabs = (goog.dom.getElement('share'+v).title=="" ? [] : goog.dom.getElement('share'+v).title.split("&"));
	var hasAccess = goog.dom.getElement('hasAccess');
	goog.dom.getElement('collaborator').value = "";
	hasAccess.innerHTML="";
	for (var i=0; i<collabs.length; i++){
		if(collabs[i]!='none'){
			var collabTr = hasAccess.appendChild(document.createElement('tr'));
			collabTr.id='shared'+collabs[i].toLowerCase();
			var emailTd = collabTr.appendChild(document.createElement('td'));
			emailTd.appendChild(document.createTextNode(collabs[i]));
			var remove = collabTr.appendChild(document.createElement('td'));
			remove.align='right';
			var newA = remove.appendChild(document.createElement('a'));
			newA.appendChild(document.createTextNode('Remove Access'));
			var href = "javascript:removeAccess('"+collabs[i]+"')";
			newA.href = href;
		}
	}
	goog.dom.getElement('shareTitle').innerHTML = goog.dom.getElement('name'+v).innerHTML;
	goog.dom.getElement('sharepopup').style.visibility = 'visible';
	goog.dom.getElement('shareResource_id').value = v;
	goog.dom.getElement('email_notify_share').checked=true;
	goog.dom.getElement('email_notify_msg').checked = false;
	goog.dom.getElement('email_notify_msg').disabled = false;
	goog.dom.getElement('share_message').style.display='none';
}

/**
 * Hides share prompt and clears fields
 */
function hideSharePrompt(){
	goog.dom.getElement('sharepopup').style.visibility = 'hidden';
	goog.dom.getElement('collaborator').value = "";
	goog.dom.getElement('hasAccess').innerHTML = '';
	goog.dom.getElement('email_notify_msg').checked=false;
	goog.dom.getElement('share_message').style.display='none';
	goog.dom.getElement('share_message').innerHTML="";
}	

/**
 * Goes through fields in share prompt for
 * data and options, sends those to server
 */
function shareScript(){
	var r = goog.format.EmailAddress.parseList(goog.dom.getElement('collaborator').value)
	var arr=[];
	var nonValidEmail=false;
	for(i in r){
		var a = r[i].address_;
		if(a!=""){
			try{
				var domain = a.split('@')[1].split('.')[0].toLowerCase();
				if(domain=='gmail' || domain=='googlemail' || domain=='rocketmail' || domain=='ymail' || domain=='yahoo'){
					arr.push(a);
				}
				else{nonValidEmail=true}
			}
			catch(err){};
		}
	}
	if(nonValidEmail==true){
		alert('At this time you can only collaborate with Gmail or Yahoo accounts.')
	}
	if(arr.length==0){
		alert('You need to add at least one email address.')
		return;
	}
	var collaborators = arr.join(',');
	var resource_id = goog.dom.getElement('shareResource_id').value;
	var sendEmail = (goog.dom.getElement('email_notify_share').checked==true ? 'y' : 'n');
	var addMsg = (goog.dom.getElement('email_notify_msg').checked==true ? 'y' : 'n');
	var msg = ((sendEmail=='y' && addMsg=='y') ? encodeURIComponent(goog.dom.getElement('share_message').innerHTML) : 'n');
	goog.net.XhrIo.send('/share',
		function(){
			goog.dom.getElement('email_notify_share').checked=true;
			goog.dom.getElement('email_notify_msg').checked=false;
			goog.dom.getElement('email_notify_msg').disabled=false;
			goog.dom.getElement('share_message').innerHTML = "";
			goog.dom.getElement('share_message').style.display='none';
			refreshList(resource_id)
		},
		'POST',
		'resource_id='+resource_id+'&collaborators='+collaborators+'&fromPage=scriptlist&sendEmail='+sendEmail+'&addMsg='+addMsg+'&msg='+msg
	);
	goog.dom.getElement('shareS').disabled = true;
	goog.dom.getElement('shareS').value = "Sending Invites...";
}

/**
 * Removes view access from a user
 * @param {string} email of user
 * to remove
 */
function removeAccess(v){
	var bool = confirm("Are you sure you want to take away access from "+v+"?");
	if (bool==true){
		var resource_id = goog.dom.getElement('shareResource_id').value;
		goog.net.XhrIo.send('/removeaccess',
			removeShareUser,
			'POST',
			'resource_id='+resource_id+'&fromPage=scriptlist&removePerson='+v
		);
		goog.dom.getElement('shared'+v.toLowerCase()).style.opacity = '0.5';
		goog.dom.getElement('shared'+v.toLowerCase()).style.backgroundColor = '#ddd';
	}
}
/**
 * Updates GUI after server says
 * a users access has been removed
 */
function removeShareUser(d){
	var data = d.target.getResponseText();
	goog.dom.getElement('shared'+data).parentNode.removeChild(goog.dom.getElement('shared'+data));
	refreshList();
}

/**
 * Changes GUI for email notification
 * when sharing script with other people
 * @param {this object} e The checkbox 
 * in the prompt
 */
function emailNotifyShare(e){
	var el = goog.dom.getElement('email_notify_msg');
	if (e.checked==true){
		el.disabled=false;
	}
	else{
		el.disabled=true;
		goog.dom.getElement('share_message').style.display='none'
		goog.dom.getElement('email_notify_msg').checked=false;
	}
}
/**
 * Changes GUI for email notification msg
 * when sharing script with other people
 * @param {this object} e The checkbox 
 * in the prompt
 */
function emailNotifyMsg(e){
	var el = goog.dom.getElement('share_message');
	if (e.checked==true){
		el.style.display='block'
	}
	else{
		el.style.display='none'
	}
}

/* FOLDER FUNCTIONS
 * 
 * Aside from permission based folders ("My Scripts", 
 * "Shared With Me", and "Trash"), Users can create
 * folders of their own to organize scripts how they
 * choose. 
 * 
 * Users can Create, Rename, and Delete folders. They
 * can move scripts into folders.
*/

/**
 * the logic for clicking on a folder (defualt or user defined)
 * and then opening up the list of relevant files
 * @param { string } v folder id
 */
function tabs(v){
	var c = document.getElementsByTagName('input');
	for (var i=0; i<c.length; i++){
		if (c[i].type == 'checkbox'){
			c[i].checked = false;
		}
	}
	var c = document.getElementsByTagName('div');
	for(var i=0; i<c.length; i++){
		if(c[i].className=="content_plus_header")c[i].style.display="none";
		if(c[i].className=="buttons_block")c[i].style.display="none";
	}
	goog.dom.getElement(v.replace("Folder","")).style.display="block";
	if(v!="ownedFolder" && v!="sharedFolder"  && v!="trashFolder")v="owned_script_buttons";
	goog.dom.getElement(v.replace("Folder","_script_buttons")).style.display="block";
}

/**
 * called when use clicks "New Folder" button.
 * Prompts user for a folder name, then creates it.
 * Attached to the folder name is a folder ID, a 
 * random 10-digit number. All info is attached to that
 * number, so the name can change, or there can be two folders
 * with the same name. A screenplay not in a folder has a
 * folder_id of "?none?"
 */
function newFolder(){
	var f = prompt("New Folder Name");
	f=f.replace(/^\s+/,"").replace(/\s+$/,"");
	if(f!=null && f!=""){
		var id = Math.round(Math.random()*10000000000);
		goog.net.XhrIo.send('/newfolder',
			function(){},
			'POST',
			'folder_name='+encodeURIComponent(f)+'&folder_id='+id
		)
		var d = goog.dom.getElement('user_folders').appendChild(document.createElement('div'));
		d.className="tab";
		d.id="Folder"+id;
		d.appendChild(document.createElement("img")).src="images/folder.png";
		d.appendChild(document.createTextNode(" "+f));
		var content_plus_header=goog.dom.getElement('scriptlists').appendChild(document.createElement("div"));
		content_plus_header.id=id;
		content_plus_header.className='content_plus_header';
		content_plus_header.style.display="none";
		var ch = content_plus_header.appendChild(document.createElement('div'))
		ch.className="contentsHeader";
		var table = ch.appendChild(document.createElement('table'));
		table.width="100%";
		var tr = table.appendChild(document.createElement('tr'));
		var td = tr.appendChild(document.createElement('td'));
		td.style.width="15px";
		var cb = td.appendChild(document.createElement('input'));
		cb.type='checkbox';
		cb.style.visibility="hidden";
		tr.appendChild(document.createElement('td')).appendChild(document.createTextNode(f));
		td = tr.appendChild(document.createElement('td'));
		td.style.width="120px";
		td.align = "center";
		td.appendChild(document.createTextNode("Shared With"));
		td = tr.appendChild(document.createElement('td'));
		td.style.width="120px";
		td.align = "center";
		td.appendChild(document.createTextNode("Email"));
		td = tr.appendChild(document.createElement('td'));
		td.style.width="160px";
		td.align = "center";
		var option = goog.dom.getElement('move_to_folder').appendChild(document.createElement('option'));
		option.appendChild(document.createTextNode(f));
		option.value=id;
		td.appendChild(document.createTextNode("Last Modified"));
		goog.events.listen(d, goog.events.EventType.CLICK, function(e){
			goog.dom.getElementByClass('current').style.backgroundColor='white';
			goog.dom.getElementByClass('current').className='tab';
			e.target.className='tab current';
			tabs(e.target.id)
			e.target.style.backgroundColor = '#2352AE';
		});
		goog.events.listen(d, goog.events.EventType.MOUSEOVER, function(e){
			if(e.target.className!='tab current'){
				e.target.style.backgroundColor = '#ccf'
			}
			else{
				e.target.style.backgroundColor = '#2352AE'
			}
		});
		goog.events.listen(d, goog.events.EventType.MOUSEOUT, function(e){
			if(e.target.className!='tab current'){
				e.target.style.backgroundColor = '#fff'
			}
		});
	}
}
/**
 * Prompts the user for a new name for the
 * folder. It then finds the relevant folder_id
 * and posts the change.
 * @param { string } v folder id
 */
function renameFolder(v){
	var prev_title=goog.dom.getTextContent(goog.dom.getElement('Folder'+v));
	var f = prompt("Rename Folder", prev_title)
	if(f!=null){
		f=f.replace(/^\s+/,"").replace(/\s+$/,"");
		if(f!=""){
			var folder_id = v;
			var d = goog.dom.getElement("Folder"+v);
			goog.dom.removeChildren(d);
			d.appendChild(document.createElement("img")).src="images/folder.png";
			d.appendChild(document.createElement("span")).appendChild(document.createTextNode(" "));
			d.appendChild(document.createTextNode(f));
			goog.net.XhrIo.send('/renamefolder',
				refreshList,
				'POST',
				'folder_name='+f+'&folder_id='+folder_id
			);
		}
	}
}
/**
 * Confirms the user wants to delete the
 * folder. Then does if if true
 */
function deleteFolder(){
	var c = confirm("Are you sure you want to delete this folder?")
	if(c==true){
		var f = folder_id.replace('Folder','');
		goog.net.XhrIo.send('/deletefolder',
			refreshList,
			'POST',
			'folder_id='+f
		);
	}
}

/**
 * Called when user makes selection from select
 * menu "move_to_folder". Input "v" will be:
 * 1) "move_to", meaning no change, or
 * 2) "?none?", meaning remove from folders, or
 * 3) the 10-digit id of the user defined 
 * folder the files should be moved to.
 * @param {string} folder if to move checked
 * script to
 */
function moveToFolder(v){
	if(v!="move_to"){
		var c = document.getElementsByTagName("input");
		var found = false;
		var arr = [];
		for (i in c){
			if (c[i].type=="checkbox" && c[i].checked==true && c[i].parentNode.className=="checkboxCell"){
				var e = c[i];
				while(e.nodeName!="DIV")e=e.parentNode;
				e.style.backgroundColor = '#ccc';
				e.style.opacity = '0.5';
				found=true;
				arr.push(c[i].value)
			}
		}
		if(found==true){
			goog.net.XhrIo.send('/changefolder',
				refreshList,
				'POST',
				'resource_id='+arr.join(',')+'&folder_id='+v
			);
		}
		goog.dom.getElement("move_to_folder").selectedIndex=0;
	}
}

/**
 * Open context menu on user defined folders
 * @param {goog.events.BrowserEvent} e The div
 * object that is right clicked on.
 */
function contextmenu(e){
	if(goog.dom.getElement('folder_context_menu')!=null){
		goog.dom.removeNode('folder_context_menu')
	}
	if(e.target.className=="tab" || e.target.className=="tab current"){
		if(e.target.id!="ownedFolder" && e.target.id!="sharedFolder" && e.target.id!="trashFolder"){
			e.preventDefault();
			folder_id=e.target.id;
			var menu = new goog.ui.PopupMenu();
			menu.setId('folder_context_menu');
			menu.addItem(new goog.ui.MenuItem('Rename Folder'));
			menu.addItem(new goog.ui.MenuItem('Delete Folder'));
			menu.render(document.body);
			menu.setPosition(e.clientX,e.clientY);
			menu.setVisible(true)
			goog.events.listen(menu, 'action', folderContextMenuAction)
		}
	}
}

/**
 * Event from folder context menu
 * @param {goog.events.Event} e option clicked
 */
function folderContextMenuAction(e){
	if(e.target.content_=='Rename Folder'){
		renameFolder(folder_id.replace('Folder',''))
	}
	else if(e.target.content_=='Delete Folder'){
		deleteFolder(folder_id.replace('Folder',''))
	}

}
/**
 * Context menu doesn't dissaprear on
 * unfocus. So this function does that
 */
function removeContextMenu(){
	if(goog.dom.getElement('folder_context_menu')!=null){
		goog.dom.removeNode('folder_context_menu');
	}
}
