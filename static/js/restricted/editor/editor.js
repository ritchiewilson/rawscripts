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

var currentPage=0;
var currentScene=1;
var ud=0;
var viewNotes=true;
var timer;

var typeToScript=true;
// shim to access this variable from outside closure
function setTypeToScript(bool){
    typeToScript = bool;
}
window['setTypeToScript'] = setTypeToScript

var findForcePaint = false;
var pasting=false;
var justPasted=false;
var undoQue = [];
window['undoQue'] = undoQue;
var redoQue = [];
window['redoQue'] = redoQue;
var pageBreaks=[];
var mouseY=0;
var mouseDownBool=false;
var scrollBarBool=false;
var scrollBarPos={x:0, y:0, w:0, h:0};
var scrollBarHover = false;
var commandDownBool=false;
var characters =[];
var scenes=[];
var canvas;
var ctx;
var linesNLB= [];
var vOffset = 0;
var pos = { col: 0, row: 0};
var anch = {col:0, row:0};
var findArr = [];
var findReplaceArr=[];
var background = '#fff';
var font = '10pt Courier';
var fontWidth = 0;
var foreground = '#000';
var lineheight = 13;
var milli = 0;
var formatMenu = false;
var formats = ['Slugline', 'Action', 'Character', 'Dialog', 'Parenthetical', 'Transition'];
var resource_id='random123456789';
var autosaveBool = true;
var updateMouseDrag=false;
var forceRepaint = true;
var timeOfLastPaint = 0;
   // Use the same wrapping procedure over and over
   // just define an array to pass into it
    //wrapVars[0]=character length before wrap
    //wrapVars[1]= distace from edge it should be placed ay
    //wrapVars[2]= bool, align right
    //wrapVars[3]= bool, uppercase
    //wrapVars[4]=number of line breaks after
    //
    //
    //
    //wrapvariablearray[0]=s
    //wrapvariablearray[1]=a
    //wrapvariablearray[2]=c
    //wrapvariablearray[3]=d
    //wrapvariablearray[4]=p
    //wrapvariablearray[5]=t
var WrapVariableArray = [[62, 111-10,0,1,2],[62,111-10,0,0,2],[40, 271-10,0,1,1],[36, 191-10,0,0,2],[30, 231-10,0,0,1],[61, 601-10,1,1,2]];

// When printing text, this distance from edge of page, in terms of
// fontWidth.
var textDistanceFromEdge = [12.625, 12.625, 32.625, 22.625, 27.625, 73.875];

var editorWidth = 850;
var editorHeight = 850;
var headerHeight=65+26;
var lines = [];
window['lines'] = lines;
	/*
	 * Notes notation
	 * notes[x] refers to thread
	 * notes[x][0], notes[x][1] is row and col
	 * notes[x][2] is content
	 * notes[x][2].length is number of messages in thread
	 * notes[x][2][0] ,[1], [2] =content, user, timestamp
     *
     *<thread>
     *  <row></row>
     *  <col></col>
     *  <content>
     *      <messageOne>
     *          <text></text>
     *          <user></user>
     *          <timestampt></timestamp>
	 *			<unread>bool</unread>
     *      </messageOne>
     *      <messageTwo>
     *          <text></text>
     *          <user></user>
     *          <timestampt></timestamp>
	 *			<unread>bool</unread>
     *      </messageTWo>
     *  </content>
     *  <id></id>
     *</thread>
     *
	 * */
var notes=[];
var spellWrong=[];
var spellIgnore=[];
var checkSpell=false;
var fMenu, eMenu, vMenu, sMenu;
var notesPosition=[];
var googSuggestMenu;
var selectionTimer;
var resizeElements=false;





/**
 * When the user drags the drawn scrollbar
 * scroll the page
 * @param {goog.events.BrowserEvent} e mouse position
 */
function scrollBarDrag(e){
	var diff = mouseY-e.clientY;
	var height = goog.dom.getElement('canvasText').height-36;
	var pagesHeight = (pageBreaks.length+1)*72*lineheight+lineheight*2;
	vOffset-=pagesHeight/height*diff;
	scroll(0);
}

/**
 * Um, scroll. This function controls the
 * scrolling. Where the canvas drawing is 
 * scrolled to is stored and contorled by 
 * vOffset. 
 * @param {number} v How many pixels to scroll
 */
function scroll(v){
	vOffset+=v;
	if (vOffset<0)vOffset=0;
	var pagesHeight = (pageBreaks.length+1)*72*lineheight-goog.dom.getElement('canvasText').height+lineheight*2;
	if(vOffset>pagesHeight)vOffset=pagesHeight;
	var d= new Date();
	milli = d.getMilliseconds();
	// if a suggest box is open, redraw it in position
	if(goog.dom.getElement('suggestBox')!=null){
		createSuggestBox((lines[pos.row].format==0 ? "s" : "c"));
	}
}


/**
 * Action handler for toobar GUI
 * @param {goog.events.Event} e 
 */
function toolbarActions(e){
	var c = e.target.getId().replace('toolbar','')
	if(c=='New')newScriptPrompt();
	else if(c=='Save')save(0);
	else if(c=='Export')exportPrompt();
	else if(c=='Undo')undo();
	else if(c=='Redo')redo();
	else if(c=='InsertNote')newThread();
	else if(c=='Spellcheck')window['spell']['launch']();
	else if(c=='Email')emailPrompt();
	else if(c.substr(0,6)=='-font-')changeFontSize(c.substr(1));
}







/**
 * Changes the format of the line of text
 * i.e. Dialog -> Action, or whatever
 * @param {number} v number for the new line format
 */
function changeFormat(v){
	// do nothing if this isn't and editor window
	if(EOV=='viewer')return;
	// remove character or scene suggest box
	if(goog.dom.getElement('suggestBox')!=null){
		goog.dom.getElement('suggestBox').parentNode.removeChild(goog.dom.getElement('suggestBox'))
	};
	// this is a change, so set up save timer
    saveTimer();
	// update the undoQue, flush redoQue
    undoQue.push(['format',pos.row,pos.col,lines[pos.row].format,v]);
    redoQue=[];
	//change format
    lines[pos.row].format=v;
	// deselect drawn text
    anch.col=pos.col;
    anch.row=pos.row;
	// handle parentheses if applicalble
    if(lines[pos.row].format==4){
        if(lines[pos.row].text.charAt(0)!='('){
            lines[pos.row].text='('+lines[pos.row].text;
            pos.col++;
            anch.col++;
        }
        if(lines[pos.row].text.charAt(lines[pos.row].text.length-1)!=')')lines[pos.row].text=lines[pos.row].text+')';
    }
    if(lines[pos.row][1]==3){
        if(lines[pos.row].text.charAt(0)=='('){
            lines[pos.row].text=lines[pos.row].text.substr(1);
            pos.col--;
            anch.col--;
        }
        if(lines[pos.row].text.charAt(lines[pos.row].text.length-1)==')')lines[pos.row].text=lines[pos.row].text.slice(0,-1);
    }
	// update scene index
    sceneIndex();
	// update select box and menus
	lineFormatGuiUpdate()
	//recalc line wraping/pagination
	var p = getLines(pos.row);
	if(p)pagination()
}
/**
 * Updates the GUI for the line format; 
 * i.e. the select menu and header menu
 * options for "Slugline", "Action",
 * "Character", "Dialoge", whatever.
 * Called whenever a change may have
 * taken place
 */
function lineFormatGuiUpdate(){
	if(EOV=='editor'){
		goog.dom.getElement('format').selectedIndex=lines[pos.row].format;
		for(i=0; i<=5; i++){
			eMenu.getChild('format'+i).setChecked((lines[pos.row].format==i ? true : false));
		}
	}
}

/**
 * Change the size of text on the canvas, and update relevant
 * GUIs. Called when user changes font size from View menu. Also
 * called on init to get things set up first time.
 *
 * @param {string} v Id of selected menu item 
 */
function changeFontSize(v){
	// these are the posbile font sizes, human readable and css
	var options = [
	['small', '10pt Courier'],
	['medium', '12pt Courier'],
	['large', '14pt Courier']
	];
	
	// loop through options and change font
	var size = v.replace('font-','');
	for(var i=0; i<options.length; i++){
		if(size==options[i][0])font=options[i][1];
	}

	//fontWidth=0 forces recalc for fontWidth and lineheight
	fontWidth=0;

	//update checks in view menu
	for(i=0; i<options.length; i++){
		var option = 'font-'+options[i][0];
		vMenu.getChild(option).setChecked((v==option ? true : false));
	}
}

/**
 * When a user makes a change to the script,
 * set up an auto save timer for 7 seconds
 */
function saveTimer(){
	if(EOV=='viewer')return;
	goog.dom.getElement('saveButton').disabled=false;
	goog.dom.getElement('saveButton').value='Save';
	checkSpell=true;
	if(autosaveBool){
		clearTimeout(timer);
		timer = setTimeout('save(1)',7000);
	}
}

function findInputKeyUp(e, w){
	if(e.which==13 && e.which!=1000){
		e.preventDefault();
		findDown();
		return;
	}
	var f = (w=="f" ? goog.dom.getElement("find_input").value : goog.dom.getElement("fr_find_input").value);
	var r = new RegExp(f.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),"gi");
	findArr=[];
	findReplaceArr=[];
	if(f.length==0){
		goog.dom.getElement('find_number_found').innerHTML="0 found"
		return;
	}
	var c = 0;
	for (i in lines){
		while (r.test(lines[i].text)==true){
			if(w=="f"){findArr.push([i*1,r.lastIndex-f.length])}
			else{findReplaceArr.push([i*1,r.lastIndex-f.length])}
		}
	}
	if(w=="f"){goog.dom.getElement('find_number_found').innerHTML=findArr.length+" found"}
}
function findDown(){
	var tmpArr= (findArr.length!=0 ? findArr : findReplaceArr)
	if (tmpArr.length==0)return;
	var l = (findArr.length!=0 ? goog.dom.getElement('find_input').value.length : goog.dom.getElement('fr_find_input').value.length);
	for(i in tmpArr){
		if (tmpArr[i][0]==pos.row && tmpArr[i][1]>pos.col){
			anch.row=pos.row=tmpArr[i][0];
			anch.col=tmpArr[i][1]*1;
			pos.col=tmpArr[i][1]*1+l*1;
			autoScroll();
			return;
		}
		if(tmpArr[i][0]*1>pos.row*1){
			anch.row=pos.row=tmpArr[i][0]*1;
			anch.col=tmpArr[i][1]*1;
			pos.col=tmpArr[i][1]*1+l*1;
			autoScroll();
			return;
		}
	}
	pos.row=anch.row=pos.col=anch.col=0;
	findDown();
}

function findUp(){
	var tmpArr= (findArr.length!=0 ? findArr : findReplaceArr)
	if (tmpArr.length==0)return;
	var l = (findArr.length!=0 ? goog.dom.getElement('find_input').value.length : goog.dom.getElement('fr_find_input').value.length);
	var i = tmpArr.length-1;
	for(var i=tmpArr.length-1;i>=0;i--){
		if (tmpArr[i][0]==pos.row && tmpArr[i][1]<pos.col-l-1){
			anch.row=pos.row=tmpArr[i][0];
			anch.col=tmpArr[i][1]*1;
			pos.col=tmpArr[i][1]*1+l*1;
			autoScroll();
			return;
		}
		if(tmpArr[i][0]*1<pos.row*1){
			anch.row=pos.row=tmpArr[i][0]*1;
			anch.col=tmpArr[i][1]*1;
			pos.col=tmpArr[i][1]*1+l*1;
			autoScroll();
			return;
		}
	}
	pos.row=anch.row=tmpArr[tmpArr.length-1][0];
	anch.col = tmpArr[tmpArr.length-1][1];
	pos.col = anch.col+l;
	autoScroll();
}


function ajaxSpell(v, r){
    // as long as spellcheck doesn't work at all, just turn it off.
    return;
	if(EOV=='viewer')return;
    checkSpell=false;
    var data = lines[v].text;
    if (lines[v].format==0 || lines[v].format==2 || lines[v].format==5){
        data=data.toUpperCase();
    }
    var words = data.split(' ');
    for (i=0; i<words.length; i++){
        var found=false;
        for (j in spellWrong){
            if (words[i].toUpperCase()==spellWrong[j][0].toUpperCase()){
                found=true;
            }
        }
        for (j in spellIgnore){
            if (words[i].toUpperCase()==spellWrong[j][0].toUpperCase()){
                found=true;
            }
        }
        if(found){
            words.splice(i,1)
            i--;
        }
    }
	i=null;
    var j = JSON.stringify(words);
	goog.net.XhrIo.send('/spellcheck',
		function(d){
			if(d.target.getResponseText()=='correct')return;
			var x=d.target.getResponseJson();
			for (i in x){
	            spellWrong.push(x[i]);
	        }
			x=i=null;
		},
		'POST',
		'data='+encodeURIComponent(j)+'&resource_id='+resource_id
	)
}


function selection(){
	//order stuff
	if(pos.row>anch.row){
		var startRange = {row:anch.row, col:anch.col};
		var endRange = {row:pos.row, col:pos.col};
	}
	else if(pos.row==anch.row && pos.col>anch.col){
		var startRange = {row:anch.row, col:anch.col};
		var endRange = {row:pos.row, col:pos.col};
	}
	else{
		var startRange = {row:pos.row, col:pos.col};
		var endRange = {row:anch.row, col:anch.col};
	}
	//figure and copy range
	if (startRange.row==endRange.row){
		var sel = lines[startRange.row].text.slice(startRange.col, endRange.col);
	}
	else{
		arr=[];
		var nl={}; //new line
		nl.text=lines[startRange.row].text.slice(startRange.col);
		nl.format=lines[startRange.row].format;
		arr.push(nl);
		startRange.row=startRange.row*1+1;
		while(startRange.row<endRange.row){
			var nl={}; //new line
			nl.text=lines[startRange.row].text;
			nl.format=lines[startRange.row].format;
			arr.push(nl);
			startRange.row+=1;
		}
		var nl={}; //new line
		nl.text=lines[endRange.row].text.slice(0,endRange.col)
		nl.format=lines[startRange.row].format;
		arr.push(nl);
		var sel=JSON.stringify(arr);
	}
	var c = goog.dom.getElement('ccp');
	c.value=sel;
	if(!findForcePaint){
		c.focus();
		c.select();
	}
}


function contextmenu(e){
	if(EOV=='viewer')return;
	if(e.clientX>headerHeight && e.clientX<editorWidth-100 && e.clientY-headerHeight>40 && e.target.id=="canvasText"){
		e.preventDefault();
		var d = document.body.appendChild(document.createElement('div'));
		d.style.position="fixed";
		d.style.top=e.clientY-3+"px";
		d.style.left=e.clientX+5+"px";
		d.id="context_menu";
		for (i in formats){
			var u = d.appendChild(document.createElement('div'));
			u.innerHTML=formats[i];
			u.id="cm"+i;
			u.className="contextUnit";
		}
	}
}



function jumpTo(v){
    if(v.target!=undefined){
		v=v.target.id;
        var e = parseInt(v.replace('row',''));
        pos.row=e;
        anch.row=pos.row;
        pos.col=lines[pos.row].text.length;
        anch.col=pos.col;
		this.style.backgroundColor="#999ccc"
    }
	autoScroll();
}

	


// Managining arrays
// calcing data
function undo(){
	if(EOV=='viewer')return;
    saveTimer();
    if (undoQue.length==0)return;
	var forceCalc = false;
    var dir = undoQue.pop();
	var tmp=[];
	for(x in dir){
		tmp.push(dir[x]);
	}
    redoQue.push(tmp);
    if(dir[0]=='enter'){
        var j = lines[dir[1]+1].text;
        lines.splice((dir[1]+1),1);
        if(lines[dir[1]].format==4 && lines[dir[1]].text.charAt(lines[dir[1]].text.length-1)==')')lines[dir[1]].text=lines[dir[1]].text.slice(0,-1);
        lines[dir[1]].text+=j;
        forceCalc=true;
    }
    else if(dir[0]=='back'){
        if(dir[3]=='line'){
            //shift notes
            for(x in notes){
                if(dir[1]==notes[x].row){
                    if (dir[2]<=notes[x].col){
                        notes[x].row=notes[x].row+1;
                        notes[x].col=notes[x].col-dir[2];
                    }
                }
                else if(dir[1]<notes[x].row)notes[x].row=notes[x].row+1;
            }
            var j = lines[dir[1]].text.slice(0,dir[2]);
            var k = lines[dir[1]].text.slice(dir[2]);
            if(dir[4]==3 && k.charAt(k.length-1)==')')k=k.slice(0,-1);
            lines[dir[1]].text = j;
            var newArr = {};
			newArr.text=k;
			newArr.format=dir[4];
            lines.splice(dir[1]+1,0,newArr);
            dir[1]=dir[1]+1;
            dir[2]=0;
            forceCalc=true;
        }
        else{
            lines[dir[1]].text = lines[dir[1]].text.slice(0,dir[2]-1) + dir[3] +lines[dir[1]].text.slice(dir[2]-1);
			if (lines[dir[1]].format==0)updateOneScene(dir[1]);
            //shift notes
            for(x in notes){
                if(dir[1]==notes[x].row){
                    if (dir[2]<=notes[x].col)notes[x].col=notes[x].col+1;
                }
            }
        }
    }
    else if(dir[0]=='delete'){
        if(dir[3]=='line'){
            var j = lines[dir[1]].text.slice(0,dir[2]);
            var k = lines[dir[1]].text.slice(dir[2]);
            if(dir[4]==3 && k.charAt(k.length-1)==')')k=k.slice(0,-1);
            lines[dir[1]].text = j;
            var newArr = {};
			newArr.text=k;
			newArr.format=dir[4];
            lines.splice(dir[1]+1,0,newArr);
            forceCalc=true;
        }
        else{
            lines[dir[1]].text = lines[dir[1]].text.slice(0,dir[2]) + dir[3] +lines[dir[1]].text.slice(dir[2]);
			if (lines[dir[1]].format==0)updateOneScene(dir[1]);
        }
    }
    else if(dir[0]=='format'){
        lines[dir[1]].format=dir[3];
        if(lines[dir[1]].text.charAt(0)=='(')lines[dir[1]].text=lines[dir[1]].text.substr(1);
        if(lines[dir[1]].text.charAt(lines[dir[1]].text.length-1)==')')lines[dir[1]].text=lines[dir[1]].text.slice(0,-1);
		forceCalc = true;
    }
    else if(dir[0]=='br' || dir[0]=="dr"){
        var n=dir[1];
        for(var i=0; i<n; i++){
            var dir = undoQue.pop();
			tmp=[];
			for(x in dir){
				tmp.push(dir[x]);
			}
            redoQue.splice(redoQue.length-1,0,tmp);
            if(dir[3]=='line'){
                var j = lines[dir[1]].text.slice(0,dir[2]);
                var k = lines[dir[1]].text.slice(dir[2]);
                if(dir[4]==3 && k.charAt(k.length-1)==')')k=k.slice(0,-1);
                lines[dir[1]][0] = j;
                var newArr = {};
				newArr.text=k;
				newArr.format=dir[4];
                lines.splice(dir[1]+1,0,newArr);
                dir[1]=dir[1]+1;
                dir[2]=0;
                forceCalc=true;
            }
            else{
                lines[dir[1]].text = lines[dir[1]].text.slice(0,dir[2]-1) + dir[3] +lines[dir[1]].text.slice(dir[2]-1);
				if (lines[dir[1]].format==0)updateOneScene(dir[1]);
            }
        }
    }
    else if(dir[0]=='paste'){
        // if string and not json
        if(dir[3][0]!='[' && dir[3][1]!='['){
            lines[dir[1]].text=lines[dir[1]].text.slice(0, dir[2])+lines[dir[1]].text.slice(dir[2]+dir[3].length);
			if (lines[dir[1]].format==0)updateOneScene(dir[1]);
        }
        // if json
        else{
			forceCalc = true
            var d=JSON.parse(dir[3]);
            //if did not text to first line at paste
            if(dir[4]==0){
                lines.splice(dir[1]+1,d.length);
                //if deleted extra blank line from bad programing
                if(dir[5]==1){
                    lines[dir[1]].text=lines[dir[1]].text+lines[dir[1]+1].text;
                    lines.splice(dir[1]+1,1);
                }
            }
            //iff added text to first line at paste
            else{
                lines[dir[1]].text=lines[dir[1]].text.slice(0,dir[2]);
                lines.splice(dir[1]+1,d.length-1);
                //if deleted extra blank line from bad programing
                if(dir[5]==1){
                    lines[dir[1]].text=lines[dir[1]].text+lines[dir[1]+1].text;
                    lines.splice(dir[1]+1,1);
                }
            }
            
        }
    }
    else{
        lines[dir[1]].text = lines[dir[1]].text.slice(0,dir[2])+lines[dir[1]].text.slice(dir[2]+1);
        if(lines[dir[1]].format==4 && lines[dir[1]].text[dir[2]-1]==')'){
            lines[dir[1]].text = lines[dir[1]].text.slice(0,dir[2])+lines[dir[1]].text.slice(dir[2]+1);
            dir[2]=dir[2]-1;
        }
		if (lines[dir[1]].format==0)updateOneScene(dir[1]);
        //shift notes
        for(x in notes){
            if(dir[1]==notes[x].row){
                if (dir[2]<notes[x].col[1])notes[x].col=notes[x].col-1;
            }
        }
    }
    pos.row=dir[1];
    pos.col=dir[2];
    anch.row = pos.row;
    anch.col=pos.col;
	linesNLB=[];
	for(var i=0;i<lines.length;i++){
		getLines(i);
	}
	sceneIndex();
	pagination();
	scroll(0);
}
function redo(){
	if(EOV=='viewer')return;
    saveTimer();
    if (redoQue.length==0)return;
	var forceCalc=false;
    var dir = redoQue.pop();
	var tmp =[];
	for (x in dir){
		tmp.push(dir[x]);
	}
    undoQue.push(tmp);
    var forceCalc=false;
    if(dir[0]=='enter'){
        var j = lines[dir[1]].text.slice(0,dir[2]);
        var k = lines[dir[1]].text.slice(dir[2]);
        lines[dir[1]].text = j;
        if (lines[dir[1]].format == 0)var newElem = 1;
        else if (lines[dir[1]].format == 1)var newElem = 2;
        else if (lines[dir[1]].format == 2)var newElem = 3;
        else if (lines[dir[1]].format == 4)var newElem = 3;
        else if (lines[dir[1]].format == 3)var newElem = 2;
        else if (lines[dir[1]].format == 5)var newElem = 0;
        var newArr = {};
		newArr.text=k;
		newArr.format=newElem;
        lines.splice(dir[1]+1,0,newArr);
		dir[1]=dir[1]+1;
		dir[2]=0;
		forceCalc=true;
    }
    else if(dir[0]=='back'){
        if(dir[3]!='line'){
            lines[dir[1]].text = lines[dir[1]].text.slice(0,dir[2]-1)+lines[dir[1]].text.slice(dir[2]);
            dir[2]=dir[2]-1;
			if (lines[dir[1]].format==0)updateOneScene(dir[1]);
        }
        else{
            var j = lines[dir[1]+1].text;
            lines.splice(dir[1]+1,1);
            lines[dir[1]].text = lines[dir[1]].text+j;
			forceCalc=true;
        }
    }
    else if(dir[0]=='delete'){
		if(dir[3]!='line'){
			lines[dir[1]].text = lines[dir[1]].text.slice(0,dir[2])+lines[dir[1]].text.slice(dir[2]+1);
			if (lines[dir[1]].format==0)updateOneScene(dir[1]);
		}
		else{
			var j =lines[dir[1]+1].text;
			lines.splice(dir[1]+1,1);
			lines[dir[1]].text=lines[dir[1]].text+j;
		}
    }
    else if(dir[0]=='format'){
		if (dir[4]!='tab'){
			lines[dir[1]].format=dir[4];
		}
		else{
			var j = dir[3];
			if (j==0) lines[dir[1]].format=2;
			else if(j==1)lines[dir[1]].format=0;
			else if(j==2)lines[dir[1]].format=1;
			else if(j==3)lines[dir[1]].format=4;
			else if(j==4)lines[dir[1]].format=3;
			else if(j==5)lines[dir[1]].format=0;
		}
		forceCalc=true;
    }
    else if(dir[0]=='br'){
		var n=dir[1];
        for(var i=0; i<n; i++){
            var dir = redoQue.pop();
			tmp=[];
			for(x in dir){
				tmp.push(dir[x]);
			}
            undoQue.splice(undoQue.length-1,0,tmp);
            if(dir[3]=='line'){
				var j=lines[dir[1]+1].text;
				lines.splice(dir[1]+1,1);
				lines[dir[1]].text=lines[dir[1]].text+j;
				forceCalc=true;
			}
			else{
				lines[dir[1]].text=lines[dir[1]].text.slice(0,dir[2]-1)+lines[dir[1]].text.slice(dir[2]);
				if (lines[dir[1]].format==0)updateOneScene(dir[1]);
			}
		}
		dir[2]=dir[2]-1;
    }
    else if(dir[0]=='dr'){
		var n=dir[1];
        for(var i=0; i<n; i++){
            var dir = redoQue.pop();
			tmp=[];
			for(x in dir){
				tmp.push(dir[x]);
			}
            undoQue.splice(undoQue.length-1,0,tmp);
            if(dir[3]=='line'){
				var j=lines[dir[1]+1].text;
				lines.splice(dir[1]+1,1);
				lines[dir[1]].text=lines[dir[1]].text+j;
				forceCalc=true;
			}
			else{
				lines[dir[1]].text=lines[dir[1]].text.slice(0,dir[2]-1)+lines[dir[1]].text.slice(dir[2]);
				if (lines[dir[1]].format==0)updateOneScene(dir[1]);
			}
		}
		dir[2]=dir[2]-1;
    }
    else if(dir[0]=='paste'){
        //for single line, no json
        if(dir[3][0]!='[' && dir[3][1]!='['){
            lines[dir[1]].text=lines[dir[1]].text.slice(0, dir[2])+dir[3]+lines[dir[1]].text.slice(dir[2]);
			if (lines[dir[1]].format==0)updateOneScene(dir[1]);
        }
        //for json
        else{
			forceCalc=true;
            var arr=JSON.parse(dir[3]);
            if (lines[dir[1]].text==''){
                lines[dir[1]].format=arr[0].format;
            }
            if (lines[dir[1]].format==arr[0].format){
                var tmp={};
				tmp.text=lines[dir[1]].text.slice(dir[2]);
				tmp.format=lines[dir[1]].format;
                lines[dir[1]].text=lines[dir[1]].text.slice(0,dir[2])+arr[0].text;
                var i=1;
                var p=dir[1]+1;
                while(i<arr.length){
					var nl={} //new line to insert
					nl.text=arr[i].text;
					nl.format=arr[i].format;
                    lines.splice(p,0,nl);
                    p++;
                    i++;
                }
                lines.splice(p,0,tmp);
                if(lines[p].text=='' || lines[p].text==' '){
                    lines.splice(p,1);
                }
            }
            else{
                var tmp={};
				tmp.text=lines[dir[1]].text.slice(dir[2]);
				tmp.format=lines[dir[1]].format;
                lines[dir[1]].text=lines[dir[1]].text.slice(0,dir[2]);
                dir[1]++;
				var nl={} //new line to insert
				nl.text=arr[0].text;
				nl.format=arr[0].format;
                lines.splice(dir[1],0,nl);
                var i=1;
                var p=dir[1]+1;
                while(i<arr.length){
					var nl={} //new line to insert
					nl.text=arr[i].text;
					nl.format=arr[i].format;
                    lines.splice(p,0,nl);
                    p++;
                    i++;
                }
                lines.splice(p,0,tmp);
                if(lines[p].text=='' || lines[p].text==' '){
                    lines.splice(p,1);
                }
            }
        }
        
    }
    else{
        lines[dir[1]].text = lines[dir[1]].text.slice(0,dir[2]) + dir[0] +lines[dir[1]].text.slice(dir[2]);
        dir[2]=dir[2]+1;
		if (lines[dir[1]].format==0)updateOneScene(dir[1]);
    }
	linesNLB=[]
	for(var i=0;i<lines.length;i++){
		getLines(i);
	}
	if(pos.row>=lines.length)pos.row=anch.row=lines.length-1;
	if(pos.col>=lines[lines.length-1].text.length)pos.col=anch.col=lines[lines.length-1].text.length;
	pagination();
	sceneIndex();
	scroll(0);
}

/**
 * select all text on canvas
 */
function selectAll(){
	anch.col=anch.row=0;
	pos.row=lines.length-1;
	pos.col=lines[pos.row].text.length;
	selection();
}




function characterInit(){
	for(var i=0; i<lines.length;i++){
		if (lines[i].format==2){
			characterIndex(lines[i].text);
		}
	}
}
function characterIndex(v){
	var chara = v.toUpperCase().replace(/\s+$/,"");
	var found=false;
	for(var i=0;i<characters.length;i++){
		if(characters[i][0]==chara){
			characters[i][1]=characters[i][1]+1;
			found=true;
		}
	}
	if (!found){
		characters.push([chara,1]);
	}
}
function sceneIndex(){
    scenes=[];
    var num = 0;
    for (var i=0; i<lines.length; i++){
        if(lines[i].format==0){
            num++;
			var tooltip="";
			if (i!=lines.length-1){
				tooltip=lines[i+1].text;
				if((lines[i+1].format==2 || lines[i+1].format==5) && i!=lines.length-2){
					tooltip+=" "+lines[i+2].text;
				}
				
			}
            scenes.push([String(num)+') '+lines[i].text.toUpperCase(), i, tooltip]);
			tooltip=null;
        }
    }
    goog.dom.removeChildren(goog.dom.getElement('sceneBox'));
    for (var i=0; i<scenes.length; i++){
        var elem = goog.dom.getElement('sceneBox').appendChild(document.createElement('p'))
        elem.appendChild(document.createTextNode(scenes[i][0]));
        elem.className='sceneItem';
        elem.id="row"+scenes[i][1];
		elem.title=scenes[i][2];
		goog.events.listen(elem, goog.events.EventType.CLICK, jumpTo);
		goog.events.listen(elem, goog.events.EventType.MOUSEOVER, function(e){this.style.backgroundColor="#ccccff"});
		goog.events.listen(elem, goog.events.EventType.MOUSEOUT, function(e){this.style.backgroundColor="white"});
    }
}
function updateOneScene(v){
	try{
		var d = goog.dom.getElement("row"+v);	
		var num = d.innerHTML.split(")")[0];
		d.removeChild(d.firstChild);
		d.appendChild(document.createTextNode(num+") "+lines[v].text.toUpperCase()));
	}
	catch(e){};
}





//menu options and stuff
// closing the window
function closeScript(){
	clearTimeout(timer);
	if(resource_id=='Demo' || EOV=='viewer'){
		self.close()
	}
	var arr=[]
	for(x in lines){
		arr.push([lines[x].text,lines[x].format])
	}
	var data=JSON.stringify(arr);
	goog.dom.getElement('saveButton').value='Saving...';
	goog.net.XhrIo.send('/save', function(d){
		self.close();
		},
		'POST',
		"data="+encodeURIComponent(data)+"&resource_id="+resource_id+"&autosave=0"
	);
	var arr = []
	for (i in notes){
		arr.push([notes[i].row, notes[i].col, notes[i].thread_id])
	}
	if(arr.length!=0){
		goog.net.XhrIo.send('/notesposition', 
			function(d){},
			'POST',
			"positions="+encodeURIComponent(JSON.stringify(arr))+"&resource_id="+resource_id
		);
	}
}
// new script
function newScriptPrompt(){
    if(checkIfDemo())return;
    typeToScript=false;
	goog.dom.getElement('newscriptpopup').style.visibility = 'visible';
	goog.dom.getElement('newScript').value = "Untitled Screenplay";
	goog.dom.getElement('newScript').focus();
	goog.dom.getElement('newScript').select();
}

function hideNewScriptPrompt(){
    typeToScript=true;
	goog.dom.getElement('newScript').value = "";
	goog.dom.getElement('newscriptpopup').style.visibility = 'hidden';
	goog.dom.getElement('createScriptButton').disabled=false;
	goog.dom.getElement('createScriptButton').value="Create";
	goog.dom.getElement('createScriptIcon').style.visibility="hidden";
}

function createScript (){
	var filename = goog.dom.getElement('newScript').value;
	if (filename!=''){
		goog.dom.getElement('createScriptButton').disabled=true;
		goog.dom.getElement('createScriptButton').value="Creating Script...";
		goog.dom.getElement('createScriptIcon').style.visibility="visible";
		goog.net.XhrIo.send('/newscript',
			function(e){
				window.open('editor?resource_id='+e.target.getResponseText());
				hideNewScriptPrompt();
			},
			'POST',
			'filename='+encodeURIComponent(filename)+'&fromPage=editor'
		);
	}
}
// duplicate
function duplicate(){
    if(checkIfDemo())return;
	if(EOV=='viewer')return;
	goog.net.XhrIo.send('/duplicate',
		function(e){
			if(e.target.getResponseText()=='fail')return;
			else{window.open(e.target.getResponseText())}
		},
		'POST',
		'fromPage=editor&resource_id='+resource_id
	)
}
// save
goog.events.listen(goog.dom.getElement('saveError'), goog.events.EventType.CLICK, function(e){
	var n = new goog.fx.dom.FadeOut(goog.dom.getElement('saveError'), 500);
	goog.events.listen(n, goog.fx.Animation.EventType.END, function(e){
		goog.dom.getElement('saveError').style.display='none';
		goog.dom.getElement('saveError').style.opacity='100'
		
	})
	n.play()
});
function save(v){
	if(EOV=='viewer')return;
    clearTimeout(timer);
    if(resource_id=='Demo'){
        if(v==0){
            alert("Sorry, but you'll have to login to start saving scripts!");
        }
        return;
    }
    window["screenplay"]["save"](v);
    var arr = []
    for (i in notes){
        arr.push([notes[i].row, notes[i].col, notes[i].thread_id])
    }
    if(arr.length!=0){
		goog.net.XhrIo.send('/notesposition', 
			function(d){},
			'POST',
			"positions="+encodeURIComponent(JSON.stringify(arr))+"&resource_id="+resource_id
		);
    }
}
// open other script
function openPrompt(){
    if(checkIfDemo())return;
    window.open("/scriptlist")
}

/**
 * Open the title page editor in a new window.
 */
function editTitlePage(){
    window.open('/titlepage?resource_id='+resource_id);
}

/**
 * Open revision history in a new window
 */
function revisionHistoryPage(){
    if(checkIfDemo())return;
    window.open('/revisionhistory?resource_id='+resource_id);
}

//rename
function renamePrompt(){
	if(EOV=='viewer')return;
    typeToScript=false;
    goog.dom.getElement('renameTitle').innerHTML = "Rename: " + goog.dom.getElement('title').innerHTML;
    goog.dom.getElement('renameField').value = goog.dom.getElement('title').innerHTML;
    goog.dom.getElement('renamepopup').style.visibility = 'visible';
}

function hideRenamePrompt(){
	if(EOV=='viewer')return;
	goog.dom.getElement('renameField').value = "";
	goog.dom.getElement('renamepopup').style.visibility = 'hidden';
    typeToScript=true;
}
	
function renameScript(){
	if(EOV=='viewer')return;
	if(resource_id=="Demo"){
        alert("Sorry, you'll have to login to do that.");
        return;
    }
	var rename = goog.dom.getElement('renameField').value;
	if (rename==""){return;}
	goog.dom.getElement('title').innerHTML = rename;
	document.title = rename;
	goog.net.XhrIo.send('/rename', 
		function(d){},
		'POST',
		"fromPage=scriptlist&resource_id="+resource_id+"&rename="+rename
	);
	hideRenamePrompt()
}
//exporting
function exportPrompt(){
	if(resource_id!="Demo"){
        if(goog.dom.getElement('saveButton').value=="Save")save(0);
    }
    typeToScript=false;
    goog.dom.getElement("exportpopup").style.visibility="visible"
}
function hideExportPrompt(){
    typeToScript=true;
    goog.dom.getElement("exportpopup").style.visibility="hidden";
}
function exportScripts(){
    if(resource_id=="Demo"){
        alert("Sorry, you'll have to login to export scripts.");
        return;
    }
    else{
        var d;
        var title="&title_page="+goog.dom.getElement('et').selectedIndex;
        var a=document.getElementsByTagName("input");
        for(var c=0;c<a.length;c++){
            if(a[c].checked==true){
                if(a[c].className=="exportList"){
                    d=a[c].name;
                    b="/export?resource_id="+resource_id+"&export_format="+d+"&fromPage=editor"+title;
                    window.open(b)
                }
            }
        }
		d=title=a=c=null;
    }
}
// emailing
function emailPrompt(){
    if(checkIfDemo())return;
    if(goog.dom.getElement('saveButton').value=="Save")save(0);
    typeToScript=false;
    goog.dom.getElement("emailpopup").style.visibility='visible'
}
function hideEmailPrompt(){
    goog.dom.getElement("emailpopup").style.visibility='hidden';
    goog.dom.getElement('recipient').value='';
    goog.dom.getElement('message').innerHTML='';
    typeToScript=true;
}

function emailComplete(e){
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
	var body_message = goog.dom.getElement('message').innerHTML;
	var title_page = goog.dom.getElement('emailTitle').selectedIndex;
	goog.net.XhrIo.send('/emailscript', 
		emailComplete,
		'POST',
		"resource_id="+resource_id+"&recipients="+recipients+"&subject="+subject+"&body_message="+encodeURIComponent(body_message)+"&fromPage=editor&title_page="+title_page
	);
	goog.dom.getElement('emailS').disabled = true;
	goog.dom.getElement('emailS').value = 'Sending...';
	c=arr=recipients=subject=body_message=null;
}

//Sharing scripts
function sharePrompt(){
    if(checkIfDemo())return;
	if(EOV=='viewer')return;
	typeToScript=false;
    goog.dom.getElement("sharepopup").style.visibility="visible";
	goog.dom.getElement('email_notify_share').checked=true;
	goog.dom.getElement('email_notify_msg').checked = false;
	goog.dom.getElement('email_notify_msg').disabled = false;
	goog.dom.getElement('share_message').style.display='none';
}
function hideSharePrompt(){
	if(EOV=='viewer')return;
    typeToScript=true;
    goog.dom.getElement("sharepopup").style.visibility="hidden";
    goog.dom.getElement("collaborator").value="";
}
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
function emailNotifyMsg(e){
	var el = goog.dom.getElement('share_message');
	if (e.checked==true){
		el.style.display='block'
	}
	else{
		el.style.display='none'
	}
}
function removeAccess(v){
	if(EOV=='viewer')return;
    var c = confirm("Are you sure you want to remove access for this user?");
    if(c==true){
        var c = goog.dom.getElement(v);
        c.style.backgroundColor="#ccc";
		goog.net.XhrIo.send('/removeaccess', function(d){
			var id = d.target.getResponseText();
	        goog.dom.removeNode(goog.dom.getElement(id))},
			'POST',
			"removePerson="+encodeURIComponent(v)+"&resource_id="+resource_id+"&autosave="+v
		);
    }
	c=null;
}

function shareScript(){
	if(EOV=='viewer')return;
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
	var sendEmail = (goog.dom.getElement('email_notify_share').checked==true ? 'y' : 'n');
	var addMsg = (goog.dom.getElement('email_notify_msg').checked==true ? 'y' : 'n');
	var msg = ((sendEmail=='y' && addMsg=='y') ? encodeURIComponent(goog.dom.getElement('share_message').innerHTML) : 'n');
	goog.net.XhrIo.send('/share',
		function(d){
			goog.dom.getElement('email_notify_share').checked=true;
			goog.dom.getElement('email_notify_msg').checked=false;
			goog.dom.getElement('email_notify_msg').disabled=false;
			goog.dom.getElement('share_message').innerHTML = "";
			goog.dom.getElement('share_message').style.display='none';
			var people = d.target.getResponseText().split(",");
	        var c=goog.dom.getElement('hasAccess');
	        for(i in people){
				if(people[i]!="" && people[i]!=="not sent"){
		            var TR = c.appendChild(document.createElement("tr"));
		            TR.id = people[i];
		            TR.appendChild(document.createElement("td")).appendChild(document.createTextNode(people[i]));
		            var newA = TR.appendChild(document.createElement("td")).appendChild(document.createElement("a"));
		            newA.appendChild(document.createTextNode("Remove Access"));
		            newA.href="javascript:removeAccess('"+people[i]+"')";
				}
	        }
	        goog.dom.getElement('shareS').disabled = false;
	        goog.dom.getElement('shareS').value = "Send Invitations";
		},
		'POST',
		'resource_id='+resource_id+'&collaborators='+encodeURIComponent(collaborators)+'&fromPage=editor&sendEmail='+sendEmail+'&addMsg='+addMsg+'&msg='+msg	
	)
	goog.dom.getElement('shareS').disabled = true;
	goog.dom.getElement('shareS').value = "Sending Invites...";
}
//tag
function tagPrompt(){
    if(checkIfDemo())return;
	if(EOV=='viewer')return;
	save(0);
	var t = prompt("Leave a tag for this version:");
	if (t!=null && t!=""){
		goog.net.XhrIo.send('/revisiontag',
			function(d){
				if(d.target.getResponseText()!='tagged'){
					alert("There was a problem tagging this script. Please try again later.")
				}
			},
			'POST',
			'resource_id='+resource_id+'&version=latest&tag='+encodeURIComponent(t)
		)
	}
}
// find prompts and stuff
function findPrompt(){
	hideFindReplacePrompt();
	if(goog.dom.getElement('find_div').style.display=="block")findInputKeyUp({"which":1000}, "f");
	typeToScript=false;
	findForcePaint=true;
	goog.dom.getElement('find_div').style.display="block";
	goog.dom.getElement('find_input').select();
	goog.dom.getElement('find_input').focus();
}
function hideFindPrompt(){
	typeToScript=true;
	findForcePaint=false;
	findArr=[];
	goog.dom.getElement('find_div').style.display="none";
	commandDownBool=false;
}
// Find Replace Prompt
function findReplacePrompt(){
	hideFindPrompt();
	if(goog.dom.getElement('find_replace_div').style.display=="block")findInputKeyUp({"which":1000}, "r");
	typeToScript=false;
	findForcePaint=true;
	goog.dom.getElement('find_replace_div').style.display="block";
	goog.dom.getElement('fr_find_input').select();
	goog.dom.getElement('fr_find_input').focus();
}
function hideFindReplacePrompt(){
	typeToScript=true;
	findForcePaint=false;
	findReplaceArr=[];
	goog.dom.getElement('find_replace_div').style.display="none";
	commandDownBool=false;
}
function replaceText(){
	if(EOV=='viewer')return;
	var d = goog.dom.getElement('fr_replace_input').value;
	if(d.length==0)return;
	if(pos.row==anch.row && pos.col==anch.col)return;
	if(pos.row!=anch.row)return;
	if(findReplaceArr.length==0)return;
	goog.dom.getElement('ccp').value=d;
	paste();
	anch.col=pos.col-d.length;
	if(goog.dom.getElement('find_replace_div').style.display=="block")findInputKeyUp({"which":1000}, "r");
	//backspace();
}
function replaceAndFind(){
	if(EOV=='viewer')return;
	replaceText();
	findDown();
}


function sortNumbers(a,b){
    return a - b;
};
