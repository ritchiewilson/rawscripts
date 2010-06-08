function uploadWindow(evt){
	if (evt.data == 'uploading'){
		document.getElementById('uploadFrame').height= '0px';
		document.getElementById('uploadFrame').width= '0px';
		document.getElementById('uploading').style.display = 'block';
	}
	else{
		document.getElementById('uploadFrame').style.height= '210px';
		document.getElementById('uploadFrame').style.width= '250px';
		document.getElementById('uploading').style.display = 'none';
		window.open(evt.data);
		refreshList();
	}
}

function tabs(v){
	var c = document.getElementsByTagName('input');
	for (var i=0; i<c.length; i++){
		if (c[i].type == 'checkbox'){
			c[i].checked = false;
		}
	}
	if(v=='myScripts'){
		document.getElementById('owned').style.display='block';
		document.getElementById('shared').style.display='none';
	}
	else{
		document.getElementById('owned').style.display='none';
		document.getElementById('shared').style.display='block';
	}
}

function refreshList(){
	$.post('/list', function(data){
	document.getElementById('loading').style.display = 'none';
	var owned = data.split('?shared=')[0];
	if(owned=='?owned=none'){
		document.getElementById('noentries').style.display = 'block';
	}
	else{
		//remove old data
		var childs = document.getElementById('content').childNodes;
		for (var i=0; i<childs.length; i++){
			childs[i].parentNode.removeChild(childs[i]);
			i--;
		}
		//update with new info
		owned = owned.slice(19);
		var scriptlist= owned.split('?scriptname=');
		var listDiv = document.getElementById('content').appendChild(document.createElement('div'));
		listDiv.id = 'list';
		for (var i=0; i<scriptlist.length; i++){
			var title = scriptlist[i].split('?resource_id=')[0];
			var resource_id = scriptlist[i].split('?resource_id=')[1].split('?alternate_link=')[0];
			var alternate_link = scriptlist[i].split('?resource_id=')[1].split('?alternate_link=')[1].split('?updated=')[0];
			var updated = scriptlist[i].split('?resource_id=')[1].split('?alternate_link=')[1].split('?updated=')[1].split('?shared_with=')[0];
			var shared_with=scriptlist[i].split('?shared_with=');
			shared_with.splice(0,1);
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
			var href = 'javascript:script("'+resource_id+'")';
			titleLink.href=href;
			titleLink.appendChild(document.createTextNode(title));
			//shared column
			var sharedTd = entryTr.appendChild(document.createElement('td'));
			sharedTd.className = 'sharedCell';
			sharedTd.align = 'right';
			if (shared_with[0]=='none'){
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
			//Gdocs Link
			var gdocsTd=entryTr.appendChild(document.createElement('td'));
			gdocsTd.className = 'gdocsCell';
			gdocsTd.align='center';
			var gdocsLink=gdocsTd.appendChild(document.createElement('a'));
			gdocsLink.href=alternate_link;
			gdocsLink.target='_blank';
			var gif = gdocsLink.appendChild(document.createElement('img'));
			gif.src="images/docs.gif";
			var png = gdocsLink.appendChild(document.createElement('img'));
			png.src="images/popup.png";
		}
	}
	var shared = data.split('?shared=')[1];
	document.getElementById('sharedLoading').style.display='none';
	if (shared=='none'){
		document.getElementById('sharedNoEntries').style.display='block';
	}
	else{
		//remove old data
		var childs = document.getElementById('sharedContent').childNodes;
		for (var i=0; i<childs.length; i++){
			childs[i].parentNode.removeChild(childs[i]);
			i--;
		}
		//update with new info
		shared = shared.slice(12);
		var sharedScriptList= shared.split('?scriptname=');
		var listDiv = document.getElementById('sharedContent').appendChild(document.createElement('div'));
		listDiv.id = 'sharedList';
		for(var i=0; i<sharedScriptList.length; i++){
			var title = sharedScriptList[i].split('?resource_id=')[0];
			var resource_id = sharedScriptList[i].split('?resource_id=')[1].split('?alternate_link=')[0];
			var alternate_link = sharedScriptList[i].split('?resource_id=')[1].split('?alternate_link=')[1].split('?updated=')[0];
			var updated = sharedScriptList[i].split('?resource_id=')[1].split('?alternate_link=')[1].split('?updated=')[1].split('?shared_with=')[0];
			var shared_with=sharedScriptList[i].split('?shared_with=', 2)[1];
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
			//shared column
			var sharedTd = entryTr.appendChild(document.createElement('td'));
			sharedTd.className = 'sharedCell';
			sharedTd.align = 'center';
			sharedTd.appendChild(document.createTextNode(shared_with));
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
			//Gdocs Link
			var gdocsTd=entryTr.appendChild(document.createElement('td'));
			gdocsTd.className = 'gdocsCell';
			gdocsTd.align='center';
			var gdocsLink=gdocsTd.appendChild(document.createElement('a'));
			gdocsLink.href=alternate_link;
			gdocsLink.target='_blank';
			var gif = gdocsLink.appendChild(document.createElement('img'));
			gif.src="images/docs.gif";
			var png = gdocsLink.appendChild(document.createElement('img'));
			png.src="images/popup.png";
		}
	}
							 });
}
function tokenize(kind){
	var counter = 0;
	var c = document.getElementsByTagName('div');
		for(var i=0;i<c.length;i++){
			if(c[i].className=='token'){
				counter++;
				}
			}
	if (counter>4){alert('You can only have 5 recipients at a time for now. Only the first five will be sent.');return;}
	var txtbox = document.getElementById(kind);
	var data = txtbox.value.replace(',','');
	var whitespace = data.replace(/ /g, "");
	if (whitespace==""){return;}
	var arr = data.split(' ');
	var email = arr.pop();
	var name = "";
	if(arr.length == 0){name = email;}
	else{name = arr.join(' ').replace(/"/g, '');}
	// Create Token div
	var newToken = document.createElement('div');
	var insertedToken = document.getElementById(kind+'s').appendChild(newToken);
	insertedToken.className='token';
	insertedToken.id = email;
	// Create Name Area
	var newSpan = document.createElement('span');
	var nameSpan = insertedToken.appendChild(newSpan);
	var nameText = document.createTextNode(name);
	nameSpan.appendChild(nameText);
	//Create Mailto area
	var newSpan = document.createElement('span');
	var emailSpan = insertedToken.appendChild(newSpan);
	var emailText = document.createTextNode(email);
	emailSpan.className = 'mailto';
	emailSpan.appendChild(emailText);
	// create X button
	var newA = document.createElement('a');
	var xA = insertedToken.appendChild(newA);
	var xText = document.createTextNode(" | X");
	xA.appendChild(xText);
	var js = 'javascript:removeToken("'+email+'")'
	xA.setAttribute('href', js);
	txtbox.value='';
	
}
function removeToken(v){
	var token = document.getElementById(v);
	token.parentNode.removeChild(token);	
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


function script(v){
url = '/editor?resource_id=' + v;
window.open(url);
}

function deleteScript(v){
	var script = document.getElementById(v);
	script.style.backgroundColor = '#ccc';
	script.style.opacity = '0.5';
	$.post("/delete", {resource_id : v}, function(){script.parentNode.removeChild(script);});
	}
function batchProcess(v){
	var listItems = document.getElementsByTagName('input');
	for (var i=0; i<listItems.length; i++){
		if(listItems[i].type == 'checkbox'){
			if (listItems[i].checked == true){
				if (listItems[i].name == 'listItems' || listItems[i].name=='sharedListItems'){
					if(v=='delete')	deleteScript(listItems[i].value);
				}			
			}
		}
	}
}

function emailComplete(e){
	document.getElementById('emailS').disabled = false;
	document.getElementById('emailS').value = 'Send';
	if (e=='sent'){
		alert("Email Sent")
		hideEmailPrompt();
	}
	else{
		alert("There was a problem sending your email. Please try again later.")
	}
}
function emailScript(){
	tokenize('recipient');
	var arr = new Array();
	var c = document.getElementsByTagName('span');
	for(var i=0;i<c.length; i++){
		if (c[i].className=='mailto'){
			arr.push(c[i].innerHTML);
			}
		}
	var recipients = arr.join(',');
	var subject = document.getElementById('subject').value;
	var body_message = document.getElementById('message').innerHTML;
	$.post("/emailscript", {resource_id : resource_id, recipients : recipients, subject :subject, body_message:body_message, fromPage : 'scriptlist'}, function(e){emailComplete(e)});
	document.getElementById('emailS').disabled = true;
	document.getElementById('emailS').value = 'Sending...';
}
var resource_id="";
function emailPrompt(v){
	resource_id=v;
	document.getElementById('emailpopup').style.visibility = 'visible';
}
function hideEmailPrompt(){
document.getElementById('emailpopup').style.visibility = 'hidden';
document.getElementById('recipient').value = "";
document.getElementById('subject').value = "";
document.getElementById('message').innerHTML = "";
document.getElementById('recipients').innerHTML = "";
}

function renamePrompt(){
	var counter = 0;
	var listItems = document.getElementsByTagName('input');
	for (var i=0; i<listItems.length; i++){
		if(listItems[i].type == 'checkbox'){
			if (listItems[i].checked == true){
				if (listItems[i].name == 'listItems'){
					var resource_id = listItems[i].value;
					counter++;
				}
			}
		}
	}
	if(counter>1)alert("select one at a time");
	else if (counter==1){
		var title = 'name' + resource_id;
		document.getElementById('renameTitle').innerHTML = "Rename " + document.getElementById(title).innerHTML;
		document.getElementById('renameField').value = document.getElementById(title).innerHTML;
		document.getElementById('renamepopup').style.visibility = 'visible';
		document.getElementById('resource_id').value = resource_id;
	}
	
	}

function hideRenamePrompt(){
	document.getElementById('renameField').value = "";
	document.getElementById('renamepopup').style.visibility = 'hidden';
	}
	
function renameScript(){
	var resource_id = document.getElementById('resource_id').value;
	var rename = document.getElementById('renameField').value;
	if (rename==""){return;}
	var id = "name"+resource_id;
	document.getElementById(id).innerHTML = rename;
	$.post("/rename", {resource_id : resource_id, rename : rename, fromPage : 'scriptlist'});
	hideRenamePrompt()
	}
	
function uploadPrompt(){
	document.getElementById('uploadpopup').style.visibility = 'visible';
	}
function hideUploadPrompt(){
	document.getElementById('uploadFrame').src = '/convert';
	document.getElementById('uploadpopup').style.visibility = 'hidden';
	}

function titleChange(){
	var filename = document.getElementById('script').value;
	var title = filename.replace('.celtx', '');
	document.getElementById('hidden').value = title;
	}
function uploadScript(){
	var script = document.getElementById('script').files[0].getAsBinary();
	var filename = document.getElementById('filename');
	$.post('/convertprocess', {script : script, filename : filename})
	}
function newScriptPrompt(){
	document.getElementById('newscriptpopup').style.visibility = 'visible';
	}
function hideNewScriptPrompt(){
	document.getElementById('newScript').value = "";
	document.getElementById('newscriptpopup').style.visibility = 'hidden';
	}

function createScript (){
	var filename = document.getElementById('newScript').value;
	if (filename!=''){
		var url = '/loading?filename=' + filename;
		window.open(url);
	}
	hideNewScriptPrompt()
	setTimeout('refreshList()', 10000);
	}
function hideExportPrompt(){
	document.getElementById('exportpopup').style.visibility = 'hidden';
	document.getElementById('exportList').innerHTML = '';
	}
function exportPrompt(){
	var counter = 0;
	var listItems = document.getElementsByTagName('input');
	for (var i=0; i<listItems.length; i++){
		if(listItems[i].type == 'checkbox'){
			if (listItems[i].checked == true){
				if (listItems[i].name == 'listItems' || listItems[i].name=='sharedListItems'){
					var newRow = document.createElement('tr');
					var row = document.getElementById('exportList').appendChild(newRow);
					var newData = row.appendChild(document.createElement('td'));
					var newTxt = document.createTextNode(document.getElementById('name'+listItems[i].value).innerHTML);
					newData.appendChild(newTxt);
					//Create Selection cell					
					newData = row.appendChild(document.createElement('td'));
					var newSelect = document.createElement('select');
					var select = newData.appendChild(newSelect);
					select.name = listItems[i].value;
					var option = select.appendChild(document.createElement('option'));
					option.appendChild(document.createTextNode('Adobe PDF'));
					option = select.appendChild(document.createElement('option'));
					option.appendChild(document.createTextNode('.txt (for Celtx or FD)'));
					counter++;
				}
			}
		}
	}
	if (counter>0){
		document.getElementById('exportpopup').style.visibility = 'visible';
		}
	}
function exportScripts(){
	var id;
	var format;
	var exports = document.getElementsByTagName('select');
	for (var i=0; i<exports.length; i++){
		id = exports[i].name;
		if (exports[i].selectedIndex == 0) format = 'pdf';
		else format = 'txt';
		url = '/export?resource_id=' + id + '&export_format=' + format + '&fromPage=scriptlist';
		window.open(url);
	}
	hideExportPrompt();
}
function removeAccess(v){
	var bool = confirm("Are you sure you want to take away access from "+v+"?");
	if (bool==true){
		var resource_id = document.getElementById('shareResource_id').value;
		$.post('/removeaccess', {resource_id : resource_id, fromPage : 'scriptlist', removePerson : v}, function(data){removeShareUser(data)})
		document.getElementById(v.toLowerCase()).style.opacity = '0.5';
		document.getElementById(v.toLowerCase()).style.backgroundColor = '#ddd';
	}
}
function removeShareUser(data){
	document.getElementById(data).parentNode.removeChild(document.getElementById(data));
}
function sharePrompt(v){
	$.post('/contactlist', {fromPage : 'editorShare'}, function(data){var contacts = data.split(';');$("input#collaborator").autocomplete({source: contacts});});
	var collabs = document.getElementById('share'+v).title.split('&');
	var hasAccess = document.getElementById('hasAccess');
	for (var i=0; i<collabs.length; i++){
		if(collabs[i]!='none'){
			var collabTr = hasAccess.appendChild(document.createElement('tr'));
			collabTr.id=collabs[i].toLowerCase();
			var emailTd = collabTr.appendChild(document.createElement('td'));
			emailTd.appendChild(document.createTextNode(collabs[i]));
			var remove = collabTr.appendChild(document.createElement('td'));
			var newA = remove.appendChild(document.createElement('a'));
			newA.appendChild(document.createTextNode('Remove Access'));
			var href = "javascript:removeAccess('"+collabs[i]+"')";
			newA.href = href;
		}
	}
	document.getElementById('shareTitle').innerHTML = document.getElementById('name'+v).innerHTML;
	document.getElementById('sharepopup').style.visibility = 'visible';
	document.getElementById('shareResource_id').value = v;
	
}
function hideSharePrompt(){
document.getElementById('sharepopup').style.visibility = 'hidden';
document.getElementById('collaborator').value = "";
document.getElementById('collaborators').innerHTML = "";
document.getElementById('hasAccess').innerHTML = '';
}
function shareScript(){
	tokenize('collaborator');
	var arr = new Array();
	var c = document.getElementsByTagName('span');
	for(var i=0;i<c.length; i++){
		if (c[i].className=='mailto'){
			arr.push(c[i].innerHTML);
			}
		}
	var collaborators = arr.join(',');
	var url = window.location.href;
	var resource_id = document.getElementById('shareResource_id').value;
	$.post("/share", {resource_id : resource_id, collaborators : collaborators, fromPage : 'editor'}, function(){refreshList()});
	hideSharePrompt();
}