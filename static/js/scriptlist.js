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
function refreshList(){
	$.post('/list', function(data){
	document.getElementById('loading').style.display = 'none';
	if(data=='no entries'){
		document.getElementById('noentries').style.display = 'block';
	}
	else{
		document.getElementById('content').innerHTML = data;
	}
							 });
}
function tokenize(){
	var counter = 0;
	var c = document.getElementsByTagName('div');
		for(var i=0;i<c.length;i++){
			if(c[i].className=='token'){
				counter++;
				}
			}
	if (counter>4){alert('You can only have 5 recipients at a time for now. Only the first five will be sent.');return;}
	var txtbox = document.getElementById('recipient');
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
	var insertedToken = document.getElementById('recipients').appendChild(newToken);
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
function selectAll(obj){
	var listItems = document.getElementsByTagName('input');
	var bool = obj.checked
	for(var i=0; i<listItems.length; i++){
		if(listItems[i].type == 'checkbox'){
			listItems[i].checked = bool;
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
				if (listItems[i].name == 'listItems'){
					if(v=='delete')	deleteScript(listItems[i].value);
				}			
			}
		}
	}
}


function emailScript(){
	tokenize();
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
	$.post("/emailscript", {resource_id : resource_id, recipients : recipients, subject :subject, body_message:body_message, fromPage : 'scriptlist'});
	document.getElementById('emailpopup').style.visibility = 'hidden';
	document.getElementById('recipient').value = "";
	document.getElementById('subject').value = "";
	document.getElementById('message').innerHTML = "";
	document.getElementById('recipients').innerHTML = "";
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
				if (listItems[i].name == 'listItems'){
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