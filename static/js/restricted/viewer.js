goog.require('goog.userAgent')
goog.require('goog.events')
goog.require('goog.dom');
goog.require('goog.dom.DomHelper');
goog.require('goog.events.EventType');
goog.require('goog.math.Size');
goog.require('goog.style');
goog.require('goog.dom.ViewportSizeMonitor')
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('goog.ui.Menu');
goog.require('goog.ui.Container');
goog.require('goog.net.XhrIo');
goog.require('goog.ui.Toolbar');
goog.require('goog.ui.ToolbarRenderer');
goog.require('goog.ui.ToolbarButton');
goog.require('goog.ui.ToolbarMenuButton');
goog.require('goog.ui.ToolbarSelect');
goog.require('goog.ui.ToolbarSeparator');
goog.require('goog.ui.ToolbarToggleButton');
goog.require('goog.array');
goog.require('goog.ui.Button');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Component.State');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.Option');
goog.require('goog.ui.SelectionModel');
goog.require('goog.ui.Separator');
goog.require('goog.ui.ButtonRenderer');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.CustomButtonRenderer');
goog.require('goog.debug.DivConsole');
goog.require('goog.debug.Logger');
goog.require('goog.debug.LogManager');
goog.require('goog.object');
goog.require('goog.ui.AutoComplete.Basic');
goog.require('goog.format.EmailAddress');
goog.require('goog.fx');
goog.require('goog.fx.dom');
/**
 * @license Rawscripts.com copywrite 2010
 *
 *
 *
 */
window['newThread'] = newThread;
window['tabs'] = tabs;
window['exportScripts'] = exportScripts;
window['hideExportPrompt'] = hideExportPrompt;
window['hideNewScriptPrompt'] = hideNewScriptPrompt;
window['createScript'] = createScript;
window['hideFindPrompt'] = hideFindPrompt;
window['findUp'] = findUp;
window['findDown'] = findDown;
window['hideEmailPrompt'] = hideEmailPrompt;
window['emailScript'] = emailScript;
window['paint'] = paint;
window['init'] = init;
var currentPage=0;
var currentScene=1;
var ud=0;
var viewNotes=true;
var timer;
var typeToScript=true;
var findForcePaint = false;
var pasting=false;
var justPasted=false;
var undoQue = [];
var redoQue = [];
var pageBreaks=[];
var mouseY=0;
var mouseDownBool=false;
var scrollBarBool=false;
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
var fontWidth = 8;
var foreground = '#000';
var lineheight = 13;
var milli = 0;
var formatMenu = false;
var formats = ['Slugline', 'Action', 'Character', 'Dialog', 'Parenthetical', 'Transition'];
var resource_id='random123456789';
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
    
    //if ($.browser.mozilla)fontWidth=9;
var editorWidth = 850;
var headerHeight=65+26;
var lines = [];
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
     *      </messageOne>
     *      <messageTwo>
     *          <text></text>
     *          <user></user>
     *          <timestampt></timestamp>
     *      </messageTWo>
     *  </content>
     *  <id></id>
     *</thread>
     *
	 * */
	//var notes = [[1,2,[["message from ritchie and stuff and ore thigs and words","ritchie","timestamp"],["response","kristen","newTimestamp"]],123456789],[1,100,[["Second message and stuffmessage from ritchie and stuff and ore thigs and words","ritchie","timestamp"],["response","kristen","newTimestamp"]],123456709]];
notes=[];
var spellWrong=[];
var spellIgnore=[];
var checkSpell=false;
var fMenu, eMenu, vMenu, sMenu;
    
function init(){
	setElementSizes("i");
	var MouseWheelHandler = goog.events.MouseWheelHandler;
	var MOUSEWHEEL = MouseWheelHandler.EventType.MOUSEWHEEL;
    var mwh = new MouseWheelHandler(document.getElementById('canvas'));
	goog.events.listen(mwh, MOUSEWHEEL, handleMouseWheel);
	goog.events.listen(window, 'unload', function(e) {
	goog.events.unlisten(mwh, MOUSEWHEEL, handleMouseWheel);});
	goog.events.listen(goog.dom.getElement('find_input'), goog.events.EventType.KEYDOWN, function(e){if(e.keyCode==13){e.preventDefault();findDown()}});
    goog.events.listen(goog.dom.getElement('subject'), goog.events.EventType.KEYDOWN, function(e){if(e.keyCode==13)e.preventDefault()});
	goog.events.listen(goog.dom.getElement('find_input'), goog.events.EventType.FOCUS, function(e){
		typeToScript=false;
		findForcePaint=true;
		commandDownBool=false
	});
	goog.events.listen(goog.dom.getElement('find_input'), goog.events.EventType.BLUR, function(e){
		typeToScript=true;
		findForcePaint=false;
		commandDownBool=false
	});
	goog.events.listen(goog.dom.getElement('find_input'), goog.events.EventType.KEYUP, function(e){findInputKeyUp(e, "f")})
	fMenu = new goog.ui.Menu();
	fMenu.decorate(goog.dom.getElement('fileMenu'))
	fMenu.setPosition(0, 64)
	fMenu.setAllowAutoFocus(true);
	fMenu.setVisible(false);
	goog.events.listen(goog.dom.getElement('file'), goog.events.EventType.CLICK, openMenu);
	goog.events.listen(goog.dom.getElement('file'), goog.events.EventType.MOUSEOVER, topMenuOver);
	goog.events.listen(goog.dom.getElement('file'), goog.events.EventType.MOUSEOUT, topMenuOut);
	goog.events.listen(fMenu, 'action', menuSelect)
	
	eMenu = new goog.ui.Menu();
	eMenu.decorate(goog.dom.getElement('editMenu'))
	eMenu.setPosition(35, 64)
	eMenu.setAllowAutoFocus(true);
	eMenu.setVisible(false);
	goog.events.listen(goog.dom.getElement('edit'), goog.events.EventType.CLICK, openMenu);
	goog.events.listen(goog.dom.getElement('edit'), goog.events.EventType.MOUSEOVER, topMenuOver);
	goog.events.listen(goog.dom.getElement('edit'), goog.events.EventType.MOUSEOUT, topMenuOut);
	goog.events.listen(eMenu, 'action', menuSelect)
	
	vMenu = new goog.ui.Menu();
	vMenu.decorate(goog.dom.getElement('viewMenu'))
	vMenu.setPosition(72, 64)
	vMenu.setAllowAutoFocus(true);
	vMenu.setVisible(false);
	goog.events.listen(goog.dom.getElement('view'), goog.events.EventType.CLICK, openMenu);
	goog.events.listen(goog.dom.getElement('view'), goog.events.EventType.MOUSEOVER, topMenuOver);
	goog.events.listen(goog.dom.getElement('view'), goog.events.EventType.MOUSEOUT, topMenuOut);
	goog.events.listen(vMenu, 'action', menuSelect)
	
	sMenu = new goog.ui.Menu();
	sMenu.decorate(goog.dom.getElement('shareMenu'))
	sMenu.setPosition(113, 64)
	sMenu.setAllowAutoFocus(true);
	sMenu.setVisible(false);
	goog.events.listen(goog.dom.getElement('share'), goog.events.EventType.CLICK, openMenu);
	goog.events.listen(goog.dom.getElement('share'), goog.events.EventType.MOUSEOVER, topMenuOver);
	goog.events.listen(goog.dom.getElement('share'), goog.events.EventType.MOUSEOUT, topMenuOut);
	goog.events.listen(sMenu, 'action', menuSelect)
	
	
	var sKeys= [['export', 'E'], ['find', 'F']];
	var meta = (goog.userAgent.MAC==true ? "⌘" : "Ctrl+")
	for (i in sKeys){
		var d = goog.dom.getElement(sKeys[i][0]+'-shortcut')
		goog.dom.setTextContent(d, meta+sKeys[i][1]);
	}
	
	resource_id=window.location.href.split('=')[1];
	goog.net.XhrIo.send('scriptcontent',
		setup,
		'POST',
		'resource_id='+resource_id
	)
  }
function setElementSizes(v){
	var s = goog.dom.getViewportSize();
	goog.style.setSize(goog.dom.getElement('container'), s);
	document.getElementById('canvas').height = s.height - 60-38;
	document.getElementById('canvas').width = s.width-320;
	editorWidth=s.width-323;
	document.getElementById('sidebar').style.height = (s.height-70)+'px';
	if(v=="r"){
		scroll(0);
		paint(false,false,false)
	}
}
var vsm = new goog.dom.ViewportSizeMonitor();
goog.events.listen(vsm, goog.events.EventType.RESIZE, function(e) {setElementSizes("r");});

var docKh = new goog.events.KeyHandler(document);
goog.events.listen(docKh, 'key', keyEvent)

function keyEvent(e){
	if(e.platformModifierKey){
		return;
	}
	else if(e.target.id=="ccp"){
      var d= new Date();
      milli = d.getMilliseconds();
      if(e.keyCode==13)enter();
      else if(e.keyCode==38)upArrow(e);
      else if(e.keyCode==40)downArrow(e);
      else if(e.keyCode==39)rightArrow(e);
      else if(e.keyCode==37)leftArrow(e);
      else if(e.keyCode==8)return;
      else if(e.keyCode==46)return;
	  else if(e.keyCode==16)return;
      else if(e.keyCode==9)return;
	  else{return}
      d=null;
	}
    if(typeToScript){
		if (anch.row==pos.row && pos.col==anch.col)document.getElementById("ccp").value="";
        document.getElementById('ccp').focus();
        document.getElementById('ccp').select();
    }
}
goog.events.listen(document, goog.events.EventType.MOUSEMOVE, mouseMove)
goog.events.listen(document, goog.events.EventType.MOUSEDOWN, mouseDown)
goog.events.listen(document, goog.events.EventType.MOUSEUP, mouseUp)
var shortcutHandler = new goog.ui.KeyboardShortcutHandler(document);
shortcutHandler.registerShortcut('export', 'meta+e');
shortcutHandler.registerShortcut('find', 'meta+f');
shortcutHandler.setAlwaysPreventDefault(true)
goog.events.listen(
       shortcutHandler,
       goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,
       shortcutTriggered);
function shortcutTriggered(e){
	if(e.identifier=="export")exportPrompt();
	else if(e.identifier=="find")findPrompt();
}


function findInputKeyUp(e, w){
	if(e.which==13 && e.which!=1000){
		e.preventDefault();
		findDown();
		return;
	}
	var f = (w=="f" ? document.getElementById("find_input").value : document.getElementById("fr_find_input").value);
	var r = new RegExp(f.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),"gi");
	findArr=[];
	findReplaceArr=[];
	if(f.length==0){
		document.getElementById('find_number_found').innerHTML="0 found"
		return;
	}
	var c = 0;
	for (i in lines){
		while (r.test(lines[i][0])==true){
			if(w=="f"){findArr.push([i*1,r.lastIndex-f.length])}
			else{findReplaceArr.push([i*1,r.lastIndex-f.length])}
		}
	}
	if(w=="f"){document.getElementById('find_number_found').innerHTML=findArr.length+" found"}
}
function findDown(){
	var tmpArr= (findArr.length!=0 ? findArr : findReplaceArr)
	if (tmpArr.length==0)return;
	var l = (findArr.length!=0 ? document.getElementById('find_input').value.length : document.getElementById('fr_find_input').value.length);
	for(i in tmpArr){
		if (tmpArr[i][0]==pos.row && tmpArr[i][1]>pos.col){
			anch.row=pos.row=tmpArr[i][0];
			anch.col=tmpArr[i][1]*1;
			pos.col=tmpArr[i][1]*1+l*1;
			jumpTo("find"+pos.row);
			return;
		}
		if(tmpArr[i][0]*1>pos.row*1){
			anch.row=pos.row=tmpArr[i][0]*1;
			anch.col=tmpArr[i][1]*1;
			pos.col=tmpArr[i][1]*1+l*1;
			jumpTo("find"+pos.row);
			return;
		}
	}
	pos.row=anch.row=pos.col=anch.col=0;
	findDown();
}

function findUp(){
	var tmpArr= (findArr.length!=0 ? findArr : findReplaceArr)
	if (tmpArr.length==0)return;
	var l = (findArr.length!=0 ? document.getElementById('find_input').value.length : document.getElementById('fr_find_input').value.length);
	var i = tmpArr.length-1;
	for(var i=tmpArr.length-1;i>=0;i--){
		if (tmpArr[i][0]==pos.row && tmpArr[i][1]<pos.col-l-1){
			anch.row=pos.row=tmpArr[i][0];
			anch.col=tmpArr[i][1]*1;
			pos.col=tmpArr[i][1]*1+l*1;
			jumpTo("find"+pos.row);
			return;
		}
		if(tmpArr[i][0]*1<pos.row*1){
			anch.row=pos.row=tmpArr[i][0]*1;
			anch.col=tmpArr[i][1]*1;
			pos.col=tmpArr[i][1]*1+l*1;
			jumpTo("find"+pos.row);
			return;
		}
	}
	pos.row=anch.row=tmpArr[tmpArr.length-1][0];
	anch.col = tmpArr[tmpArr.length-1][1];
	pos.col = anch.col+l;
	jumpTo("find"+pos.row);
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
    // figure and copy range
    if (startRange.row==endRange.row){
        var sel = lines[startRange.row][0].slice(startRange.col, endRange.col);
    }
    else{
        arr=[];
        arr.push([lines[startRange.row][0].slice(startRange.col),lines[startRange.row][1]]);
        startRange.row=startRange.row*1+1;
        while(startRange.row<endRange.row){
            arr.push([lines[startRange.row][0],lines[startRange.row][1]]);
            startRange.row+=1;
        }
        arr.push([lines[endRange.row][0].slice(0,endRange.col),lines[endRange.row][1]]);
        var sel=JSON.stringify(arr);
    }
    var c = document.getElementById('ccp');
    c.value=sel;
	if(!findForcePaint){
		c.focus();
		c.select();
	}
	startRange=endRange=sel=null;
}
function toolbarActions(e){
	var c = e.target.getId().replace('toolbar','')
	if(c=='New')newScriptPrompt();
	else if(c=='Export')exportPrompt();
	else if(c=='InsertNote')newThread();
	else if(c=='Email')emailPrompt();
}
function setup(e){
	var tb = new goog.ui.Toolbar();
	tb.decorate(goog.dom.getElement('gtb'));
	goog.events.listen(tb, goog.ui.Component.EventType.ACTION, toolbarActions)
	goog.dom.getElement('gtb').style.visibility = 'visible';
	goog.dom.getElement('sidebar').style.visibility = 'visible';
    if(e.target.getResponseText()=='not found'){
        lines = [["Sorry, the script wasn't found.",1]];
        paint(true,false,false);
        return;
    }
    var p = e.target.getResponseJson();
    var title=p[0];
    document.getElementById('title').innerHTML=title;
	document.title = title;
    var x = p[1];
    for(var i=0; i<x.length; i++){
        lines.push([x[i][0], x[i][1]]);
    }
    if(lines.length==2){
        pos.row=anch.row=1;
        pos.col=anch.col=lines[1][0].length;
    }
    if(p[2].length!=0){
        var wrong=p[2][0];
        var ignore =p[2][1];
        for (w in wrong){
            spellWrong.push(wrong[w])
        }
        for (i in ignore){
            spellIgnore.push(ignore[i]);
        }
    }
    //setupnotes
    for(i in p[3]){
        notes.push(p[3][i]);
    }
    var collabs=p[4];
    var c = document.getElementById('hasAccess');
	var emailAutoComplete = new goog.ui.AutoComplete.Basic(p[5], document.getElementById('recipient'), true);
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    tabs(0);
    sceneIndex();
	noteIndex();
    document.getElementById('ccp').focus();
    document.getElementById('ccp').select();
    paint(true,false,false);
    setInterval('paint(false,false,false)', 25);
	i=p=data=title=x=w=c=collabs=null;
	var n = new goog.fx.dom.FadeOutAndHide(goog.dom.getElement('loading'), 500);
	goog.events.listen(n, goog.fx.Animation.EventType.END, function(e){goog.dom.removeNode(goog.dom.getElement('loading'))})
	n.play()
}
function tabs(v){
    var t = ["sceneTab","noteTab"]
    for(i in t){
        var c = document.getElementById(t[i]);
        if(i==v){
            c.style.backgroundColor="#3F5EA6";
            c.style.color='white';
            document.getElementById(t[i].replace("Tab","s")).style.display="block";
        }
        else{
            c.style.backgroundColor="#6C8CD5";
            c.style.color='black';
            document.getElementById(t[i].replace("Tab","s")).style.display="none";
        }
    }
	t=i=null;
}
function mouseUp(e){
	if(typeToScript){
	    mouseDownBool=false;
	    scrollBarBool=false;
	    var width = document.getElementById('canvas').width;
	    var height = document.getElementById('canvas').height;
            
	    if(e.clientY-headerHeight>height-39 && e.clientY-headerHeight<height && e.clientX>editorWidth-22 && e.clientX<editorWidth-2){
	            if(e.clientY-headerHeight>height-20)scroll(30);
	            else scroll(-30);
	    }
		width=height=null;
		document.getElementById('ccp').focus();
        document.getElementById('ccp').select();
	}
	fMenu.setVisible(false)
	eMenu.setVisible(false)
	vMenu.setVisible(false)
	sMenu.setVisible(false)
	var arr=["file",'edit','view','share'];
	for(i in arr){
		var d = goog.dom.getElement(arr[i]);
		d.style.backgroundColor='#A2BAE9';
        d.style.color='black';
	}
}
function mouseDown(e){
	if(typeToScript){
		if(document.getElementById('suggestBox')!=null){
			return;
		}
		else if(document.getElementById('context_menu')!=null){
			if(e.target.className=="contextUnit"){
				changeFormat(e.target.id.replace("cm",""));
			}
			document.getElementById('context_menu').parentNode.removeChild(document.getElementById('context_menu'));
		}
	    else{
	        var height = document.getElementById('canvas').height;
	        var pagesHeight = (pageBreaks.length+1)*72*lineheight;
	        var barHeight = ((height)/pagesHeight)*(height-39);
	        if (barHeight<20)barHeight=20;
	        if (barHeight>=height-39)barHeight=height-39;
	        var topPixel = (vOffset/(pagesHeight-height))*(height-39-barHeight)+headerHeight;
        
	        if(e.clientX>headerHeight && e.clientX<editorWidth-100 && e.clientY-headerHeight>40 && e.target.id=="canvas"){
	            mouseDownBool=true;
				mousePosition(e,"anch")
	        }
	        else if(e.clientX<editorWidth && e.clientX>editorWidth-20 && e.clientY>topPixel && e.clientY<topPixel+barHeight){
	            scrollBarBool=true;
	        }
	    	height=pagesHeight=barHeight=topPixel=null;
		}
	document.getElementById('ccp').focus();
	document.getElementById('ccp').select();
	}
}
function mousePosition(e, w){
	var d= new Date();
    milli = d.getMilliseconds();
	var count = 0;
	var found = 0;
	var mp=e.clientY+vOffset-31;
	var y=15*lineheight+3;
	var oldY=0;
	for(i in lines){
		oldY=y;
		if(pageBreaks.length!=0 && pageBreaks[count]!=undefined && pageBreaks[count][0]==i){
			if(pageBreaks[count][2]==0){
				y=72*lineheight*(count+1)+10*lineheight+headerHeight+3-31;
				count++;
			}
			else{
				y=72*lineheight*(count+1)+10*lineheight+headerHeight+3;
				y+=(linesNLB[i].length-pageBreaks[count][2])*lineheight-31;
				if(lines[i][1]==3)y+=lineheight;
				y-=(lineheight*linesNLB[i].length);
				count++;
			}
		}
		y+=(lineheight*linesNLB[i].length);
		if(y>mp){
			if(pageBreaks.length!=0 && pageBreaks[count-1]!=undefined && pageBreaks[count-1][0]==i && pageBreaks[count-1][2]!=0){
				if ((mp-oldY)/lineheight<pageBreaks[count-1][2]){
					var l = Math.round((mp-oldY)/lineheight+0.5);
				}
				else if (mp<72*lineheight*(count)+10*lineheight+headerHeight){
					var l = pageBreaks[count-1][2];
				}
				else{
					var l = Math.round((lineheight*linesNLB[i].length-y+mp)/lineheight+0.5);
				}
			}
			else{
				var l = Math.round((lineheight*linesNLB[i].length-y+mp)/lineheight+0.5);
			}
			var j=0;
			var tc=0;
			while(j+1<l){
				tc+=linesNLB[i][j]+1;
				j++;
			}
			var r;
			if(lines[i][1]!=5){
				r=Math.round((e.clientX-Math.round((editorWidth-fontWidth*87-24)/2)-WrapVariableArray[lines[i][1]][1])/fontWidth);
			}
			else{
				r=Math.round((e.clientX-Math.round((editorWidth-fontWidth*87-24)/2)-WrapVariableArray[lines[i][1]][1]+(lines[i][0].length*fontWidth))/fontWidth);
			}
			if(r<0)r=0;
			if(r>linesNLB[i][j])r=linesNLB[i][j];
			tc+=r;
			if(tc<0)tc=0;
            if(tc>lines[i][0].length)tc=lines[i][0].length;
			if (w=="anch"){
				pos.row = anch.row = i*1;
				pos.col = anch.col = tc*1;
			}
			else{
				pos.row = i;
				pos.col = tc;
			}
			r = y = tc = count = found = mp = oldY = l = d = null;
			return;
		}
	}
}
function mouseMove(e){
    if(scrollBarBool)scrollBarDrag(e);
    mouseY=e.clientY;
    if(mouseDownBool) mousePosition(e,"pos");
	var height = document.getElementById('canvas').height;
    var pagesHeight = (pageBreaks.length+1)*72*lineheight;
    var barHeight = ((height)/pagesHeight)*(height-39);
    if (barHeight<20)barHeight=20;
    if (barHeight>=height-39)barHeight=height-39;
    var topPixel = (vOffset/(pagesHeight-height))*(height-39-barHeight)+headerHeight;
	document.getElementById('canvas').style.cursor = ((e.clientX<editorWidth && e.clientX>editorWidth-20 && e.clientY>topPixel && e.clientY<topPixel+barHeight) ? "default" : "text");
}
function handleMouseWheel(e){
	scroll(e.deltaY*10)
}
function scrollBarDrag(e){
    var diff = mouseY-e.clientY;
    var height = document.getElementById('canvas').height-50;
    var pagesHeight = (pageBreaks.length+1)*72*lineheight;
    vOffset-=pagesHeight/height*diff;
    if (vOffset<0)vOffset=0;
    var pagesHeight = (pageBreaks.length+1)*72*lineheight-document.getElementById('canvas').height+20;
    if(vOffset>pagesHeight)vOffset=pagesHeight+20;
	diff=height=pagesHeight=null;
}
function scroll(v){
    vOffset+=v;
    if (vOffset<0)vOffset=0;
    var pagesHeight = (pageBreaks.length+1)*72*lineheight-document.getElementById('canvas').height+20;
    if(vOffset>pagesHeight)vOffset=pagesHeight+20;
	var d= new Date();
    milli = d.getMilliseconds();
	if(document.getElementById('suggestBox')!=null){
		paint(false,false,false);
		createSuggestBox((lines[pos.row][1]==0 ? "s" : "c"));
	}
	pagesHeight=d=null;
}
function jumpTo(v){
    if(v.target!=undefined){
		v=v.target.id;
        var e = parseInt(v.replace('row',''));
        pos.row=e;
        anch.row=pos.row;
        pos.col=lines[pos.row][0].length;
        anch.col=pos.col;
		this.style.backgroundColor="#999ccc"
    }
	else if(v[0]=="f"){
		var e = parseInt(v.replace('find',''));
	}
    else {var e=pos.row;}
    var scrollHeight=0;
    for(var i=0;i<e;i++){
        for(var count=0; count<pageBreaks.length; count++){
            if(pageBreaks[count][0]==i){
                scrollHeight=lineheight*72*(count*1+1);
				if(pageBreaks[count][2]!=0){
					scrollHeight-=lineheight*(linesNLB[i].length-pageBreaks[count][2]);
				}
            }
        }
		count=null;
        scrollHeight+=(linesNLB[i].length*lineheight);
    }
    vOffset=scrollHeight;
    var pagesHeight = (pageBreaks.length+1)*72*lineheight-document.getElementById('canvas').height;
    if(vOffset>pagesHeight)vOffset=pagesHeight;
	e=i=scrollHeight=pagesHeight=null;
}
function upArrow(e){
    if(typeToScript && document.getElementById('suggestBox')==null){
        if (pos.row==0 && pos.col==0)return;
        var type = lines[pos.row][1];
        if (type==0) var wrapVars=WrapVariableArray[0];
        else if(type==1) var wrapVars = WrapVariableArray[1];
        else if(type==2) var wrapVars = WrapVariableArray[2];
        else if(type==3) var wrapVars = WrapVariableArray[3];
        else if(type==4) var wrapVars = WrapVariableArray[4];
        else if(type==5) var wrapVars = WrapVariableArray[5];
        // Only do calculations if 
        // there is wrapped text
        if(lines[pos.row][0].length>wrapVars[0]){
            var wordsArr = lines[pos.row][0].split(' ');
            var word = 0;
            var lineLengths=[];
            while(word<wordsArr.length){
				if(wordsArr[word].length>=wrapVars[0]){
					lineLengths.push(wordsArr[word].length)
					word++;
				}
                if(wordsArr.slice(word).join().length<=wrapVars[0]){
                    lineLengths.push(wordsArr.slice(word).join().length);
                    word=wordsArr.length
                    
                }
                else{
                    var integ=0;
                    while(wordsArr.slice(word, word+integ).join().length<wrapVars[0]){
                        integ++;
                    }
                    lineLengths.push(wordsArr.slice(word, word+integ-1).join().length);
                    word+=integ-1;
                }
            }
            // now we have the variable lineLengths
            // this is an array holding all the wrapped line lengths
            //
            //use variable 'integ' to figure out 
            //what line the cursor is on
            integ=0;
            var totalCharacters=lineLengths[0];
            while(totalCharacters<pos.col){
                integ++;
                totalCharacters+=lineLengths[integ]+1;
            }
            // totalCharacters now equals
            // all character up to and including
            // current line (integ) including spaces
            if(pos.row==0 && integ==0){
				pos.col=anch.col=0;
				return;
			}
            //if this is the first line in a block of wrapped text
            if(integ==0){
                if(checkSpell)ajaxSpell(pos.row);
                var prevLineType = lines[pos.row-1][1];
                if (prevLineType==0)var newWrapVars=WrapVariableArray[0];
                else if(prevLineType==1) var newWrapVars = WrapVariableArray[1];
                else if(prevLineType==2) var newWrapVars = WrapVariableArray[2];
                else if(prevLineType==3) var newWrapVars = WrapVariableArray[3];
                else if(prevLineType==4) var newWrapVars = WrapVariableArray[4];
                else if(prevLineType==5) var newWrapVars = WrapVariableArray[5];
                // If the previous line (the one we're jumping into)
                // has only one line, don't run the calcs, just go to it
                if(lines[pos.row-1][0].length<newWrapVars[0]){
                    pos.row--;
                    if(pos.col>lines[pos.row][0].length)pos.col=lines[pos.row][0].length;
                }
                else{
                    var wordsArr = lines[pos.row-1][0].split(' ');
                    var word = 0;
                    var lineLengths=[];
                    while(word<wordsArr.length){
						if(wordsArr[word].length>=wrapVars[0]){
							lineLengths.push(wordsArr[word].length)
							word++;
						}
                        else if(wordsArr.slice(word).join().length<=wrapVars[0]){
                            lineLengths.push(wordsArr.slice(word).join().length);
                            word=wordsArr.length
                            
                        }
                        else{
                            var integ = 0;
                            while(wordsArr.slice(word, word+integ).join().length<wrapVars[0]){
                                integ++;
                            }
                            lineLengths.push(wordsArr.slice(word, word+integ-1).join().length);
                            word+=integ-1;
                        }
                    // now we have the variable lineLengths
                    // this is an array holding all the wrapped line lengths
                    }
                    pos.row--;
                    pos.col+=lines[pos.row][0].length-lineLengths[lineLengths.length-1];
                    if(pos.col>lines[pos.row][0].length)pos.col = lines[pos.row][0].length;
                    
                }
            }
            // if this is some middle line in a block of wrapped text
            else{
                pos.col-=lineLengths[integ-1]+1;
                if(pos.col>(totalCharacters-lineLengths[integ]-1))pos.col=totalCharacters-lineLengths[integ]-1;
            }
        }
        //if the current block does
        //not have wrapped text
        else{
            if(pos.row==0){
                pos.col=0;
            }
            else{
                if(checkSpell)ajaxSpell(pos.row);
                var prevLineType = lines[pos.row-1][1];
                if (prevLineType==0)var newWrapVars=WrapVariableArray[0];
                else if(prevLineType==1) var newWrapVars = WrapVariableArray[1];
                else if(prevLineType==2) var newWrapVars = WrapVariableArray[2];
                else if(prevLineType==3) var newWrapVars = WrapVariableArray[3];
                else if(prevLineType==4) var newWrapVars = WrapVariableArray[4];
                else if(prevLineType==5) var newWrapVars = WrapVariableArray[5];
                // If the previous line (the one we're jumping into)
                // has only one line, don't run the calcs, just go to it
                if(lines[pos.row-1][0].length<newWrapVars[0]){
                    pos.row--;
                    if(pos.col>lines[pos.row][0].length)pos.col=lines[pos.row][0].length;
                }
                //if the previous line has wrapped text
                //do crazy calcs to figure where to
                // jump to
                else{
                    var wordsArr = lines[pos.row-1][0].split(' ');
                    var word = 0;
                    var lineLengths=[];
                    while(word<wordsArr.length){
						if(wordsArr[word].length>=wrapVars[0]){
							lineLengths.push(wordsArr[word].length)
							word++;
						}
                        else if(wordsArr.slice(word).join().length<=wrapVars[0]){
                            lineLengths.push(wordsArr.slice(word).join().length);
                            word=wordsArr.length
                            
                        }
                        else{
                            var integ = 0;
                            while(wordsArr.slice(word, word+integ).join().length<wrapVars[0]){
                                integ++;
                            }
                            lineLengths.push(wordsArr.slice(word, word+integ-1).join().length);
                            word+=integ-1;
                        }
                    // now we have the variable lineLengths
                    // this is an array holding all the wrapped line lengths
                    }
                    pos.row--;
                    pos.col+=lines[pos.row][0].length-lineLengths[lineLengths.length-1];
                    if(pos.col>lines[pos.row][0].length)pos.col = lines[pos.row][0].length;
                }
            }
        }
        if(!e.shiftKey){
            anch.col=pos.col;
            anch.row=pos.row;
        }
		if(ud<0)paint(false,false,false);
    }
	else if(document.getElementById('suggestBox')!=null){
		googSuggestMenu.highlightPrevious();
	}
}
	
function downArrow(e){
    if(typeToScript && document.getElementById('suggestBox')==null){
        if(pos.row==lines.length-1 && pos.col==lines[pos.row][0].length)return;
        var type = lines[pos.row][1];
        if (type==0)var wrapVars=WrapVariableArray[0];
        else if(type==1) var wrapVars = WrapVariableArray[1];
        else if(type==2) var wrapVars = WrapVariableArray[2];
        else if(type==3) var wrapVars = WrapVariableArray[3];
        else if(type==4) var wrapVars = WrapVariableArray[4];
        else if(type==5) var wrapVars = WrapVariableArray[5];
        if (lines[pos.row][0].length>wrapVars[0]){
            var wordsArr = lines[pos.row][0].split(' ');
            var word = 0;
            var lineLengths=[];
            while(word<wordsArr.length){
				if(wordsArr[word].length>=wrapVars[0]){
					lineLengths.push(wordsArr[word].length)
					word++;
				}
                else if(wordsArr.slice(word).join().length<=wrapVars[0]){
                    lineLengths.push(wordsArr.slice(word).join().length);
                    word=wordsArr.length
                    
                }
                else{
                    var integ = 0;
                    while(wordsArr.slice(word, word+integ).join().length<wrapVars[0]){
                        integ++;
                    }
                    lineLengths.push(wordsArr.slice(word, word+integ-1).join().length);
                    word+=integ-1;
                }
            }
            //use variable 'integ' to figure out 
            //what line the cursor is on
            integ=0;
            var totalCharacters=lineLengths[0];
            while(totalCharacters<pos.col){
                integ++;
                totalCharacters+=lineLengths[integ]+1;
            }
            //if this is the last line in a block of wrapped text
            if(integ+1==lineLengths.length){
                if(checkSpell)ajaxSpell(pos.row);
                for(var newinteg=0; newinteg<lineLengths.length-1;newinteg++){
                    pos.col-=lineLengths[newinteg];
                }
                pos.col--;
                pos.row++;
                if(pos.row>lines.length-1){
                    pos.row--;
                    pos.col=lines[pos.row][0].length;
                }
                if(pos.col>lines[pos.row][0].length)pos.col=lines[pos.row][0].length;
            }
            // if this is some middle line in a block of wrapped text
            else{
                pos.col+=lineLengths[integ]+1;
                if(pos.col>(totalCharacters+lineLengths[integ+1]+1))pos.col=totalCharacters+lineLengths[integ+1]+1;
            }
        }
        else{
            if(pos.row==lines.length-1){
                pos.col=lines[pos.row][0].length;
            }
            else{
                pos.row++;
                if(pos.row>lines.length-1) pos.row=lines.length-1;
                if(pos.col>lines[pos.row][0].length)pos.col=lines[pos.row][0].length;
            }
        }
        if(!e.shiftKey){
            anch.col=pos.col;
            anch.row=pos.row;
        }
        if(ud>document.getElementById('canvas').height-50)paint(false,false,false);
    }
	else if(document.getElementById('suggestBox')!=null){
		googSuggestMenu.highlightNext();
	}
}

function leftArrow(e){
    if(typeToScript){
		var change=false;
        if(pos.row==0 && pos.col==0) return;
        if(pos.col==0){
            if(checkSpell)ajaxSpell(pos.row);
            pos.row--;
            pos.col=lines[pos.row][0].length;
			var change=true;
        }
        else{
            pos.col = pos.col-1;
        }
        
        if(!e.shiftKey){
            anch.col=pos.col;
            anch.row=pos.row;
        }
		var c =document.getElementById('suggestBox');
		if(change && c!=null)c.parentNode.removeChild(c);
    }
}
	
function rightArrow(e){
    if(typeToScript){
		var change=false;
        if(pos.col==lines[pos.row][0].length && pos.row==lines.length-1)return;
        if(pos.col==lines[pos.row][0].length){
            if(checkSpell)ajaxSpell(pos.row);
            pos.row++;
            pos.col=0;
			change=true;
        }
        else pos.col = pos.col+1;
        
        if(!e.shiftKey){
            anch.col=pos.col;
            anch.row=pos.row;
        }
		var c =document.getElementById('suggestBox');
		if(change && c!=null)c.parentNode.removeChild(c);
    }
}
	
function pagination(){
    pageBreaks = [];
    i = 0;
    var r=0;
    while(i<lines.length){
        lineCount = r;
        while(lineCount+linesNLB[i].length<56){
            lineCount+=linesNLB[i].length;
            i++;
            if (i==lines.length){
                return;
            }
        }
        var s=0;
        r=0;
        if(lines[i][1]==3 && lineCount<54 && lineCount+linesNLB[i].length>57){
            s=55-lineCount;
            r=1-s;
            lineCount=56;
        }
        else if(lines[i][1]==3 && lineCount<54 && linesNLB[i].length>4){
            s=linesNLB[i].length-3;
            r=1-s;
            lineCount=55;
        }
        else if(lines[i][1]==1 && lineCount<55 && lineCount+linesNLB[i].length>57){
            s=55-lineCount;
            r=1-s;
            lineCount=56;
        }
        else if(lines[i][1]==1 && lineCount<55 && linesNLB[i].length>4){
            s=linesNLB[i].length-3;
            r=1-s;
            lineCount=55;
        }
        else{
            while(lines[i-1][1]==0 || lines[i-1][1]==2 || lines[i-1][1]==4){
                i--;
                lineCount-=linesNLB[i].length;
            }
        }
        pageBreaks.push([i, lineCount, s]);
    }
}

function sceneIndex(){
    scenes=[];
    var num = 0;
    for (var i=0; i<lines.length; i++){
        if(lines[i][1]==0){
            num++;
			var tooltip="";
			if (i!=lines.length-1){
				tooltip=lines[i+1][0];
				if((lines[i+1][1]==2 || lines[i+1][1]==5) && i!=lines.length-2){
					tooltip+=" "+lines[i+2][0];
				}
				
			}
            scenes.push([String(num)+') '+lines[i][0].toUpperCase(), i, tooltip]);
			tooltip=null;
        }
    }
    goog.dom.removeChildren(goog.dom.getElement('sceneBox'));
    for (var i=0; i<scenes.length; i++){
        var elem = document.getElementById('sceneBox').appendChild(document.createElement('p'))
        elem.appendChild(document.createTextNode(scenes[i][0]));
        elem.className='sceneItem';
        elem.id="row"+scenes[i][1];
		elem.title=scenes[i][2];
		goog.events.listen(elem, goog.events.EventType.CLICK, jumpTo);
		goog.events.listen(elem, goog.events.EventType.MOUSEOVER, function(e){this.style.backgroundColor="#ccccff"});
		goog.events.listen(elem, goog.events.EventType.MOUSEOUT, function(e){this.style.backgroundColor="white"});
		elem=null;
    }
	c=i=num=null;
}
function updateOneScene(v){
	try{
		var d = document.getElementById("row"+v);	
		var num = d.innerHTML.split(")")[0];
		d.removeChild(d.firstChild);
		d.appendChild(document.createTextNode(num+") "+lines[v][0].toUpperCase()));
	}
	catch(e){};
}
//notes
function sortNotes(a,b){
    if (a[0]<b[0]) return -1;
    if (a[0]>b[0]) return 1;
    if (a[1]<b[1]) return -1;
    if (a[1]>b[1]) return 1;
    return 0;
}
function sortNotesCol(a,b){
    if (a[1]<b[1]) return -1;
    if (a[1]>b[1]) return 1;
    return 0;
}
function noteIndex(){
    notes.sort(sortNotes);
	var c = document.getElementById('noteBox');
	for(var i=0;i<c.childNodes.length;i++){
		c.removeChild(c.firstChild);
		i--;
	}
	for (x in notes){
		var newDiv=c.appendChild(document.createElement('div'));
		newDiv.className='thread';
		for (y in notes[x][2]){
			var msgDiv = newDiv.appendChild(document.createElement('div'));
            var contentDiv = msgDiv.appendChild(document.createElement('div'));
			contentDiv.innerHTML = notes[x][2][y][0];
            var infoDiv = msgDiv.appendChild(document.createElement('div'));
            infoDiv.appendChild(document.createTextNode(notes[x][2][y][1].split("@")[0]));
            infoDiv.align='right';
            infoDiv.className="msgInfo";
			msgDiv.className='msg';
            msgDiv.id=notes[x][3]+"msg";
			goog.events.listen(msgDiv, goog.events.EventType.CLICK, function(e){
				var j = e.target;
				while(j.className!='msg'){j=j.parentNode;}
				for (i in notes){
		            if (String(notes[i][3])==String(j.id.replace("msg",""))){
		                pos.row=anch.row=notes[i][0];
		                pos.col=anch.col=notes[i][1];
		            }
		        }
		        paint(false,false,false);
		        jumpTo("find"+pos.row)
			})
			msgDiv=contentDiv=infoDiv=null;
		}
		var cont=newDiv.appendChild(document.createElement('div'));
		cont.className='respond';
		cont.appendChild(document.createTextNode('Respond'));
		cont.id=notes[x][3];
		goog.events.listen(cont, goog.events.EventType.CLICK, newMessage)
		newDiv=TR=TD=newA=cont=null;
	}
    typeToScript=true;
	x=i=null;
}
function newThread(){
	tabs(1);
	viewNotes=true;
	paint(false,false,false);
    noteIndex();
    typeToScript=false;
    var c = document.getElementById('noteBox');
    var newDiv=c.appendChild(document.createElement('div'));
    newDiv.className='thread';
	id=Math.round(Math.random()*1000000000);
    var found=true;
    while (found==true){
        found=false;
        for (i in notes){
            if (String(notes[i][3])==String(id)){
                id=Math.round(Math.random()*1000000000);
                found=true;
            }
        }
    }
    var n = newDiv.appendChild(document.createElement('div'));
    n.className='respondControls';
    var i=n.appendChild(document.createElement('div'));
    i.contentEditable=true;
    i.id='nmi';
    var sb = n.appendChild(document.createElement('input'));
    sb.type='button';
    sb.value='Save';
    sb.id=id;
    var cb = n.appendChild(document.createElement('input'));
    cb.type='button';
    cb.value='Cancel';
    cb.id="noteCancel"
	goog.events.listen(sb, goog.events.EventType.CLICK, submitNewThread)
	goog.events.listen(cb, goog.events.EventType.CLICK, noteIndex)
    i.focus();
}
function submitNewThread(e){
	var v = e.target.id;
    var content = document.getElementById('nmi').innerHTML
    var u =document.getElementById('user_email').innerHTML;
    var d = new Date();
    if (content!=""){
        var arr = [pos.row, pos.col, [[content,u,d]], v];
        notes.push(arr);
        var data = [pos.row, pos.col, content, v];
        if(resource_id!="Demo"){
			goog.net.XhrIo.send('/notesnewthread',
				function(e){
					if(e.target.getResponseText()!='sent'){
						alert("Sorry, there was a problem sending that message. Please try again later.")
					}
				},
				'POST',
				'fromPage=editor&resource_id='+resource_id+'&row='+pos.row+'&col='+pos.col+'&content='+escape(content)+'&thread_id='+v
			);
        }
    }
    noteIndex();
}
function newMessage(e){
	var v = e.target.id;
    noteIndex();
    typeToScript=false;
    var c=document.getElementById(v);
    var n=c.parentNode.insertBefore(document.createElement('div'),c);
    n.className='respondControls';
    var i=n.appendChild(document.createElement('div'));
    i.contentEditable=true;
    i.id='nmi';
    var sb = n.appendChild(document.createElement('input'));
    sb.type='button';
    sb.value='Save';
    sb.id='noteSave'+v;
    var cb = n.appendChild(document.createElement('input'));
    cb.type='button';
    cb.value='Cancel';
    cb.id="noteCancel"
    c.parentNode.removeChild(c);
	goog.events.listen(sb, goog.events.EventType.CLICK, submitMessage)
	goog.events.listen(cb, goog.events.EventType.CLICK, noteIndex)
    i.focus();
}

function submitMessage(e){
	var v = parseInt(e.target.id.replace('noteSave',''));
	for (x in notes){
		if (notes[x][3]==v){
			var n=x;
		}
	}
    var d = new Date();
    var content = document.getElementById('nmi').innerHTML
    var u =document.getElementById('user_email').innerHTML;
    if(content!=""){
        var arr=[content, u, d]
        notes[n][2].push(arr);
        if(resource_id!="Demo"){
			goog.net.XhrIo.send('/notessubmitmessage',
				function(e){
					if(e.target.getResponseText()!='sent'){
						alert("Sorry, there was a problem sending that message. Please try again later.")
					}
				},
				'POST',
				'resource_id='+resource_id+'&content='+escape(content)+'&thread_id='+v+'&fromPage=editor'
			);
        }
		arr=null
    }
	noteIndex();
	x=d=content=u=n=null;
}

//Menu
// function to hand the file like menu

function openMenu(e){
	var v = e.target.id;
	var arr = [['file', fMenu],['edit', eMenu],['view', vMenu],['share', sMenu]];
    document.getElementById(v).style.backgroundColor='#6484df';
    document.getElementById(v).style.color='white';
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
	
	i=null;
}

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
    if(document.getElementById(v+'Menu').style.display=='none'){
        document.getElementById(v).style.backgroundColor='#A2BAE9';
        document.getElementById(v).style.color='black';
    }
}

function menuSelect(e){
	var id=e.target.getId();
    if(id=='new'){
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

//menu options and stuff
// closing the window
function closeScript(){
    self.close()
}
// new script
function newScriptPrompt(){
	if(resource_id=="Demo"){
        alert("Sorry, you'll have to login to open new scripts.");
		return;
    }
    typeToScript=false;
	document.getElementById('newscriptpopup').style.visibility = 'visible';
}

function hideNewScriptPrompt(){
    typeToScript=true;
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
		goog.net.XhrIo.send('/newscript',
			function(e){
				window.open('editor?resource_id='+e.target.getResponseText());
				hideNewScriptPrompt();
			},
			'POST',
			'filename='+escape(filename)+'&fromPage=editor'
		);
	}
}
// open other script
function openPrompt(){
    window.open("/scriptlist")
}

//exporting
function exportPrompt(){
	if(resource_id!="Demo"){
        
    }
    typeToScript=false;
    document.getElementById("exportpopup").style.visibility="visible"
}
function hideExportPrompt(){
    typeToScript=true;
    document.getElementById("exportpopup").style.visibility="hidden";
}
function exportScripts(){
    if(resource_id=="Demo"){
        alert("Sorry, you'll have to login to export scripts.");
        return;
    }
    else{
        var d;
        var title="&title_page="+document.getElementById('et').selectedIndex;
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
	if(resource_id=="Demo"){
        alert("Sorry, you'll have to login to email scripts.");
		return;
    }
    typeToScript=false;
    document.getElementById("emailpopup").style.visibility='visible'
}
function hideEmailPrompt(){
    document.getElementById("emailpopup").style.visibility='hidden';
    document.getElementById('recipient').value='';
    document.getElementById('message').innerHTML='';
    typeToScript=true;
}

function emailComplete(e){
	console.log()
	document.getElementById('emailS').disabled = false;
	document.getElementById('emailS').value = 'Send';
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
	var subject = document.getElementById('subject').value;
	if(subject=="")subject="Script";
	var body_message = document.getElementById('message').innerHTML;
	goog.net.XhrIo.send('/emailscript', 
		emailComplete,
		'POST',
		"resource_id="+resource_id+"&recipients="+recipients+"&subject="+subject+"&body_message="+escape(body_message)+"&fromPage=editor"
	);
	document.getElementById('emailS').disabled = true;
	document.getElementById('emailS').value = 'Sending...';
	c=arr=recipients=subject=body_message=null;
}

// find prompts and stuff
function findPrompt(){
	if(document.getElementById('find_div').style.display=="block")findInputKeyUp({"which":1000}, "f");
	typeToScript=false;
	findForcePaint=true;
	document.getElementById('find_div').style.display="block";
	document.getElementById('find_input').select();
	document.getElementById('find_input').focus();
}
function hideFindPrompt(){
	typeToScript=true;
	findForcePaint=false;
	findArr=[];
	document.getElementById('find_div').style.display="none";
	commandDownBool=false;
}

	


//drawing functions
// like the scroll arrows
function scrollArrows(ctx){
    var height = document.getElementById('canvas').height;
    //up arrow
    ctx.fillStyle="#333";
    ctx.fillRect(editorWidth-21, height-39, 21,20);
    ctx.fillStyle='#ddd';
    ctx.fillRect(editorWidth-19, height-37, 16, 16);
    ctx.beginPath();
    ctx.moveTo(editorWidth-16, height-24);
    ctx.lineTo(editorWidth-10.5, height-35);
    ctx.lineTo(editorWidth-5, height-24);
    ctx.closePath();
    ctx.fillStyle="#333";
    ctx.fill();
    //down arrow
    ctx.fillStyle="#333";
    ctx.fillRect(editorWidth-21, height-19, 20,20);
    ctx.fillStyle='#ddd';
    ctx.fillRect(editorWidth-19, height-18, 16, 16);
    ctx.beginPath();
    ctx.moveTo(editorWidth-16, height-15);
    ctx.lineTo(editorWidth-10.5, height-4);
    ctx.lineTo(editorWidth-5, height-15);
    ctx.closePath();
    ctx.fillStyle="#333";
    ctx.fill();
	height=null;
}
function scrollBar(ctx, y){
	var lingrad = ctx.createLinearGradient(editorWidth-15,0,editorWidth,0);
	lingrad.addColorStop(0, "#5587c4");
	lingrad.addColorStop(.8, "#95a7d4"); 
	ctx.strokeStyle="#333";
	//ctx.lineWidth=2;
	ctx.fillStyle=lingrad;
    var height = document.getElementById('canvas').height;
    var pagesHeight = (pageBreaks.length+1)*72*lineheight+40;
    var barHeight = ((height)/pagesHeight)*(height-39);
    if (barHeight<20)barHeight=20;
    if (barHeight>=height-39)barHeight=height-39;
    var topPixel = (vOffset/(pagesHeight-height))*(height-39-barHeight);
    ctx.fillRect(editorWidth-18.5, topPixel+8, 16,barHeight-17);
	ctx.strokeRect(editorWidth-18.5, topPixel+8, 16,barHeight-17);
	ctx.beginPath();
	ctx.arc(editorWidth-10.5, topPixel+9,8, 0, Math.PI, true);
	ctx.fill();
	ctx.stroke();
	ctx.beginPath()
	ctx.arc(editorWidth-10.5, topPixel+barHeight-11, 8, 0, Math.PI, false);
	ctx.fill();
	ctx.stroke();
	var sh = topPixel;
	while(sh < topPixel+barHeight){
		var radgrad = ctx.createRadialGradient(editorWidth,sh+10,4,editorWidth+200,sh,10);  
		radgrad.addColorStop(0, 'rgba(100,140,210,0.4)');  
		radgrad.addColorStop(0.4, 'rgba(180,160,240,0.4)');  
		radgrad.addColorStop(1, 'rgba(1,159,98,0)');
		ctx.fillStyle=radgrad;
		ctx.fillRect(editorWidth-18.5, topPixel+8, 16,barHeight-17);
		
		
		sh+=20;
	}
	ctx.beginPath();
	ctx.moveTo(editorWidth-7, topPixel+9);
	ctx.lineTo(editorWidth-7, topPixel+barHeight-10);
	ctx.lineCap="round";
	ctx.strokeStyle = "rgba(200,220,255,0.3)";
	ctx.lineWidth=4;
	ctx.stroke()
	ctx.beginPath();
	ctx.moveTo(editorWidth-9, topPixel+10);
	ctx.lineTo(editorWidth-9, topPixel+barHeight-10);
	ctx.strokeStyle = "rgba(200,220,255,0.1)";
	ctx.lineWidth=2;
	ctx.stroke()
	height=pagesHeight=barHeight=topPixel=sh=null;
}
function drawFindArr(ctx,pageStartX){
	ctx.fillStyle="yellow";
	var l = (findArr.length==0 ? document.getElementById("fr_find_input").value.length : document.getElementById("find_input").value.length);
	var characterCount=0;
	var iterant=0;
	var count=0;
	var tmpArr=(findArr.length==0 ? findReplaceArr : findArr)
	var colorHeight=lineheight*9+3;
	for (i in linesNLB){
		if(colorHeight-vOffset>1200)break;
		var characterCount=0;
		for (j in linesNLB[i]){
			if(pageBreaks[count]!=undefined && pageBreaks[count][0]==i && pageBreaks[count][2]==j){
				count++;
				colorHeight=72*lineheight*count+9*lineheight+4;
				if(lines[i]!=undefined && lines[i][1]==3)colorHeight+=lineheight
			}
			colorHeight+=lineheight;
			while(tmpArr[iterant]!=undefined && tmpArr[iterant][0]==i && tmpArr[iterant][1]>=characterCount && tmpArr[iterant][1]<characterCount+linesNLB[i][j]+1){
				//find the lr of where the rect should go
				// but only when necessary
				if(colorHeight-vOffset>-100){
					var lr = pageStartX+WrapVariableArray[lines[i][1]][1]+(tmpArr[iterant][1]-characterCount)*fontWidth;
					if(tmpArr[iterant][1]+l>characterCount+linesNLB[i][j]+1){
						ctx.fillRect(lr, colorHeight-vOffset, (characterCount+linesNLB[i][j]-tmpArr[iterant][1])*fontWidth, lineheight-2)
						ctx.fillRect(pageStartX+WrapVariableArray[lines[i][1]][1], colorHeight+lineheight-vOffset, (l-(characterCount+linesNLB[i][j]-tmpArr[iterant][1]+1))*fontWidth, lineheight-2)
					}
					else{
						ctx.fillRect(lr, colorHeight-vOffset, l*fontWidth, lineheight-2)
					}
				}
				iterant++;
			}
			characterCount+=linesNLB[i][j]+1;
		}
	}
}
function drawRange(ctx, pageStartX){
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
    
    //get the starting position
    var startHeight = lineheight*9+3;
    var count=0;
    for (var i=0; i<startRange.row;i++){
        if(pageBreaks.length!=0 && pageBreaks[count][2]==0 && pageBreaks[count][0]-1==i){
            startHeight=72*lineheight*(count+1)+9*lineheight+4;
            //startHeight-=(pageBreaks[count][2])*lineheight;
            //if(lines[i][1]==3)startHeight+=lineheight;
            count++;
            if(count==pageBreaks.length)count--;
        }
        else if(pageBreaks.length!=0 && pageBreaks[count][2]!=0 && pageBreaks[count][0]==i){
            startHeight=72*lineheight*(count+1)+9*lineheight+4;
            startHeight+=(linesNLB[i].length-pageBreaks[count][2])*lineheight;
            if(lines[i][1]==3)startHeight+=lineheight;
            count++;
            if(count==pageBreaks.length)count--;
        }
        else{startHeight+=lineheight*linesNLB[i].length;}
    }
    var i=0;
    var startRangeCol=linesNLB[startRange.row][i]+1;
    while(startRange.col>startRangeCol){
        startHeight+=lineheight;
        if(pageBreaks.length!=0 && pageBreaks[count][0]==startRange.row && pageBreaks[count][2]==i+1){
            startHeight=72*lineheight*(count+1)+9*lineheight+4;
            if(lines[startRange.row][1]==3)startHeight+=lineheight;
        }
        //else if(pageBreaks.length!=0 && pageBreaks[count][0]-1==startRange.row && pageBreaks[count][2]==i){
        //    startHeight=72*lineheight*(count+1)+9*lineheight+4;
        //    if(lines[startRange.row][1]==3)startHeight+=lineheight;
        //}
        i++;
        startRangeCol+=linesNLB[startRange.row][i]+1;
    }
    startRangeCol-=linesNLB[startRange.row][i]+1;
    var startWidth = WrapVariableArray[lines[startRange.row][1]][1];
    startWidth+=((startRange.col-startRangeCol)*fontWidth);
    startHeight+=lineheight;
    // calc notes
    for (note in notes){
        if(notes[note][0]==startRange.row){
            if(startRangeCol< notes[note][1] && startRangeCol+linesNLB[startRange.row][i]+1 >notes[note][1]){
                if(notes[note][1]<startRange.col)startWidth+=fontWidth;
            }
        }
    }
    
    //getting the ending position

    var endHeight = lineheight*9+3;
    count=0;
    for (var j=0; j<endRange.row;j++){
        if(pageBreaks.length!=0 && pageBreaks[count][2]==0 && pageBreaks[count][0]-1==j){
            endHeight=72*lineheight*(count+1)+9*lineheight+4;
            count++;
            if(count==pageBreaks.length)count--;
        }
        else if(pageBreaks.length!=0 && pageBreaks[count][2]!=0 && pageBreaks[count][0]==j){
            endHeight=72*lineheight*(count+1)+9*lineheight+4;
            endHeight+=(linesNLB[j].length-pageBreaks[count][2])*lineheight;
            if(lines[j][1]==3)endHeight+=lineheight;
            count++;
            if(count==pageBreaks.length)count--;
        }
        else{endHeight+=lineheight*linesNLB[j].length;}
    }
    var j=0;
    var endRangeCol=linesNLB[endRange.row][j]+1;
    while(endRange.col>endRangeCol){
        endHeight+=lineheight;
        if(pageBreaks.length!=0 && pageBreaks[count][0]==endRange.row && pageBreaks[count][2]==j+1){
            endHeight=72*lineheight*(count+1)+9*lineheight+4;
            if(lines[endRange.row][1]==3)endHeight+=lineheight;
        }
        //else if(pageBreaks.length!=0 && pageBreaks[count][0]-1==endRange.row && pageBreaks[count][2]==i){
        //    endHeight=72*lineheight*(count+1)+9*lineheight+4;
        //    if(lines[endRange.row][1]==3)endHeight+=lineheight;
        //}
        j++;
        endRangeCol+=linesNLB[endRange.row][j]+1;
    }
    endRangeCol-=linesNLB[endRange.row][j]+1;
    var endWidth = WrapVariableArray[lines[endRange.row][1]][1];
    endWidth+=((endRange.col-endRangeCol)*fontWidth);
    endHeight+=lineheight;
    // calc notes
    for (note in notes){
        if(notes[note][0]==endRange.row){
            if(endRangeCol< notes[note][1] && endRangeCol+linesNLB[endRange.row][j]+1 >notes[note][1]){
                if(notes[note][1]<endRange.col)endWidth+=fontWidth;
            }
        }
    }
    
    // Now compare stuff and draw blue Box
    ctx.fillStyle='lightBlue';
    if(endHeight==startHeight){
        var onlyBlueLine = startWidth;
        if (lines[startRange.row][1]==5)onlyBlueLine-=(lines[startRange.row][0].length*fontWidth);
        ctx.fillRect(onlyBlueLine+pageStartX, startHeight-vOffset,endWidth-startWidth, 12);
		onlyBlueLine=null;
    }
    else{
        var firstLineBlue = startWidth;
        if (lines[startRange.row][1]==5)firstLineBlue-=(lines[startRange.row][0].length*fontWidth);
        ctx.fillRect(firstLineBlue+pageStartX,startHeight-vOffset, (startRangeCol+linesNLB[startRange.row][i]-startRange.col)*fontWidth, 12);
        while(startHeight+lineheight<endHeight){
            for(var counter=0; counter<pageBreaks.length; counter++){
                if(pageBreaks.length!=0 && pageBreaks[counter][0]-1==startRange.row && pageBreaks[counter][2]==0 && i==linesNLB[startRange.row].length-1){
                    startHeight=72*lineheight*(counter+1)+9*lineheight+4;
                }
                else if(pageBreaks.length!=0 && pageBreaks[counter][0]==startRange.row && i==pageBreaks[counter][2]-1){
                    startHeight=72*lineheight*(counter+1)+9*lineheight+4;
                    if(lines[startRange.row][1]==3)startHeight+=lineheight;
                }
            }
			counter=null;
            i++;
            startHeight+=lineheight;
            if(linesNLB[startRange.row].length<=i){
                startRange.row++;
                i=0;
            }
            if(startHeight!=endHeight){
                var blueStart = WrapVariableArray[lines[startRange.row][1]][1];
                if (lines[startRange.row][1]==5)blueStart-=(lines[startRange.row][0].length*fontWidth);
                ctx.fillRect(blueStart+pageStartX, startHeight-vOffset, linesNLB[startRange.row][i]*fontWidth, 12);
				blueStart=null;
            }
            
        }
        //ctx.fillStyle="blue";
        var lastBlueLine=WrapVariableArray[lines[endRange.row][1]][1]; 
        if (lines[endRange.row][1]==5)lastBlueLine-=(lines[endRange.row][0].length*fontWidth);
        ctx.fillRect(lastBlueLine+pageStartX, endHeight-vOffset, (endRange.col-endRangeCol)*fontWidth,12);
		firstLineBlue=lastBlueLine=null;
    }
	startRange=endRange=startHeight=endHeight=startWidth=endWidth=i=j=count=startRangeCol=endRangeCol=null;
}


function drawNote(width, height, col, ctx, i, pageStartX){
    if(lines[i][1]==5){
        ctx.fillStyle="gold";
        ctx.beginPath();
        ctx.moveTo(width-fontWidth*(lines[i][0].length-col+1)+pageStartX, height-vOffset-lineheight+3);
        ctx.lineTo(width-fontWidth*(lines[i][0].length-col+1)+pageStartX, height-vOffset-lineheight+3+lineheight);
        ctx.lineTo(width-fontWidth*(lines[i][0].length-col+1)+fontWidth+pageStartX, height-vOffset-lineheight+3+lineheight);
        ctx.lineTo(width-fontWidth*(lines[i][0].length-col+1)+fontWidth+pageStartX, height-vOffset-lineheight+3+4);
        ctx.lineTo(width-fontWidth*(lines[i][0].length-col+1)+fontWidth-4+pageStartX, height-vOffset-lineheight+3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle="#333";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(var j=1; j<6; j++){
            ctx.moveTo(width-fontWidth*(lines[i][0].length-col+1)+1+pageStartX, height-vOffset-lineheight+3+(2*j)+0.5);
            ctx.lineTo(width-fontWidth*(lines[i][0].length-col+1)+fontWidth-1+pageStartX, height-vOffset-lineheight+3+(2*j)+0.5);
            ctx.stroke();
        }
		j=null;
        ctx.strokeStyle="#999";
        ctx.beginPath();
        ctx.moveTo(width-fontWidth*(lines[i][0].length-col+1)+fontWidth-4+pageStartX, height-vOffset-lineheight+3);
        ctx.lineTo(width-fontWidth*(lines[i][0].length-col+1)+fontWidth-4+pageStartX, height-vOffset-lineheight+3+4);
        ctx.lineTo(width-fontWidth*(lines[i][0].length-col+1)+fontWidth+pageStartX, height-vOffset-lineheight+3+4);
        ctx.stroke();
    }
    else{
        ctx.fillStyle="gold";
        ctx.beginPath();
        ctx.moveTo(width+fontWidth*col+pageStartX, height-vOffset-lineheight+3);
        ctx.lineTo(width+fontWidth*col+pageStartX, height-vOffset-lineheight+3+lineheight);
        ctx.lineTo(width+fontWidth*col+fontWidth+pageStartX, height-vOffset-lineheight+3+lineheight);
        ctx.lineTo(width+fontWidth*col+fontWidth+pageStartX, height-vOffset-lineheight+3+4);
        ctx.lineTo(width+fontWidth*col+fontWidth-4+pageStartX, height-vOffset-lineheight+3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle="#333";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(var i=1; i<6; i++){
            ctx.moveTo(width+fontWidth*col+1+pageStartX, height-vOffset-lineheight+3+(2*i)+0.5);
            ctx.lineTo(width+fontWidth*col+fontWidth-1+pageStartX, height-vOffset-lineheight+3+(2*i)+0.5);
            ctx.stroke();
        }
		j=null;
        ctx.strokeStyle="#999";
        ctx.beginPath();
        ctx.moveTo(width+fontWidth*col+fontWidth-4+pageStartX, height-vOffset-lineheight+3);
        ctx.lineTo(width+fontWidth*col+fontWidth-4+pageStartX, height-vOffset-lineheight+3+4);
        ctx.lineTo(width+fontWidth*col+fontWidth+pageStartX, height-vOffset-lineheight+3+4);
        ctx.stroke();
    }
    ctx.fillStyle=foreground;
}

function sortNumbers(a,b){
    return a - b;
}

function paint(forceCalc, forceScroll){
    if(typeToScript || findForcePaint){
	var nd = new Date();
	nd = nd.getTime();
    var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');
	ctx.clearRect(0,0, 2000,2500);
	ctx.fillStyle = '#ccc';
	ctx.fillRect(0, 0, editorWidth, document.getElementById('canvas').height);
    ctx.fillStyle = foreground;
    
    
    //draw pages
    var pageStartX= Math.round((editorWidth-fontWidth*87-24)/2);
    var pageStartY = lineheight;
	ctx.font=font;
	ctx.lineWidth = 1;
    for(var i=0; i<=pageBreaks.length;i++){
		if (pageStartY-vOffset>1200)break;
		if (pageStartY-vOffset>-lineheight*72){
			ctx.fillStyle = background;
			ctx.fillRect(pageStartX, pageStartY-vOffset, fontWidth*87, lineheight*70);
			ctx.strokeStyle = '#000';
			ctx.strokeRect(pageStartX, pageStartY-vOffset, Math.round(fontWidth*87), lineheight*70);
			ctx.strokeStyle='#999';
			ctx.strokeRect(pageStartX-2, pageStartY-vOffset-2, Math.round(fontWidth*87)+4, lineheight*70+4);
			ctx.fillStyle=foreground;
			if(i>0)ctx.fillText(String(i+1)+'.', 550+pageStartX, pageStartY-vOffset+85);
		}
        pageStartY+= lineheight*72;
    }
    pageStartY=null;
    // use this opportunity to put in the grey backing
	// also figure out the current page
    if(!forceCalc){
		var greyHeight = lineheight*9+2;
	    var wrapVars=WrapVariableArray[0];
	    ctx.fillStyle='#ddd';
        var count=0;
        for (var i=0;i<lines.length;i++){
			if(pos.row==i)currentPage=count*1+1;
            if(pageBreaks.length!=0 && pageBreaks[count]!=undefined && pageBreaks[count][0]==i){
				if(pos.row==i)currentPage+=1;
                greyHeight=72*lineheight*(count+1)+9*lineheight+2;
                if(pageBreaks[count][2]!=0){
                    greyHeight-=pageBreaks[count][2]*lineheight;
                    if(lines[i][1]==3)greyHeight+=lineheight;
                }
                count++;
            }
            if(i<linesNLB.length){
                for(var j=0; j<linesNLB[i].length; j++){
                    greyHeight+=lineheight;
                    if (lines[i][1]==0){
                       if(linesNLB[i][j]!=0)ctx.fillRect(wrapVars[1]-3+pageStartX,greyHeight-vOffset,61*fontWidth+6, 14);
                       if(lines[i][0]=='' && j==0)ctx.fillRect(wrapVars[1]-3+pageStartX,greyHeight-vOffset,61*fontWidth+6, 14);
                    }
                }
				j=null;
            }
			if(greyHeight-vOffset>1200)break;
        }
		greyHeight=wrapVars=count=i=null;
    }
	// draw finds if there are any
	if(findArr.length!=0 || findReplaceArr.length!=0){
		drawFindArr(ctx, pageStartX);
	}
    //Draw in range if there is one
    if(pos.row!=anch.row || anch.col!=pos.col){
        drawRange(ctx, pageStartX);
        if(!pasting)selection();
    }
    
    ctx.fillStyle=foreground;
    
    ctx.font=font;
	var y = lineheight*11;
    var cos=[];
    var latestCharacter = '';
    var count = 0;
    var sceneCount=0;
    //Stary Cycling through lines
	for (var i=0; i<lines.length; i++){
        if (lines[i][1]==0)sceneCount++;
        //make sure there are parenthesese for parenthetics
        if(lines[i][1]==4){
            if(lines[i][0].charAt(0)!='(')lines[i][0]='('+lines[i][0];
            if(lines[i][0].charAt(lines[i][0].length-1)!=')')lines[i][0]=lines[i][0]+')';
        }
        //set correct line height
        //on page breaks
        var bb=false;
        if(!forceCalc){
            if(pageBreaks.length!=0 && pageBreaks[count]!=undefined && pageBreaks[count][0]==i){
                if(pageBreaks[count][2]==0){
                    y=72*lineheight*(count+1)+11*lineheight;
                    count++;
                    if(count>=pageBreaks.length){
                        count=pageBreaks.length-2;
                    }
                }
                else{
                    bb=true;
                }
            }
        }
        //Don't render things way outside the screen
        if(!forceCalc && !bb && y-vOffset<-200){
            y+=(lineheight*linesNLB[i].length);
            if(i==pos.row){
                var cursorY=y;
                wrappedText=[];
            }
        }
        else if(!forceCalc && !bb && y-vOffset>1200)break;
        else{
            // calc if there are notes in this line
            var notesArr=[];
            if(viewNotes){
                for (note in notes){
                    if(notes[note][0]==i)notesArr.push(notes[note][1]);
                }
            }
            notesArr = notesArr.sort(sortNumbers);
            var type = lines[i][1];
            //Cursor position
            if (i==pos.row){
                var cursorY = y-lineheight;
                if (type == 1)var cursorX =WrapVariableArray[1][1];
                else if (type == 0)var cursorX =WrapVariableArray[0][1];
                else if (type == 3)var cursorX =WrapVariableArray[3][1];
                else if (type == 2)var cursorX =WrapVariableArray[2][1];
                else if (type == 4)var cursorX =WrapVariableArray[4][1];
                else if (type == 5)var cursorX =WrapVariableArray[5][1];
                var thisRow = true;
                var wrappedText = [];
            }
            if (i==anch.row){
                var anchorY = y-lineheight;
                var anchorThisRow = true;
                var anchorWrappedText = []
            }
            
            var lineContent = lines[i][0];
            
            // Use the same wrapping procedure over and over
            // just define an array to pass into it
            //wrapVars[0]=character length before wrap
            //wrapVars[1]= distace from edge it should be placed ay
            //wrapVars[2]= bool, align right
            //wrapVars[3]= bool, uppercase
            //wrapVars[4]=number of line breaks after
            if (type==0)var wrapVars=WrapVariableArray[0];
            else if(type==1) var wrapVars = WrapVariableArray[1];
            else if(type==2) var wrapVars = WrapVariableArray[2];
            else if(type==3) var wrapVars =  WrapVariableArray[3];
            else if(type==4) var wrapVars = WrapVariableArray[4];
            else if(type==5) var wrapVars = WrapVariableArray[5];
            
            var wordsArr = lineContent.split(' ');
            var word = 0;
            linesNLB[i]=[];
            // tc = total characters, used
            // mainly to put in notes
            var tc = 0;
            var anchEFound=false;
            var eFound=false;
            while(word<wordsArr.length){
                var itr=0;
				//for if the one word is too big
				if (wordsArr[word].length>=wrapVars[0]){
					var printString = wordsArr[word];
					if (wrapVars[3]==1)printString= printString.toUpperCase();
					var altPrintString = printString;
                    var notesInThisLine=[];
                    if(viewNotes){
                        for(note in notesArr){
                            if (notesArr[note]>=lines[i][0].length-printString.length){
                                altPrintString=altPrintString.substr(0,notesArr[note]-tc+notesInThisLine.length)+" "+altPrintString.substr(notesArr[note]-tc+notesInThisLine.length);
                                drawNote(wrapVars[1], y, notesArr[note]-tc+notesInThisLine.length, ctx, i, pageStartX);
                                notesInThisLine.push(notesArr[note]);
                            }
                        }
                    }
					ctx.fillText(altPrintString, wrapVars[1]+pageStartX , y-vOffset);
					linesNLB[i].push(printString.length);
					y+=lineheight;
					if(wrapVars[4]==2){
                        linesNLB[i].push(0);
                        y+=lineheight;
                    }
					word++;
					if(thisRow)wrappedText.push(printString.length);
                    if(anchorThisRow)anchorWrappedText.push(printString.length);
				}
                else if (wordsArr.slice(word).join().length<wrapVars[0]){
                    var printString = wordsArr.slice(word).join(' ');
                    if(lines[i][1]==2 && latestCharacter!='' && lines[i][0].toUpperCase()==latestCharacter.toUpperCase())printString+=" (Cont'd)";
                    if(lines[i][1]==0)latestCharacter='';
                    if (wrapVars[3]==1)printString= printString.toUpperCase();
                    if (wrapVars[2]==1)ctx.textAlign='right';
                    var altPrintString = printString;
                    var notesInThisLine=[];
                    if(viewNotes){
                        for(note in notesArr){
                            if (notesArr[note]>=lines[i][0].length-printString.length){
                                altPrintString=altPrintString.substr(0,notesArr[note]-tc+notesInThisLine.length)+" "+altPrintString.substr(notesArr[note]-tc+notesInThisLine.length);
                                drawNote(wrapVars[1], y, notesArr[note]-tc+notesInThisLine.length, ctx, i, pageStartX);
                                notesInThisLine.push(notesArr[note]);
                            }
                        }
                    }
                    if(printString!='')ctx.fillText(altPrintString, wrapVars[1]+pageStartX , y-vOffset);
                    ctx.textAlign='left';
                    word=wordsArr.length;
                    linesNLB[i].push(printString.length);
                    y+=lineheight;
                    if(wrapVars[4]==2){
                        linesNLB[i].push(0);
                        y+=lineheight;
                    }
                    if(thisRow)wrappedText.push(printString.length);
                    if(anchorThisRow)anchorWrappedText.push(printString.length);
                }
                else{
                    var itr=0;
                    while(wordsArr.slice(word, word+itr).join(' ').length<wrapVars[0]){
                        newLineToPrint=wordsArr.slice(word, word+itr).join(' ');
                        itr++;
                    }
					if (wrapVars[3]==1)newLineToPrint= newLineToPrint.toUpperCase();
                    var altNewLineToPrint = newLineToPrint;
                    var notesInThisLine=[];
                    if(viewNotes){
                        for(note in notesArr){
                            if (notesArr[note]>=tc && notesArr[note]<=tc+newLineToPrint.length){
                                altNewLineToPrint=altNewLineToPrint.substr(0,notesArr[note]-tc+notesInThisLine.length)+" "+altNewLineToPrint.substr(notesArr[note]-tc+notesInThisLine.length);
                                drawNote(wrapVars[1], y, notesArr[note]-tc+notesInThisLine.length, ctx, i, pageStartX);
                                notesInThisLine.push(notesArr[note]);
                            }
                        }
                    }
                    tc+=newLineToPrint.length+1;
                    ctx.fillText(altNewLineToPrint, wrapVars[1]+pageStartX, y-vOffset);
                    linesNLB[i].push(newLineToPrint.length);
                    y+=lineheight;
                    word+=itr-1;
                    itr =0;
                    if (thisRow)wrappedText.push(newLineToPrint.length);
                    if(anchorThisRow)anchorWrappedText.push(newLineToPrint.length);
                }
                //remve a line if it's dialog
                //followed by parenthetics
                if(lines[i][1]==3 && i+1!=lines.length && lines[i+1][1]==4 && linesNLB[i][linesNLB[i].length-1]==0){
                    linesNLB[i].pop();
                    y-=lineheight;
                }
                
                if(bb && linesNLB[i].length==pageBreaks[count][2]){
                    if(lines[i][1]==3)ctx.fillText("(MORE)", WrapVariableArray[2][1]+pageStartX, y-vOffset);
                    y=72*lineheight*(count+1)+11*lineheight;
                    if(lines[i][1]==3){
                        ctx.fillText(latestCharacter.toUpperCase()+" (CONT'D)", WrapVariableArray[2][1]+pageStartX, y-vOffset);
                        y+=lineheight;
                    }
                    count++;
                    bb=false;
                    if(pos.row==i){cos.push(count);}
                }
            }
            var thisRow=false;
            var anchorThisRow=false;
        }
        //setup stuff of Con't
        if(lines[i][1]==2)var latestCharacter = lines[i][0];
        if(i==pos.row){
            currentScene=sceneCount;
            var notesOnThisLine=notesArr; 
        }
        if(count>=pageBreaks.length){
            count=pageBreaks.length-2;
        }
    }
    // End Looping through lines
    // delete extra data in linesNLB
    while(lines.length<linesNLB.length){
        linesNLB.pop();
    }
      
    // Cursor
	var d= new Date();
	var newMilli = d.getMilliseconds();
	var diff = newMilli-milli;
	var cursor = false;
	if (diff>0 && diff<500){
        cursor = true;
    }
    if (diff<0 && diff<-500){
        cursor = true;
    }
	d=newMilli=diff=i=null;
    if(wrappedText){
        var wrapCounter=0;
        var lrPosDiff = pos.col;
        var totalCharacters=wrappedText[wrapCounter];
        while (pos.col>totalCharacters){
            wrapCounter++;
            totalCharacters+=1+wrappedText[wrapCounter];
        }
        totalCharacters-=wrappedText[wrapCounter];
        //count notes on this line
        // and figure which is before the cursor
        var notesSpacingDiff=0;
        for (note in notesOnThisLine){
            var n = notesOnThisLine[note];
            if(n<pos.col && n>totalCharacters && n<totalCharacters+wrappedText[wrapCounter]){
                notesSpacingDiff++;
            }
			n=null;
        }
		note=null;
        //console.log(notesSpacingDiff);
        if(cos.length>0 && wrapCounter>=pageBreaks[cos[0]-1][2]){
            cursorY=72*cos[0]*lineheight+9*lineheight;
            if(lines[pos.row][1]==3){
                cursorY+=lineheight*2;
                wrapCounter-=pageBreaks[cos[0]-1][2];
            }
            else if(lines[pos.row][1]==1){
                wrapCounter-=pageBreaks[cos[0]-1][2];
                cursorY+=lineheight;
            }
        }
        if(cursor){
            var lr = cursorX+((pos.col-totalCharacters+notesSpacingDiff)*fontWidth)+pageStartX;
            if(lines[pos.row][1]==5)lr -= lines[pos.row][0].length*fontWidth;
            ud = 2+cursorY+(wrapCounter*lineheight)-vOffset;
            try{
                ctx.fillRect(lr,ud,2,17);
            }
            catch(err){}
			lr=null;
        }
		wrapCounter=lrPosDiff=totalCharacters=null;
    }
      
    
    //Start work on frame and buttons and stuff
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(2,2);
    ctx.lineTo(2,document.getElementById('canvas').height-1);
    ctx.lineTo(editorWidth, document.getElementById('canvas').height-1);
    ctx.lineTo(editorWidth,2);
    //ctx.lineTo(2,2);
    ctx.stroke();
    //
    // bottom status bar
    ctx.fillStyle = "#ccc";
    ctx.fillRect(2,document.getElementById('canvas').height-24, editorWidth-25, 24);
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 1;
    ctx.beginPath()
    ctx.moveTo(1.5,document.getElementById('canvas').height-25.5);
    ctx.lineTo(1.5,document.getElementById('canvas').height-1.5);
    ctx.lineTo(editorWidth-23.5,document.getElementById('canvas').height-1.5);
    ctx.lineTo(editorWidth-23.5,document.getElementById('canvas').height-25.5);
    ctx.closePath();
	ctx.strokeStyle = "#999";
    ctx.stroke();
    ctx.beginPath()
    ctx.moveTo(0.5,document.getElementById('canvas').height-24.5);
    ctx.lineTo(0.5,document.getElementById('canvas').height-0.5);
    ctx.lineTo(editorWidth-22.5,document.getElementById('canvas').height-0.5);
    ctx.lineTo(editorWidth-22.5,document.getElementById('canvas').height-24.5);
    ctx.closePath();
    // write current page number
    ctx.strokeStyle = "#333";
    ctx.stroke();
    var tp=pageBreaks.length+1;
    var pages="Page "+currentPage+" of "+tp;
    ctx.font="10pt sans-serif";
    ctx.fillStyle="#000"
    ctx.fillText(pages, editorWidth-150, document.getElementById('canvas').height-8);
    // write current scene number
    var txt="Scene "+ currentScene + " of " + scenes.length;
    ctx.fillText(txt, 15, document.getElementById('canvas').height-8);
    ctx.font = font;
	txt=wordArr=pages=tp=null;
    //Make ScrollBar
    scrollArrows(ctx);
    scrollBar(ctx, y);


    if(forceCalc)pagination();
    if(mouseDownBool && pos.row<anch.row && mouseY<40)scroll(-20);
    if(mouseDownBool && pos.row>anch.row && mouseY>document.getElementById('canvas').height-50)scroll(20);
    if(forceScroll=="enter"){
        if (ud>document.getElementById('canvas').height)scroll(600);
    }
    else if(forceScroll){
        if((2+cursorY+(wrapCounter*lineheight)-vOffset)>document.getElementById('canvas').height-60){
            scroll(45);
        }
        else if(ud<45){
            scroll(-45);
        }
    }
    }
	//var nnd = new Date();
	//console.log(nnd.getTime()-nd);
}
