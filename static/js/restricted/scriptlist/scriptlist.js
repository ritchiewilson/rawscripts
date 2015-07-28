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
window['sharePrompt'] = sharePrompt;
window['hideSharePrompt'] = hideSharePrompt;
window['shareScript'] = shareScript;
window['emailNotifyShare'] = emailNotifyShare;
window['emailNotifyMsg'] = emailNotifyMsg;


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
    return;
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
	for(i in r){
		var a = r[i].address_;
		if(a!=""){
			arr.push(a);
		}
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

