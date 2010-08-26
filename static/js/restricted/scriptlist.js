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
		window.open('editor?resource_id='+evt.data);
		refreshList();
	}
}
window.oncontextmenu = contextmenu;
window.onclick = click;
function click(){
	$(".context_unit").unbind();
	if(document.getElementById('context_menu')!=null)document.getElementById('context_menu').parentNode.removeChild(document.getElementById('context_menu'));
}
function contextmenu(e){
	$(".context_unit").unbind();
	if(document.getElementById('context_menu')!=null)document.getElementById('context_menu').parentNode.removeChild(document.getElementById('context_menu'));
	if(e.target.className=="tab" || e.target.className=="tab current"){
		if(e.target.id!="ownedFolder" && e.target.id!="sharedFolder" && e.target.id!="trashFolder"){
			e.preventDefault();
			var cm = document.body.appendChild(document.createElement("div"));
			cm.style.position="fixed";
			cm.style.top=e.clientY+"px";
			cm.style.left=e.clientX+5+"px";
			cm.value = e.target.id;
			cm.title = $("#"+e.target.id).text().substr(1);
			cm.id="context_menu"
			var d = cm.appendChild(document.createElement("div"))
			d.appendChild(document.createTextNode("Rename"))
			d.className = "context_unit";
			d.addEventListener("click", renameFolder, false);
			d = cm.appendChild(document.createElement("div"))
			d.appendChild(document.createTextNode('Delete'))
			d.className = "context_unit";
			d.addEventListener("click", deleteFolder, false);
			
			$(".context_unit").mouseover(function(){
				$(this).css("background-color","#6490E6");
			});
			$(".context_unit").mouseout(function(){
				$(this).css("background-color","#fff");
			})
		}
	}
}
function tabs(v){
	var c = document.getElementsByTagName('input');
	for (var i=0; i<c.length; i++){
		if (c[i].type == 'checkbox'){
			c[i].checked = false;
		}
	}
	var c = document.getElementsByTagName('div');
	for(i in c){
		if(c[i].className=="folderContents")c[i].style.display="none";
		if(c[i].className=="buttons_block")c[i].style.display="none";
	}
	document.getElementById(v.replace("Folder","")).style.display="block";
	if(v!="ownedFolder" && v!="sharedFolder"  && v!="trashFolder")v="owned_buttons";
	document.getElementById(v.replace("Folder","_buttons")).style.display="block";
}

function newFolder(){
	var f = prompt("New Folder Name");
	f=f.replace(/^\s+/,"").replace(/\s+$/,"");
	if(f!=null && f!=""){
		var id = Math.round(Math.random()*10000000000);
		$.post("/newfolder", {folder_name:f, folder_id:id})
		var d = document.getElementById('user_folders').appendChild(document.createElement('div'));
		d.className="tab";
		d.id="Folder"+id;
		d.appendChild(document.createElement("img")).src="images/folder.png";
		d.appendChild(document.createTextNode(" "+f));
		var folderContents=document.getElementById('contents').appendChild(document.createElement("div"));
		folderContents.id=id;
		folderContents.className='folderContents';
		folderContents.style.display="none";
		var ch = folderContents.appendChild(document.createElement('div'))
		ch.className="contentsHeader";
		var table = ch.appendChild(document.createElement('table'));
		table.width="100%";
		tr = table.appendChild(document.createElement('tr'));
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
		var option = document.getElementById('move_to_folder').appendChild(document.createElement('option'));
		option.appendChild(document.createTextNode(f));
		option.value=id;
		td.appendChild(document.createTextNode("Last Modified"));
		$('.tab').unbind();
		$('.tab').click(function(e){
			$(".current").removeClass("current").css("background-color","white");
			$(this).addClass('current')
			tabs(e.target.id);
			$(this).css("background-color","#2352AE");
		});
		$(".tab").mouseover(function(){
			if(!$(this).hasClass("current")){
				$(this).css("background-color","#ccf");
			}
			else{
				$(this).css("background-color","#2352AE");
			}
		});
		$(".tab").mouseout(function(){
			if(!$(this).hasClass("current")){
				$(this).css("background-color","#fff")
			}
		});
	}
}

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
			$.post("/changefolder", {resource_id: arr.join(","), folder_id : v}, function(){refreshList()});
		}
		document.getElementById("move_to_folder").selectedIndex=0;
	}
}

function refreshList(v){
	document.getElementById("refresh_icon").style.visibility="visible";
	$.post('/list', function(data){
	
    //update with new info
	var j = JSON.parse(data);
    var x=j[0];
    var z=j[1];
    var ss=j[2];
	var folders=j[3];
	// know which tab is current, to be rest
	//set up folders
	var current = $(".current").get(0).id;
	$('.folderContents').each(function(){
		if(this.id!="owned" && this.id!="shared" && this.id!="trash") this.parentNode.removeChild(this)
	});
	var d=document.getElementById('user_folders');
	d.innerHTML="";
	var select = document.getElementById('move_to_folder');
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
		var folderContents=document.getElementById('contents').appendChild(document.createElement("div"));
		folderContents.id=folders[i][1];
		folderContents.className='folderContents';
		folderContents.style.display="none";
		var ch = folderContents.appendChild(document.createElement('div'))
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
		
	}
	$('.tab').click(function(e){
		$(".current").removeClass("current").css("background-color","white");
		$(this).addClass('current')
		tabs(e.target.id);
		$(this).css("background-color","#2352AE");
	});
	$(".tab").mouseover(function(){
		if(!$(this).hasClass("current")){
			$(this).css("background-color","#ccf");
		}
		else{
			$(this).css("background-color","#2352AE");
		}
	});
	$(".tab").mouseout(function(){
		if(!$(this).hasClass("current")){
			$(this).css("background-color","#fff")
		}
	});
	document.getElementById('loading').style.display = 'none';
    //remove old data
    var childs = document.getElementById('content').childNodes;
    for (var i=0; i<childs.length; i++){
        childs[i].parentNode.removeChild(childs[i]);
        i--;
    }
	var listDiv = document.getElementById('content').appendChild(document.createElement('div'));
    listDiv.id = 'list';
	document.getElementById('noentries').style.display=(x.length==0 ? "block" : "none");
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
			var obj = document.getElementById(folder).appendChild(obj);
			obj.getElementsByTagName("input")[0].name="listItems"+folder;
		}
	}
    // showing sharing scripts
    //remove old data
    var childs = document.getElementById('sharedContent').childNodes;
    for (var i=0; i<childs.length; i++){
        childs[i].parentNode.removeChild(childs[i]);
        i--;
    }
    document.getElementById('sharedLoading').style.display='none';
    document.getElementById('sharedNoEntries').style.display=(ss.length==0 ? 'block' :'none');
    var listDiv = document.getElementById('sharedContent').appendChild(document.createElement('div'));
    listDiv.id = 'sharedList';
	var number_unopened = 0;
    for (i in ss){
        var resource_id=ss[i][0];
        var title = ss[i][1];
        var updated = ss[i][2];
        var owner = ss[i][3];
		var new_notes=ss[i][4];
		var unopened = ss[i][6];
		console.log(unopened)
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
    document.getElementById("sharedFolder").innerHTML = "Shared With Me"+(number_unopened==0 ? "" : " ("+number_unopened+")")
    
    document.getElementById('trashLoading').style.display = 'none';
    document.getElementById('trashNoEntries').style.display=(z.length==0 ? 'block' :'none');
    //remove old data
    var childs = document.getElementById('trashContent').childNodes;
    for (var i=0; i<childs.length; i++){
        childs[i].parentNode.removeChild(childs[i]);
        i--;
    }
    //update with new info
    var listDiv = document.getElementById('trashContent').appendChild(document.createElement('div'));
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
	if(document.getElementById(current)==null)current="ownedFolder"
	document.getElementById(current).className = document.getElementById(current).className.replace(" current","")+" current";
	document.getElementById(current).style.backgroundColor="#2352AE";
	tabs(current);
	if(v){
		sharePrompt(v);
	}
	document.getElementById("refresh_icon").style.visibility="hidden";
							 });
}
function renameFolder(){
	var f = prompt("Rename Folder", this.parentNode.title)
	if(f!=null){
		f=f.replace(/^\s+/,"").replace(/\s+$/,"");
		if(f!=""){
			var folder_id = this.parentNode.value.replace("Folder", "");
			var d = document.getElementById(this.parentNode.value);
			d.innerHTML="";
			d.appendChild(document.createElement("img")).src="images/folder.png";
			d.appendChild(document.createElement("span")).appendChild(document.createTextNode(" "));
			d.appendChild(document.createTextNode(f));
			$.post("/renamefolder", {folder_name:f, folder_id: folder_id}, function(){refreshList()});
		}
	}
}
function deleteFolder(){
	var c = confirm("Are you sure you want to delete this folder?")
	if(c==true){
		var folder_id = this.parentNode.value.replace("Folder","");
		$.post("/deletefolder", {folder_id:folder_id}, function(){refreshList()})
	}
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
setTimeout('refreshList()',5000);
}
function haveToUndelete(){
	alert("You have to Undelete this script to view it.\n\nThe Undelete button is right above your scriptlist.");
}
function deleteScript(v){
	var scriptDiv = document.getElementById(v);
	scriptDiv.style.backgroundColor = '#ccc';
	scriptDiv.style.opacity = '0.5';
	var c = document.getElementsByTagName('div');
	for (i in c){
		if(c[i].className=="entry" && c[i].id==v && c[i]!=scriptDiv){
			c[i].style.backgroundColor = '#ccc';
			c[i].style.opacity = '0.5';
		}
	}
	$.post("/delete", {resource_id : v}, function(){
        scriptDiv.parentNode.removeChild(scriptDiv);
        document.getElementById('trashList').appendChild(scriptDiv);
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
		document.getElementById("trashNoEntries").style.display="none";
		var c = document.getElementsByTagName('div');
		for (i in c){
			if(c[i].className=="entry" && c[i].id==v && c[i]!=scriptDiv){
				c[i].parentNode.removeChild(c[i])
			}
		}
        });
}

function undelete(v){
    var scriptDiv = document.getElementById(v);
	scriptDiv.style.backgroundColor = '#ccc';
	scriptDiv.style.opacity = '0.5';
	$.post("/undelete", {resource_id : v}, function(){
        scriptDiv.parentNode.removeChild(scriptDiv);
        document.getElementById('list').appendChild(scriptDiv);
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
		document.getElementById("noentries").style.display="none";
    });
}

function hardDelete(v){
    var scriptDiv = document.getElementById(v);
    scriptDiv.style.backgroundColor = '#ccc';
    scriptDiv.style.opacity = '0.5';
    $.post("/harddelete", {resource_id : v}, function(){
        scriptDiv.parentNode.removeChild(scriptDiv);
    });
}


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
                    if (listItems[i].name.substr(0,9) == 'listItems' || listItems[i].name=='sharedListItems' || listItems[i].name=='trashListItems'){
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
	if(subject=="")subject="Script";
	var body_message = document.getElementById('message').innerHTML;
    var title_page = document.getElementById("emailTitle").selectedIndex;
	$.post("/emailscript", {resource_id : resource_id, recipients : recipients, subject :subject, body_message:body_message, fromPage : 'scriptlist', title_page: title_page }, function(e){emailComplete(e)});
	document.getElementById('emailS').disabled = true;
	document.getElementById('emailS').value = 'Sending...';
}
var resource_id="";
function emailPrompt(v){
	resource_id=v;
	document.getElementById('emailpopup').style.visibility = 'visible';
    document.getElementById('edit_title_href').href='/titlepage?resource_id='+resource_id
}
function hideEmailPrompt(){
document.getElementById('emailpopup').style.visibility = 'hidden';
document.getElementById('recipient').value = "";
document.getElementById('subject').value = "";
document.getElementById('message').innerHTML = "";
document.getElementById('recipients').innerHTML = "";
}

function duplicate(){
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
        $.post('/duplicate',
         {resource_id : resource_id, fromPage : 'editor'}, 
         function(d){
            if (d=='fail')return;
            else{window.open(d),refreshList();}
         });
    }
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
	document.getElementById('createScriptButton').disabled=false;
	document.getElementById('createScriptButton').value="Create";
	document.getElementById('createScriptIcon').style.visibility="hidden";
}

function createScript (){
	var filename = document.getElementById('newScript').value;
	if (filename!=''){
		document.getElementById('createScriptButton').disabled=true;
		document.getElementById('createScriptButton').value="Creating Script...";
		document.getElementById('createScriptIcon').style.visibility="visible";
		$.post('/newscript', {filename:filename, fromPage:"scriptlist"}, function(data){
            window.open('/editor?resource_id='+data);
			hideNewScriptPrompt();
			refreshList()
        });
	}
}
window.addEventListener("message", recieveMessage, false);
function recieveMessage(e){
	if(e.origin!="http://www.rawscripts.com")return;
	if(e.data=="uploading"){
		document.getElementById("uploading").style.display="block";
		document.getElementById("uploadFrame").style.display="none";
	}
	else{
		document.getElementById("uploading").style.display="none";
		document.getElementById("uploadFrame").style.display="block";
		window.open("/editor?resource_id="+e.data);
		refreshList();
	}
    
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
					option.appendChild(document.createTextNode('txt (for Celtx or FD)'));
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
        if(exports[i].name!='export_format' && exports[i].name!=''){
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
//-----------------Done Export Functions------
//
//
//-----------------Start Share Functions------
function removeAccess(v){
	var bool = confirm("Are you sure you want to take away access from "+v+"?");
	if (bool==true){
		var resource_id = document.getElementById('shareResource_id').value;
		$.post('/removeaccess', {resource_id : resource_id, fromPage : 'scriptlist', removePerson : v}, function(data){removeShareUser(data)})
		document.getElementById('shared'+v.toLowerCase()).style.opacity = '0.5';
		document.getElementById('shared'+v.toLowerCase()).style.backgroundColor = '#ddd';
	}
}
function removeShareUser(data){
	document.getElementById('shared'+data).parentNode.removeChild(document.getElementById('shared'+data));
	refreshList();
}
function sharePrompt(v){
	document.getElementById('shareS').disabled = false;
	document.getElementById('shareS').value = "Send Invitation";
	var collabs = (document.getElementById('share'+v).title=="" ? [] : document.getElementById('share'+v).title.split("&"));
	var hasAccess = document.getElementById('hasAccess');
	document.getElementById('collaborator').value = "";
	document.getElementById('collaborators').innerHTML = "";
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
	var resource_id = document.getElementById('shareResource_id').value;
	$.post("/share", {resource_id : resource_id, collaborators : collaborators, fromPage : 'scriptlist'}, function(data){refreshList(resource_id);});
	document.getElementById('shareS').disabled = true;
	document.getElementById('shareS').value = "Sending Invites...";
}


//
//
//
//
//
//
//tokenize
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
