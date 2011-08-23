//notes
function sortNotes(a,b){
    if (a.row<b.row) return -1;
    if (a.row>b.row) return 1;
    if (a.col<b.col) return -1;
    if (a.col>b.col) return 1;
    return 0;
}
function sortNotesCol(a,b){
    if (a.col<b.col) return -1;
    if (a.col>b.col) return 1;
    return 0;
}
function noteIndex(){
    notes.sort(sortNotes);
	var c = goog.dom.getElement('noteBox')
	goog.dom.removeChildren(c);
	for (x in notes){
		//build box
		var newDiv=c.appendChild(document.createElement('div'));
		newDiv.className='noteListUnit';
		newDiv.id = 'noteListUnit'+notes[x].thread_id;
		// figure out what page its on
		if(pageBreaks.length==0){var pn = 1}
		else{
			var i=0;
			while(notes[x].row*1+1*1>pageBreaks[i][0]){
				i++;
				if(i==pageBreaks.length)break
			}
			var pn=i*1+1;
		}
		//get note snippet
		var tmpEl = goog.dom.createElement('div');
		tmpEl.innerHTML = notes[x].msgs[0].text;
		var snippet = goog.dom.getTextContent(tmpEl);
		if (snippet.length>80)snippet = snippet.substr(0,77)+'...';
		snippet = '"'+snippet+'"';
		// figre out reply text
		var replySpan = goog.dom.createElement('span');
		if(notes[x].msgs.length==2){
			replySpan.appendChild(goog.dom.createTextNode('1 Reply'));
		}
		else if(notes[x].msgs.length>2){
			replySpan.appendChild(goog.dom.createTextNode((notes[x].msgs.length*1-1)+' Replies'));
		}
		//figure out how many new replies
		var r = 0;
		for (y in notes[x].msgs){
			if(String(notes[x].msgs[y].readBool)=='0')r++;
		}
		var newReplySpan = goog.dom.createElement('span');
		newReplySpan.style.color = 'red';
		if(r!=0)newReplySpan.appendChild(goog.dom.createTextNode("("+r+" New)"))
		//build table
		var table = newDiv.appendChild(document.createElement('table'));
		table.style.fontFamily='sans-serif';
		table.width='100%';
		var tr = table.appendChild(document.createElement('tr'));
		var td = tr.appendChild(document.createElement('td'));
		td.appendChild(goog.dom.createTextNode('Page '+pn+' -'));
		td.width='23%';
		td.vAlign='top';
		tr.appendChild(document.createElement('td')).appendChild(goog.dom.createTextNode(snippet));
		tr = table.appendChild(document.createElement('tr'));
		tr.appendChild(document.createElement('td')).appendChild(replySpan);
		tr.appendChild(document.createElement('td')).appendChild(newReplySpan);
		goog.events.listen(newDiv, goog.events.EventType.CLICK, function(e){
			var el = e.target;
			while(el.className!='noteListUnit')el=el.parentNode;
			var id = parseInt(el.id.replace('noteListUnit',''));
			for(i in notes){
				if (notes[i].thread_id==id){
					var row = notes[i].row;
					var col = notes[i].col;
					pos.row=anch.row=row;
					pos.col=anch.col=col;
					caretInLimits();
				}
			}
			autoScroll();
			notesDialog(e, false, false, false)
		});
	}
    typeToScript=true;
}
function notesDialog(e, id, top, left){
	if (e){
		var c = e.target;
		while(c.nodeName!='DIV')c=c.parentNode;
		var id = parseInt(c.id.replace('noteListUnit',""));
	}
	var c = goog.dom.getElementsByClass('modal-dialog')
	for (i in c){
		if(c[i].id=='modal-dialog'+id){
			bringDialogToFront(id);
			return;
		}
	}
	var d = new goog.ui.Dialog();
	d.setModal(false);
	d.setTitle('Notes');
	//figure out what to put in there
	var str = "";
	var user = goog.dom.getElement('user_email').innerHTML.toLowerCase();
	for (i in notes){
		if(notes[i].thread_id==id){
			for(j in notes[i].msgs){
				var classN = (parseInt(notes[i].msgs[j].readBool)==0 ? "noteMessageUnread' title='Click To Mark As Read'" : 'noteMessage')
				str+="<div class='"+classN+"' id='"+notes[i].msgs[j].msg_id+"' onclick='markAsRead(this)'>";
				str+="<b>"+notes[i].msgs[j].user+" - </b><span> </span> ";
				str+=notes[i].msgs[j].text;
				//edit controls
				var edit = "";
				if(notes[i].msgs[j].user.toLowerCase()==user){
					edit+=" <span class='noteControls' onclick='newMessage(this)'>edit</span> |"
				}
				if(notes[i].msgs[j].user.toLowerCase()==user || EOV=='editor'){
					edit+=" <span class='noteControls' onclick='deleteMessage(this)'>delete</span>"
				}
				if(j==0 && EOV=='editor'){
					edit+=" | <span class='noteControls' onclick='deleteThread(this)'>delete all</a>"
				}
				if(edit!=""){
					str+=" <div align='right'>"+edit+"</div>"
				}
				str+="</div>";
			}
		}
	}
	str+='<input type="button" value="Reply">';
	d.setContent(str);
	d.setButtonSet(null);
	d.setVisible(true);
	d.setDisposeOnHide(true);
	d.getDialogElement().id='modal-dialog'+id;
	if(top){
		d.getDialogElement().style.top=top;
		d.getDialogElement().style.left=left;
	}
	else{
		var s = goog.dom.getViewportSize();
		d.getDialogElement().style.left=(s.width*1-650)+"px";
	}
	goog.events.listen(d.getDialogElement(), goog.events.EventType.MOUSEDOWN, bringDialogToFront);
	
	var mdc = d.getContentElement();
	var reply = mdc.getElementsByTagName('input')[0];
	goog.events.listen(reply, goog.events.EventType.CLICK, newMessage);
	bringDialogToFront(id);
	var c = document.getElementsByTagName('div');
	for (i in c){
		if(c[i].className=="noteMessageUnread"){
			markAsRead(c[i]);
		}
	}
}
function markAsRead(e){
	var el = e;
	while(el.className!='noteMessage' && el.className!='noteMessageUnread'){el=el.parentNode}
	if(el.className=='noteMessage')return;
	var msg_id=el.id;
	while(el.className!='modal-dialog')el=el.parentNode;
	var thread_id=parseInt(el.id.replace('modal-dialog',''));
	goog.net.XhrIo.send('/notesmarkasread',
		function(){
			var anim = new goog.fx.dom.BgColorTransform(e, [250, 128, 114], [255, 255, 224], 500);
			goog.events.listen(anim, goog.fx.Animation.EventType.END, function() {
				e.className='noteMessage'
				e.removeAttribute('title');
			});
			anim.play();
			for (i in notes){
				if (notes[i].thread_id==thread_id){
					for(j in notes[i].msgs){
						if (notes[i].msgs[j].msg_id==msg_id){
							notes[i].msgs[j].readBool=1;
						}
					}
				}
			}
			noteIndex();
		},
		'POST',
		'resource_id='+resource_id+'&thread_id='+thread_id+'&msg_id='+encodeURIComponent(msg_id)
	)
}
function newThread(){
	tabs(1);
	var id=Math.round(Math.random()*1000000000);
    var found=true;
    while (found==true){
        found=false;
        for (i in notes){
            if (String(notes[i].thread_id)==String(id)){
                id=Math.round(Math.random()*1000000000);
                found=true;
            }
        }
    }
	notes.push({row:pos.row, col:pos.col, msgs:{text:'temp', user:'temp', msg_id:'temp', readBool:1}, thread_id:id})
	uniqueNotePositions();
	viewNotes=true;
	//set up dialog box
	var d = new goog.ui.Dialog();
	d.setModal(false);
	d.setTitle('Notes');
	d.setContent('');
	d.setButtonSet(null);
	d.setVisible(true);
	d.setDisposeOnHide(true);
	d.setHasTitleCloseButton(false);
	d.getDialogElement().id='modal-dialog'+id;
	var s = goog.dom.getViewportSize();
	d.getDialogElement().style.left=(s.width*1-650)+"px";
	goog.events.listen(d.getDialogElement(), goog.events.EventType.MOUSEDOWN, bringDialogToFront);
	var c = d.getContentElement();
	var tb = c.appendChild(goog.dom.createElement('div'));
	var editMe = goog.dom.createElement('div');
	editMe.id = 'editMe';
	editMe.className='messageEditBox';
	goog.dom.insertSiblingAfter(editMe, tb);
	var sb = goog.dom.createElement('input');
	sb.type='button';
	sb.value = 'Save';
	goog.dom.insertSiblingAfter(sb, editMe);
	var cb = goog.dom.createElement('input');
	cb.type='button';
	cb.value = 'Cancel';
	goog.dom.insertSiblingAfter(cb, sb);
	var myField = new goog.editor.Field('editMe');
	editMe.removeAttribute('id');
	myField.registerPlugin(new goog.editor.plugins.BasicTextFormatter());
	myField.registerPlugin(new goog.editor.plugins.RemoveFormatting());
	myField.registerPlugin(new goog.editor.plugins.UndoRedo());
	myField.registerPlugin(new goog.editor.plugins.ListTabHandler());
	myField.registerPlugin(new goog.editor.plugins.SpacesTabHandler());
	myField.registerPlugin(new goog.editor.plugins.EnterHandler());
	myField.registerPlugin(new goog.editor.plugins.HeaderFormatter());
	var buttons = [
		goog.editor.Command.BOLD,
		goog.editor.Command.ITALIC,
		goog.editor.Command.UNDERLINE,
		goog.editor.Command.FONT_COLOR,
		goog.editor.Command.FONT_SIZE,
		goog.editor.Command.UNDO,
		goog.editor.Command.REDO,
		goog.editor.Command.UNORDERED_LIST,
		goog.editor.Command.ORDERED_LIST,
		goog.editor.Command.STRIKE_THROUGH,
		goog.editor.Command.REMOVE_FORMAT
	];
	var myToolbar = goog.ui.editor.DefaultToolbar.makeToolbar(buttons,tb);
	var myToolbarController = new goog.ui.editor.ToolbarController(myField, myToolbar);
	myField.makeEditable();
	myField.focusAndPlaceCursorAtStart();
	goog.events.listen(myField, goog.events.EventType.BLUR, function(e){typeToScript=true});
	goog.events.listen(myField, goog.events.EventType.FOCUS, function(e){typeToScript=false});
	goog.events.listen(sb, goog.events.EventType.CLICK, submitNewThread);
	goog.events.listen(cb, goog.events.EventType.CLICK, cancelNewThread);
}
function cancelNewThread(){
	var el = this;
	while(el.className!='modal-dialog')el=el.parentNode;
	var id = parseInt(el.id.replace('modal-dialog',''));
	for(i in notes){
		if(notes[i].thread_id==id){
			notes.splice(i,1);
			break;
		}
	}
	goog.dom.removeNode(el);
}
function submitNewThread(){
	var el = this;
	while(el.className!='messageEditBox editable')el=el.previousSibling;
    var content = el.contentWindow.document.body.innerHTML;
	while(el.className!='modal-dialog')el=el.parentNode;
	var thread_id = parseInt(el.id.replace('modal-dialog', ''));
	var top = el.style.top;
	var left = el.style.left;
	goog.net.XhrIo.send('/notesnewthread',
		function(e){
			var r = e.target.getResponseJson();
			if(r[0]=='error'){
				alert("Sorry, there was a problem sending that message. Please try again later.")
			}
			else{
				var row = r[0];
				var col = r[1];
				var thread_id = r[2];
				var msg_id = r[3];
				var user = r[4];
				for (i in notes){
					if (notes[i].thread_id==thread_id){
						notes[i].msgs=[{text:content, user:user, msg_id:msg_id}];
					}
				}
				noteIndex();
				goog.dom.removeNode(el);
				notesDialog(false, thread_id, top, left);
			}
		},
		'POST',
		'fromPage=editor&resource_id='+resource_id+'&row='+pos.row+'&col='+pos.col+'&content='+encodeURIComponent(content)+'&thread_id='+thread_id
	);
	this.disabled = true;
	this.value = 'Saving...';
}
function newMessage(t){
    typeToScript=false;
	if (this.nodeName=='INPUT'){
		var el = this;
		var content = "";
		var id = 'new'+ new Date().getTime();
	}
	else{
		var el = t;
		while(el.className!='noteMessage' && el.className!='noteMessageUnread'){el=el.parentNode}
		while (t.nodeName!='DIV')t=t.parentNode;
		goog.dom.removeNode(t);
		var c = el.childNodes;
		for (i in c){
			if(c[i].nodeName=='B'){
				goog.dom.removeNode(c[i]);
				break;
			}
		}
		var c = el.getElementsByTagName('*');
		for (i in c){
			if(c[i].nodeName=='A')goog.dom.flattenElement(c[i])
		}
		var content = el.innerHTML;
		var id = el.id;
		var reply = el;
		while(reply.value!='Reply')reply=reply.nextSibling;
		goog.dom.removeNode(reply);
	}
	var tb = goog.dom.createElement('div')
	goog.dom.insertSiblingAfter(tb,el);
	goog.dom.removeNode(el);
	var editMe = goog.dom.createElement('div')
	editMe.className='messageEditBox';
	editMe.id = id;
	goog.dom.insertSiblingAfter(editMe, tb);
	var sb = goog.dom.createElement('input');
	sb.type='button';
	sb.value = 'Save';
	goog.dom.insertSiblingAfter(sb, editMe);
	var cb = goog.dom.createElement('input');
	cb.type='button';
	cb.value = 'Cancel';
	goog.dom.insertSiblingAfter(cb, sb);
	goog.dom.removeNode(this);
	var myField = new goog.editor.Field(id);
	myField.registerPlugin(new goog.editor.plugins.BasicTextFormatter());
	myField.registerPlugin(new goog.editor.plugins.RemoveFormatting());
	myField.registerPlugin(new goog.editor.plugins.UndoRedo());
	myField.registerPlugin(new goog.editor.plugins.ListTabHandler());
	myField.registerPlugin(new goog.editor.plugins.SpacesTabHandler());
	myField.registerPlugin(new goog.editor.plugins.EnterHandler());
	myField.registerPlugin(new goog.editor.plugins.HeaderFormatter());
	var buttons = [
		goog.editor.Command.BOLD,
		goog.editor.Command.ITALIC,
		goog.editor.Command.UNDERLINE,
		goog.editor.Command.FONT_COLOR,
		goog.editor.Command.FONT_SIZE,
		goog.editor.Command.UNDO,
		goog.editor.Command.REDO,
		goog.editor.Command.UNORDERED_LIST,
		goog.editor.Command.ORDERED_LIST,
		goog.editor.Command.STRIKE_THROUGH,
		goog.editor.Command.REMOVE_FORMAT
	];
	var myToolbar = goog.ui.editor.DefaultToolbar.makeToolbar(buttons,tb);
	var myToolbarController = new goog.ui.editor.ToolbarController(myField, myToolbar);
	myField.makeEditable();
	myField.setHtml(false, content);
	myField.focusAndPlaceCursorAtStart();
	goog.events.listen(myField, goog.events.EventType.BLUR, function(e){typeToScript=true});
	goog.events.listen(myField, goog.events.EventType.FOCUS, function(e){typeToScript=false});
	goog.events.listen(sb, goog.events.EventType.CLICK, submitMessage);
	goog.events.listen(cb, goog.events.EventType.CLICK, cancelMessage);
}

function cancelMessage(){
	var el = this;
	while(el.className!='modal-dialog'){el=el.parentNode}
	var top = el.style.top;
	var left = el.style.left;
	var id = parseInt(el.id.replace('modal-dialog',''));
	goog.dom.removeNode(el)
	typeToScript=true;
	notesDialog(false, id, top, left);
}

function submitMessage(){
	this.disabled=true;
	this.value='Saving...'
	var el = this;
	while(el.className!='messageEditBox editable')el=el.previousSibling;
	var editorBox = el;
	var content = el.contentWindow.document.body.innerHTML;
	var msg_id=el.id;
	while(el.className!='modal-dialog')el=el.parentNode;
	var thread_id=parseInt(el.id.replace('modal-dialog',''));
    var d = new Date();
	goog.net.XhrIo.send('/notessubmitmessage',
		function(e){
			try{
				var r = e.target.getResponseJson()
			}
			catch(e){
				alert("Sorry, there was a problem sending that message. Please try again later.")
				return;
			}
			if(r[0]=='error'){
				alert("Sorry, there was a problem sending that message. Please try again later.")
			}
			else{
				var new_content = r[0];
				var timestamp = r[1];
				var user = r[2];
				var thread_id = r[3];
				var top = el.style.top;
				var left = el.style.left;
				goog.dom.removeNode(el)
				for(i in notes){
					if(notes[i].thread_id==thread_id){
						var found = false;
						for(j in notes[i].msgs){
							if(notes[i].msgs[j].msg_id==timestamp){
								notes[i].msgs[j].text=new_content;
								found=true;
							}
						}
						if(!found){
							notes[i].msgs.push({text:new_content, user:user,msg_id:timestamp})
						}
					}
				}
				noteIndex();
				notesDialog(false, thread_id, top, left)
			}
		},
		'POST',
		'resource_id='+resource_id+'&content='+encodeURIComponent(content)+'&thread_id='+thread_id+'&msg_id='+msg_id+'&fromPage=editor'
	);
	noteIndex();
}

function deleteThread(v){
	var el = v;
	while(el.className!='modal-dialog')el=el.parentNode;
	v=parseInt(el.id.replace('modal-dialog',''));
    var c = confirm("Are you sure you want to Delete this thread? This cannot be undone.");
    if(c==true){
        if(resource_id!="Demo"){
			goog.net.XhrIo.send('/notesdeletethread',
				function(e){},
				'POST',
				'resource_id='+resource_id+'&thread_id='+v
			);
        }
    for (i in notes){
        if (notes[i].thread_id==v)var found = i;
    }
	goog.dom.removeNode(el)
    notes.splice(found,1);
    noteIndex();
    }
}

function deleteMessage(v){
	var c = confirm("Are you sure you want to delete this message? This cannot be undone.")
	if(c==true){
		var el = v;
		while(el.className!='noteMessage' && el.className!='noteMessageUnread'){el=el.parentNode}
		var msgId = el.id;
		el.style.backgroundColor='grey';
		while(el.className!='modal-dialog'){el=el.parentNode}
		var threadId = parseInt(el.id.replace('modal-dialog',''))
		goog.net.XhrIo.send('/notesdeletemessage',
			function(e){
				var r = e.target.getResponseText();
				if (r=='deleted'){
					for(i in notes){
						if(notes[i].thread_id==threadId){
							for (j in notes[i].msgs){
								if(notes[i].msgs[j].msg_id==msgId){
									notes[i].msgs.splice(j,1)
									if(notes[i].msgs.length==0){
										notes.splice(i,1);
										var el = goog.dom.getElement(msgId);
										while(el.className!='modal-dialog')el=el.parentNode;
										goog.dom.removeNode(el);
									}
									else{
										goog.dom.removeNode(goog.dom.getElement(msgId));
									}
								}
							}
						}
					}
					noteIndex();
				}
				else{
					msgId.style.backgroundColor='lightYellow';
					alert("There was a problem deleting that message. Please try again later.")
				}
			},
			'POST',
			'resource_id='+resource_id+'&thread_id='+threadId+'&msgId='+encodeURIComponent(msgId)
		);
	}
}

function bringDialogToFront(id){
	var z=0;
	var c = goog.dom.getElementsByClass('modal-dialog');
	for(i in c){
		if(c[i].nodeName=='DIV' && c[i].style.zIndex>z)z=c[i].style.zIndex*1;
	}
	if((typeof id)=='number'){var el = goog.dom.getElement('modal-dialog'+id)}
	else{var el = this}
	try{
		el.style.zIndex=z*1+1;
	}
	catch(err){};
}


function notesDialogFromScript(e){
	// This is a weird loophole to get 
	//the notesDialog going on script click
	for(i in notesPosition){
		if (notesPosition[i][0]<e.clientX && notesPosition[i][0]+fontWidth>e.clientX){
			if(notesPosition[i][1]+headerHeight+6<e.clientY && notesPosition[i][1]+lineheight+headerHeight+6>e.clientY){
				notesDialog(false, notesPosition[i][2], false, false);
				break;
			}
		}
	}
}

/**
 * if multiple notes occupy the same position, shift them arround so they are all unique
 */
function uniqueNotePositions(){
	for(i in notes){
		for(j in notes){
			if(notes[i].thread_id!=notes[j].thread_id){
				if(notes[i].row==notes[j].row && notes[i].col==notes[j].col){
					var r=notes[i].row;
					var c=notes[i].col
					var unique=false;
					while(unique==false){
						var found = false;
						for(k in notes){
							if(notes[k].row==r && notes[k].col==c)found=true;
						}
						if(!found)unique=true;
						else c--;
					}
					notes[j].col=c;
				}
			}
		}
	}
}












