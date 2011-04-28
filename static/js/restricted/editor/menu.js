function topMenuOver(e){
	var v = e.target.id
	var arr = [['file', fMenu],['edit', eMenu],['view', vMenu],['share', sMenu]];
    var open='not open';
	for(i in arr){
		var d = goog.dom.getElement(arr[i][0]);
		d.style.backgroundColor='#A2BAE9';
        d.style.color='black';
		if(arr[i][1].isVisible())open=i;
		if(v==arr[i][0]){
			var t = arr[i][1];
			var d = goog.dom.getElement(t.id_.replace("Menu",""));
			d.style.backgroundColor='#6484df';
	        d.style.color='white';
		}
	}
	if(open!='not open'){
		arr[open][1].setVisible(false);
		t.setVisible(true)
	}
	open=i=null;
}

function topMenuOut(e){
	var v = e.target.id;
    if(goog.dom.getElement(v+'Menu').style.display=='none'){
        goog.dom.getElement(v).style.backgroundColor='#A2BAE9';
        goog.dom.getElement(v).style.color='black';
    }
}

function menuSelect(e){
	var id=e.target.getId();
	if(id=='save')save(0);
    else if(id=='new'){
        if(resource_id=="Demo"){
            alert("Sorry, you'll have to login to start saving.");
        }
        else {newScriptPrompt();}
    }
    else if(id=='open'){
        if(resource_id=="Demo"){
            alert("Sorry, you'll have to login to open new scripts.");
        }
        else{openPrompt();}
    }
    else if(id=='rename')renamePrompt();
    else if(id=='exportas')exportPrompt();
    else if(id=='duplicate'){
        if(resource_id=="Demo"){
            alert("Sorry, you'll have to login to start doing that.");
            return;
        }
        else{duplicate();}
    }
    else if(id=='close')closeScript();
    //Edit
    else if(id=='undo')undo();
    else if(id=='redo')redo();
    else if(id=='insertNote'){
        viewNotes=true;
        newThread();
    }
    else if(id=='editTitlePage')window.open('/titlepage?resource_id='+resource_id);
	else if(id=='tag'){
		if(resource_id=="Demo"){
            alert("Sorry, you'll have to login to start doing that.");
            return;
        }
		else{tagPrompt();}
	}
    else if(id=='spellCheck')launchSpellCheck();
	else if(id=='find')findPrompt();
	else if(id=='findReplace')findReplacePrompt();
	else if(id=='selectAll')selectAll();
    //View
    else if(id=='revision'){
        if(resource_id=="Demo"){
            alert("Sorry, you'll have to login to start doing that.");
            return;
        }
        else{window.open('/revisionhistory?resource_id='+resource_id);}
    }
    else if(id=='notes'){
        viewNotes = (viewNotes ? false : true);
    }
	else if(id.substr(0,6)=='format'){
		changeFormat(parseInt(id.replace('format','')))
	}
    //Share
    else if(id=='collaborators'){
        if(resource_id=="Demo"){
            alert("Sorry, you'll have to login to start doing that.");
            return;
        }
        else{sharePrompt();}
    }
    else if(id=='email'){
        if(resource_id=="Demo"){
            alert("Sorry, you'll have to login to email scripts.");
            return;
        }
        else{emailPrompt();}
    }
	fMenu.setVisible(false)
	eMenu.setVisible(false)
	vMenu.setVisible(false)
	sMenu.setVisible(false)
	var arr=["file",'edit','view','share'];
	for(i in arr){
		var d = goog.dom.getElement(arr[i])
		d.style.backgroundColor='#A2BAE9';
        d.style.color='black';
	}
}

//Menu
// function to hand the file like menu

function openMenu(e){
	var v = e.target.id;
	var arr = [['file', fMenu],['edit', eMenu],['view', vMenu],['share', sMenu]];
    goog.dom.getElement(v).style.backgroundColor='#6484df';
    goog.dom.getElement(v).style.color='white';
    var open = 'notfound';
	var t=0;
	for (i in arr){
		if(arr[i][1].isVisible()==true){
			open=i;
			arr[open][1].setVisible(false);
		}
		if(v==arr[i][0]){t=arr[i][1];}
	}
	if (open=='notfound'){
		t.setVisible(true)
	}
	else if(arr[open][1]==t){
		t.setVisible(false)
	}
	else{
		arr[open][1].setVisible(false);
		t.setVisible(true)
	}
}