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
goog.require('goog.ui.Dialog');
goog.require('goog.editor.Command');
goog.require('goog.editor.Field');
goog.require('goog.editor.plugins.BasicTextFormatter');
goog.require('goog.editor.plugins.EnterHandler');
goog.require('goog.editor.plugins.HeaderFormatter');
goog.require('goog.editor.plugins.LinkBubble');
goog.require('goog.editor.plugins.LinkDialogPlugin');
goog.require('goog.editor.plugins.ListTabHandler');
goog.require('goog.editor.plugins.LoremIpsum');
goog.require('goog.editor.plugins.RemoveFormatting');
goog.require('goog.editor.plugins.SpacesTabHandler');
goog.require('goog.editor.plugins.UndoRedo');
goog.require('goog.ui.editor.DefaultToolbar');
goog.require('goog.ui.editor.ToolbarController');

/* Closure Compiler for JS changes all function
 * names. To have human readable function names
 * in the html, need to attach those functions
 * to the window object; as done here.
 */
window['markAsRead'] = markAsRead;
window['newMessage'] = newMessage;
window['deleteMessage'] = deleteMessage;
window['deleteThread'] = deleteThread;
window['EOV'] = EOV;
window['changeFormat'] = changeFormat;
window['deleteThread'] = deleteThread;
window['newThread'] = newThread;
window['tabs'] = tabs;
window['exportScripts'] = exportScripts;
window['hideExportPrompt'] = hideExportPrompt;
window['renameScript'] = renameScript;
window['hideRenamePrompt'] = hideRenamePrompt;
window['renamePrompt'] = renamePrompt;
window['hideNewScriptPrompt'] = hideNewScriptPrompt;
window['createScript'] = createScript;
window['hideSpellCheck'] = hideSpellCheck;
window['s_change'] = s_change;
window['s_ignore'] = s_ignore;
window['s_ignore_all'] = s_ignore_all;
window['replaceAndFind'] = replaceAndFind;
window['replaceText'] = replaceText;
window['hideFindReplacePrompt'] = hideFindReplacePrompt;
window['hideFindPrompt'] = hideFindPrompt;
window['findUp'] = findUp;
window['findDown'] = findDown;
window['shareScript'] = shareScript;
window['hideSharePrompt'] = hideSharePrompt;
window['hideEmailPrompt'] = hideEmailPrompt;
window['emailScript'] = emailScript;
window['save'] = save;
window['setJustPasted'] = setJustPasted;
window['paint'] = paint;
window['init'] = init;
window['paste'] = paste;
window['cut'] = cut;
window['emailNotifyShare'] = emailNotifyShare;
window['emailNotifyMsg'] = emailNotifyMsg;
window['removeAccess'] = removeAccess;
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
var autosaveBool = true;
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

/**
 * Run on body onload. Checks the brower, 
 * and the mode the user is running in
 * and from that alters the DOM and sets
 * up event listeners.
 * Then calls for script data
 */
function init(){
	// basicaly, quit stuff if in IE,
	// tell them to get a better browser
	if(goog.userAgent.IE==true){
		goog.dom.removeNode(goog.dom.getElement('loading'));
		goog.dom.flattenElement(goog.dom.getElement('canvas'));
		goog.dom.removeNode(goog.dom.getElement('gtb'));
		return;
	}
	// set up function for resizing windows
	var vsm = new goog.dom.ViewportSizeMonitor();
	goog.events.listen(vsm, goog.events.EventType.RESIZE, function(e) {setElementSizes("r");});
	// then initial resize
	setElementSizes("i");
	
	// sets up key handler
	var docKh = new goog.events.KeyHandler(document);
	goog.events.listen(docKh, 'key', keyEvent)
	
	// set up mouse click handler
	goog.events.listen(document, goog.events.EventType.MOUSEMOVE, mouseMove)
	goog.events.listen(document, goog.events.EventType.MOUSEDOWN, mouseDown)
	goog.events.listen(document, goog.events.EventType.MOUSEUP, mouseUp)
	
	// set up mouse wheel handler
	var MouseWheelHandler = goog.events.MouseWheelHandler;
	var MOUSEWHEEL = MouseWheelHandler.EventType.MOUSEWHEEL;
    var mwh = new MouseWheelHandler(goog.dom.getElement('canvas'));
	goog.events.listen(mwh, MOUSEWHEEL, handleMouseWheel);
	goog.events.listen(window, 'unload', function(e){goog.events.unlisten(mwh, MOUSEWHEEL, handleMouseWheel);});
	
	// setup context menu calls
	window.oncontextmenu = contextmenu;
	
	if (EOV=='viewer'){
		// strip dom elements if this is viewer
		var f = goog.dom.getElement('format');
		f.style.visibility='hidden'
		f.disabled=true;
		goog.dom.removeNode(goog.dom.getElement('toolbarSave'));
		goog.dom.removeNode(goog.dom.getNextElementSibling(goog.dom.getElement('toolbarRedo')));
		goog.dom.removeNode(goog.dom.getElement('toolbarRedo'));
		goog.dom.removeNode(goog.dom.getElement('toolbarUndo'));
		goog.dom.removeNode(goog.dom.getElement('toolbarSpellcheck'));
		goog.dom.removeNode(goog.dom.getElement('rename'));
		goog.dom.removeNode(goog.dom.getElement('save'));
		goog.dom.removeNode(goog.dom.getNextElementSibling(goog.dom.getElement('duplicate')));
		goog.dom.removeNode(goog.dom.getElement('duplicate'));
		goog.dom.removeNode(goog.dom.getElement('undo'));
		goog.dom.removeNode(goog.dom.getNextElementSibling(goog.dom.getElement('redo')));
		goog.dom.removeNode(goog.dom.getElement('redo'));
		goog.dom.removeNode(goog.dom.getElement('editTitlePage'));
		goog.dom.removeNode(goog.dom.getNextElementSibling(goog.dom.getElement('tag')));
		goog.dom.removeNode(goog.dom.getElement('tag'));
		goog.dom.removeNode(goog.dom.getNextElementSibling(goog.dom.getElement('spellCheck')));
		goog.dom.removeNode(goog.dom.getElement('spellCheck'));
		goog.dom.removeNode(goog.dom.getNextElementSibling(goog.dom.getElement('findReplace')));
		goog.dom.removeNode(goog.dom.getElement('findReplace'));
		goog.dom.removeNode(goog.dom.getElement('format0'));
		goog.dom.removeNode(goog.dom.getElement('format1'));
		goog.dom.removeNode(goog.dom.getElement('format2'));
		goog.dom.removeNode(goog.dom.getElement('format3'));
		goog.dom.removeNode(goog.dom.getElement('format4'));
		goog.dom.removeNode(goog.dom.getElement('format5'));
		goog.dom.removeNode(goog.dom.getElement('revision'));
		goog.dom.removeNode(goog.dom.getElement('collaborators'));
		goog.dom.removeNode(goog.dom.getElement('titlePageHref'));
	}
	else{
		// sets up the save button and rename thing
		// if this is an editor, not viewer
		var f = goog.dom.getElement('saveButton');
		f.style.visibility='visible';
		f.disabled=false;
		goog.events.listen(goog.dom.getElement('title'), goog.events.EventType.MOUSEOVER, function(e){
			var d = goog.dom.getElement('title');
			d.style.backgroundColor = 'LightSkyBlue';
			d.style.border = '1px #666 solid';
			d.style.margin = '0';
			d.style.textShadow = 'none'
		})
		goog.events.listen(goog.dom.getElement('title'), goog.events.EventType.MOUSEOUT, function(e){
			var d = goog.dom.getElement('title');
			d.style.backgroundColor = '#6484DF';
			d.style.border = 'none';
			d.style.margin = '3px';
			d.style.textShadow = '1px 1px 1px #999'
		})
		goog.events.listen(goog.dom.getElement('title'), goog.events.EventType.CLICK, function(){
			renamePrompt()
		})
	}
	// Prevent a bunch of defaults
	// i.e. in some browsers, pressing enter in these
	// text fields altomaticly opens a new, bad window
	goog.events.listen(goog.dom.getElement('find_input'), goog.events.EventType.KEYDOWN, function(e){if(e.keyCode==13){e.preventDefault();findDown()}});
	goog.events.listen(goog.dom.getElement('fr_find_input'), goog.events.EventType.KEYDOWN, function(e){if(e.keyCode==13){e.preventDefault();findDown()}});
	goog.events.listen(goog.dom.getElement('renameField'), goog.events.EventType.KEYDOWN, function(e){if(e.keyCode==13){e.preventDefault();renameScript()}});
    goog.events.listen(goog.dom.getElement('subject'), goog.events.EventType.KEYDOWN, function(e){if(e.keyCode==13)e.preventDefault()});
	
	// if user types in a dom text field,
	// don't have that show up in the canvas
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
	goog.events.listen(goog.dom.getElement('fr_find_input'), goog.events.EventType.FOCUS, function(e){
		typeToScript=false;
		findForcePaint=true;
		commandDownBool=false
	});
	goog.events.listen(goog.dom.getElement('fr_find_input'), goog.events.EventType.BLUR, function(e){
		typeToScript=true;
		findForcePaint=false;
		commandDownBool=false
	});
	goog.events.listen(goog.dom.getElement('fr_find_input'), goog.events.EventType.KEYUP, function(e){findInputKeyUp(e, "r")});
	goog.events.listen(goog.dom.getElement('fr_replace_input'), goog.events.EventType.FOCUS, function(e){
		typeToScript=false;
		findForcePaint=true;
		commandDownBool=false
	});
	goog.events.listen(goog.dom.getElement('fr_replace_input'), goog.events.EventType.BLUR, function(e){
		typeToScript=true;
		findForcePaint=false;
		commandDownBool=false
	});
	
	// set up menus (file, edit, view, share)
	// ** needs to be done after DOM elements
	// stipped because of Editor, or Viewer window
	fMenu = new goog.ui.Menu();
	fMenu.decorate(goog.dom.getElement('fileMenu'))
	fMenu.setPosition(0, 64)
	fMenu.setAllowAutoFocus(true);
	fMenu.setVisible(false);
	goog.events.listen(goog.dom.getElement('file'), goog.events.EventType.CLICK, openMenu);
	goog.events.listen(goog.dom.getElement('file'), goog.events.EventType.MOUSEOVER, topMenuOver);
	goog.events.listen(goog.dom.getElement('file'), goog.events.EventType.MOUSEOUT, topMenuOut);
	goog.events.listen(fMenu, 'action', menuSelect)
	goog.events.listen(goog.dom.getElement('canvas'), goog.events.EventType.CLICK, function(e){typeToScript=true})
	
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
	
	// Register Shortcut keys for save, export, undo, redo, find
	var shortcutHandler = new goog.ui.KeyboardShortcutHandler(document);
	shortcutHandler.registerShortcut('save', 'meta+s');
	shortcutHandler.registerShortcut('undo', 'meta+z');
	shortcutHandler.registerShortcut('redo', 'meta+shift+z');
	shortcutHandler.registerShortcut('export', 'meta+e');
	shortcutHandler.registerShortcut('find', 'meta+f');
	shortcutHandler.setAlwaysPreventDefault(true)
	goog.events.listen(
	       shortcutHandler,
	       goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,
	       shortcutTriggered
	);
	// then update the DOM to reflect shortcut keys on differant OSs
	var sKeys= [['save','S'],['export', 'E'],['undo', 'Z'], ['redo', 'Shift Z'], ['find', 'F']];
	var meta = (goog.userAgent.MAC==true ? "⌘" : "Ctrl+")
	for (i in sKeys){
		var d = goog.dom.getElement(sKeys[i][0]+'-shortcut');
		if (d!=null){goog.dom.setTextContent(d, meta+sKeys[i][1]);}
	}
	
	
	// try to call server for list of contacts
	// and fill in autocomplete fields
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
	
	// decorate toolbar
	var tb = new goog.ui.Toolbar();
	tb.decorate(goog.dom.getElement('gtb'));
	goog.events.listen(tb, goog.ui.Component.EventType.ACTION, toolbarActions)
	goog.dom.getElement('gtb').style.visibility = 'visible';
	goog.dom.getElement('sidebar').style.visibility = 'visible';
	
	// finally, figure out resource_id and call for content
	resource_id=window.location.href.split('=')[1];
	goog.net.XhrIo.send('scriptcontent',
		parseInitialJSON,
		'POST',
		'resource_id='+resource_id
	)
}

/**
 * Gets script data and puts it all in
 * it's place.
 * @ param e goog.event.BroswerEvent
 * JSON from the server with all the script data
 */
function parseInitialJSON(e){
	// if script was not found on server, show that
    if(e.target.getResponseText()=='not found'){
        lines = [["Sorry, the script wasn't found.",1]];
        paint();
        return;
    }
	// else, parse json, put stuff in place
    var p = e.target.getResponseJson();
	// p[0] = script title
	// p[1] = lines of text in the script
	// p[2] = spelling data
	// p[3] = notes on the script
	// p[4] = collaborators on script
	// p[5] = contacts list
	// p[6] = autosave setting

	// set up title
    var title=p[0];
    goog.dom.getElement('title').innerHTML=title;
	document.title = title;

	// set up lines of text into global variable
    var x = p[1];
    for(var i=0; i<x.length; i++){
        lines.push([x[i][0], x[i][1]]);
    }
	// if this script has just been started
	// put cursor at the end of line
    if(lines.length==2){
        pos.row=anch.row=1;
        pos.col=anch.col=lines[1][0].length;
    }

	// put in spelling data into global variable
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
    // put notes into global variable
    for(i in p[3]){
        notes.push(p[3][i]);
    }

	// take collaborators list and put them
	// into dom
    var collabs=p[4];
    var c = goog.dom.getElement('hasAccess');
    for (i in collabs){
        var TR = c.appendChild(document.createElement('tr'));
        TR.id=collabs[i];
        TR.appendChild(document.createElement('td')).appendChild(document.createTextNode(collabs[i]));
        var newA = TR.appendChild(document.createElement('td')).appendChild(document.createElement('a'));
        newA.appendChild(document.createTextNode('Remove Access'));
        newA.href="javascript:removeAccess('"+collabs[i]+"')";
    }

	// well, shit. This looks redundant. Gotta test this
	// out and see why this is here. Done on init()
	var emailAutoComplete = new goog.ui.AutoComplete.Basic(p[5], goog.dom.getElement('recipient'), true);
	var shareAutoComplete = new goog.ui.AutoComplete.Basic(p[5], goog.dom.getElement('collaborator'), true);

	// changes the autosave bool to user prefrence
	autosaveBool = (p[6]=='true' ? true : false);

	// open up scene tab
    tabs(0);

	// figure out character and scene names
    characterInit();
    sceneIndex();
	noteIndex();

	// put actual dom cursor into hidden text box
    goog.dom.getElement('ccp').focus();
    goog.dom.getElement('ccp').select();

	// set starting position for save button
    goog.dom.getElement('saveButton').value="Saved";
    goog.dom.getElement('saveButton').disabled=true;

	//make info bar visible
	goog.dom.getElement('info').style.width=(editorWidth-6)+"px";
	goog.dom.getElement('info').style.visibility="visible";
	fillInfoBar();

	// set up canvas for printing, then print and repeat
	var canvas = goog.dom.getElement('canvas');
    var ctx = canvas.getContext('2d');
    wrapAll();
	pagination();
    setInterval('paint()', 25);

	// stuff is running, gracefully fade to standard GUI
	var n = new goog.fx.dom.FadeOutAndHide(goog.dom.getElement('loading'), 500);
	goog.events.listen(n, goog.fx.Animation.EventType.END, function(e){goog.dom.removeNode(goog.dom.getElement('loading'))})
	n.play()
}

/**
 * Sets the size of elements based
 * on browser size. Does it on load
 * and more on resize.
 * @ param {string} v 
 * "r" indicates window resize
 * "i" indicates initial setup
 */
function setElementSizes(v){
	var s = goog.dom.getViewportSize();
	goog.style.setSize(goog.dom.getElement('container'), s);
	goog.dom.getElement('canvas').height = s.height - 60-38;
	goog.dom.getElement('canvas').width = s.width-320;
	editorWidth=s.width-323;
	goog.dom.getElement('insertNewNote').style.marginLeft=editorWidth-630*1+"px";
	goog.dom.getElement('sidebar').style.height = (s.height-70)+'px';
	goog.dom.getElement('info').style.width = (editorWidth-6)+'px';
	if(v=="r"){
		scroll(0);
		paint();
	}
}

/**
 * When a key is pressed, figures
 * out what to do with it
 * @ param {goog event} e key event
 */
function keyEvent(e){
	if(e.platformModifierKey){
		// if ctrl or comman is pressed, the shortcut
		// handler should take care of it
		return;
	}
	else if(e.target.id=="ccp"){
		// else if the browser carret in the hidden text
		// box, figure out what to do with it
		
		// start by noting the time, so the fake
		// carret blinks correctly
		var d= new Date();
		milli = d.getMilliseconds();
		if(e.keyCode==13)enter();
		else if(e.keyCode==38)upArrow(e);
		else if(e.keyCode==40)downArrow(e);
		else if(e.keyCode==39)rightArrow(e);
		else if(e.keyCode==37)leftArrow(e);
		else if(e.keyCode==8)backspace(e);
		else if(e.keyCode==46)deleteButton();
		else if(e.keyCode==16)return;
		else if(e.keyCode==9){e.preventDefault(); tab();}
		else{handlekeypress(e)}
		
		// if key wasn't enter, delete or a hand full of other thigns,
		// figure out if the carret is on screen. If not, scroll
		if(ud<0 && typeToScript && e.keyCode!=13 && e.keyCode!=46){
			scroll(ud-400);
		}
		if(ud>goog.dom.getElement('canvas').height-80 && typeToScript && e.keyCode!=13 && e.keyCode!=46 && e.keyCode!=8 ){
			scroll(ud-400);
		}
		//console.log(e.keyCode);
	}
	if(typeToScript){
		// clear the hidden textarea
		if (anch.row==pos.row && pos.col==anch.col){
			goog.dom.getElement("ccp").value="";
		}
		goog.dom.getElement('ccp').focus();
		goog.dom.getElement('ccp').select();
	}
	
	// hmm... this probabaly isn't necessary....
	lineFormatGuiUpdate();
	fillInfoBar();
}

/**
 * When a shortcut is pressed, do it
 */
function shortcutTriggered(e){
	if(e.identifier=="save")save(0);
	else if(e.identifier=="undo")undo();
	else if(e.identifier=="redo")redo();
	else if(e.identifier=="export")exportPrompt();
	else if(e.identifier=="find")findPrompt();
}

/**
 * Takes MouseDown Event, figures out what
 * to do with it.
 * @ param { goog.events.BrowserEvent } e
 * gives the mousedown event with associated data
 */
function mouseDown(e){
	// only do stuff if canvas is active
	// i.e. popups and dom sutff isn't being
	// interacted with
	if(typeToScript){
		// check spelling if it's time
		if(checkSpell)ajaxSpell(pos.row);
		// if a suggest box is open, quit this
		// function. the box has it's own logic
		if(goog.dom.getElement('suggestBox')!=null){
			return;
		}
		else if(goog.dom.getElement('context_menu')!=null){
			// if theres a DOM context menu, take it's action
			// it it's being clicked. If not, just remove it
			if(e.target.className=="contextUnit"){
				changeFormat(e.target.id.replace("cm",""));
			}
			goog.dom.getElement('context_menu').parentNode.removeChild(goog.dom.getElement('context_menu'));
		}
	    else{
			// ok, so the user is interacting with a drawing
			// ont he canvas. 
			
			// figure out where the fake scroll bar is
			var height = goog.dom.getElement('canvas').height;
			var pagesHeight = (pageBreaks.length+1)*72*lineheight;
			var barHeight = ((height)/pagesHeight)*(height-39);
			if (barHeight<20)barHeight=20;
			if (barHeight>=height-39)barHeight=height-39;
			var topPixel = (vOffset/(pagesHeight-height))*(height-39-barHeight)+headerHeight;
			
			if(e.clientX<editorWidth-100 && e.clientY>60 && e.target.id=="canvas"){
				// user is clicking on text, put the anchor there
				mouseDownBool=true;
				mousePosition(e,"anch");
				lineFormatGuiUpdate();
			}
			else if(e.clientX<editorWidth && e.clientX>editorWidth-20 && e.clientY>topPixel && e.clientY<topPixel+barHeight){
				// user is clicking on the scroll bar
				scrollBarBool=true;
			}
		}
		goog.dom.getElement('ccp').focus();
		goog.dom.getElement('ccp').select();
	}
}

/**
 * Takes MouseUp Event, figures out what
 * to do with it.
 * @ param { goog.events.BrowserEvent } e
 * gives the mouseup event with associated data
 */
function mouseUp(e){
	// if there is a character or scene 
	// suggestion box, remove it
	if(goog.dom.getElement('suggestBox')!=null){
		goog.dom.removeNode(goog.dom.getElement('suggestBox'));
	}
	// if the focus is the canvas text, 
	// put focus back in hidden box
	if(typeToScript){
		goog.dom.getElement('ccp').focus();
        goog.dom.getElement('ccp').select();
	}
	mouseDownBool=false;
	scrollBarBool=false;
	
	// update a bunch of GUI thigns
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
	lineFormatGuiUpdate();
}

/**
 * Figure mouse position, and what that means
 * for various GUI thigns
 */
function mouseMove(e){
	// if mouse is down on the fake scroll
	// bar, handle that.
	if(scrollBarBool)scrollBarDrag(e);
	// reset our programs notion of here
	mouseY=e.clientY;
	// this means the user is draggin across
	// drawn text, so move the caret postion
	if (mouseDownBool){
		mousePosition(e,"pos");
		lineFormatGuiUpdate();
	}
	// figure out if mouse if hovering over
	// fake scrollbar, change mouse pointer if true
	var height = goog.dom.getElement('canvas').height;
	var pagesHeight = (pageBreaks.length+1)*72*lineheight;
	var barHeight = ((height)/pagesHeight)*(height-39);
	if (barHeight<20)barHeight=20;
	if (barHeight>=height-39)barHeight=height-39;
	var topPixel = (vOffset/(pagesHeight-height))*(height-39-barHeight)+headerHeight;
	if (e.clientX<editorWidth && e.clientX>editorWidth-20){
		goog.dom.getElement('canvas').style.cursor = ((e.clientY>topPixel && e.clientY<topPixel+barHeight) ? "default" : "text");
	}
	else{
		//check if the mouse if over a note on the script
		var found=false;
		for(i in notesPosition){
			if (notesPosition[i][0]<e.clientX && notesPosition[i][0]+fontWidth>e.clientX){
				if(notesPosition[i][1]+headerHeight+6<e.clientY && notesPosition[i][1]+lineheight+headerHeight+6>e.clientY){
					found=notesPosition[i][2];
					break;
				}
			}
		}
		// if the mouse is over a note, make it clickable
		if (found!=false){
			goog.dom.getElement('canvas').style.cursor='pointer';
			goog.events.listen(goog.dom.getElement('canvas'), goog.events.EventType.CLICK, notesDialogFromScript);
		}
		else{
			goog.dom.getElement('canvas').style.cursor = 'text';
			goog.events.unlisten(goog.dom.getElement('canvas'), goog.events.EventType.CLICK, notesDialogFromScript);
		}
	}
}

/**
 * Simple, scroll when users scrolls on canvas
 * @ param { goog.events.BrowserEvent} e 
 */
function handleMouseWheel(e){
	scroll(e.deltaY*2)
}

/**
 * Figures out the posision in the text
 * where the mouse is. Used for onclick
 * and onmousemove. God this is messy. 
 * Redo it.
 * @ param { goog.event.BrowserEvent} e browser event
 * @ param { string } w Either "anch" for moving the
 * selection anchor, or "pos" for moving the caret
 */
function mousePosition(e, w){
	// pageBreaks
	// [0] first line on new page
	// [1] how many wrapped lines on the page (max 56)
	// [2] where the line is split across pages
	
	// We want the caret flashing NOW, so
	// update the milli
	var d = new Date();
	milli = d.getMilliseconds();
	// set some starting points
	var pageCount = 0;
	var mp = e.clientY+vOffset-31;
	var y = 15*lineheight+3;
	var oldY = 0;
	//start cying though lines
	// looking for the clicked spot
	for(i in lines){
		// Cycle thorugh lines. at the end of each
		// cycle, oldY will be the y of the line,
		// y will be the y of the end of the line.
		oldY=y;
		
		// if this line is at a page break
		// reset y to page line
		if(pageBreaks.length!=0 && pageBreaks[pageCount]!=undefined && pageBreaks[pageCount][0]==i){
			// for if the line at page break isn't split
			if(pageBreaks[pageCount][2]==0){
				y=72*lineheight*(pageCount+1)+10*lineheight+headerHeight+3-31;
				pageCount++;
			}
			else{
				// for if line at page break does split across page
				y=72*lineheight*(pageCount+1)+10*lineheight+headerHeight+3;
				y+=(linesNLB[i].length-pageBreaks[pageCount][2])*lineheight-31;
				if(lines[i][1]==3)y+=lineheight;
				y-=(lineheight*linesNLB[i].length);
				pageCount++;
			}
		}
		y+=(lineheight*linesNLB[i].length);
		
		// mp is the y of the mouse click on the
		// script. If y is larger than mp, then
		// caret position should go to this line.
		if(y>mp){
			// Now we know what line was clicked on,
			// so figure out where in that line to go
			
			// first which wrapped line to go on
			if(pageBreaks.length!=0 && pageBreaks[pageCount-1]!=undefined && pageBreaks[pageCount-1][0]==i && pageBreaks[pageCount-1][2]!=0){
				// if wrapeed lines span two pages
				if ((mp-oldY)/lineheight<pageBreaks[pageCount-1][2]){
					var l = Math.round((mp-oldY)/lineheight+0.7);
				}
				else if (mp<72*lineheight*(pageCount)+10*lineheight+headerHeight){
					var l = pageBreaks[pageCount-1][2];
				}
				else{
					var l = Math.round((lineheight*linesNLB[i].length-y+mp)/lineheight+0.7);
				}
			}
			else{
				// else if wrapped lines don't span two pages
				var l = Math.round((lineheight*linesNLB[i].length-y+mp)/lineheight+0.7);
			}
			
			// var l is now which wrapped line of text
			// the cursor was at
			// tc is total character in lines before
			var j=0;
			var tc=0;
			while(j+1<l){
				tc+=linesNLB[i][j].length+1;
				j++;
			}
			// var r is additional characters added
			// bases on x of click
			var r;
			if(lines[i][1]!=5){
				r=Math.round((e.clientX-Math.round((editorWidth-fontWidth*87-24)/2)-WrapVariableArray[lines[i][1]][1])/fontWidth);
			}
			else{
				r=Math.round((e.clientX-Math.round((editorWidth-fontWidth*87-24)/2)-WrapVariableArray[lines[i][1]][1]+(lines[i][0].length*fontWidth))/fontWidth);
			}
			//now change r for inline notes
			//start and end of this line in this row is tc and tc+linesNLB[i][j]
			for (note in notes){
				// if it's in the correct row
				if (i*1==notes[note][0]*1){
					//do one thing for transition
					// one thing elsewise
					
					if(lines[i][1]!=5){
						if(notes[note][1]>=tc && notes[note][1]<=tc+r){
							r--;
						}
					}
					else{
						if(notes[note][1]>r){
							r++;
						}
					}
				}
			}
			// don't let carret position be less than zero
			// or more than wrapped line length
			if(r<0)r=0;
			try{
				if(r>linesNLB[i][j].length)r=linesNLB[i][j].length;
			}
			catch(err){
				console.log(j)
				return
			}
			
			// add it all together
			tc+=r;
			
			// don't let carret position be less than zero
			// or more than wrapped line length
			if(tc<0)tc=0;
			if(tc>lines[i][0].length)tc=lines[i][0].length;
			
			// set pos or anch
			if (w=="anch"){
				pos.row = anch.row = i*1;
				pos.col = anch.col = tc*1;
			}
			else{
				pos.row = i*1;
				pos.col = tc*1;
			}
			
			// everything is solved, so quit function
			// otherwise would keep cyling thoruhg lines
			break;
		}
	}
	fillInfoBar();
}

/**
 * Simple thing for cut
 */
function cut(){
	if(EOV=='viewer')return;
	if(pos.row!=anch.row || pos.col!=anch.col)backspace();
	saveTimer();
}

/**
 * Simple thing for copy. Need not do anything anymore
 */
function copy(){
	if(EOV=='viewer')return;
}

/**
 * Complicated thing to paste text
 * to canvas. Called just after the browser paste
 */
function paste(){
	if(EOV=='viewer')return;
	if(!justPasted){
		var forceCalc = false;
    	saveTimer();
	    redoQue=[];
	    if(pos.row!=anch.row || pos.col!=anch.col)backspace();
	    var j=false;
	    var data=goog.dom.getElement('ccp').value;
	    var r = new RegExp( "\\n", "g" );
	    if (data.split(r).length>1) {
	        var tmp=data.split(r);
	        var tmpArr=[];
	        for (x in tmp){
	            if(tmp[x]!='' && tmp[x]!=null)tmpArr.push([tmp[x],1])
	        }
	        data=JSON.stringify(tmpArr);
			x=tmp=tmpArr=null;
	    }
	    undoQue.push(['paste',pos.row,pos.col,data]);
	    //undoQue[x][0] ==paste
	    //[1]=pos.row
	    //[2]=pos.col
	    //[3]=data
	    //[4]=added to line
	    //[5]=deleted empty line at end
	    if(data[0]=='[' && data[1]=='[')j=true;
	    if(!j){
	        lines[pos.row][0]=lines[pos.row][0].slice(0,pos.col)+ data + lines[pos.row][0].slice(pos.col);
	        pos.col+=goog.dom.getElement('ccp').value.length;
	        anch.col=pos.col;
	    }
	    else{
			forceCalc = true;
	        var arr=JSON.parse(data);
	        if (lines[pos.row][0]==''){
	            lines[pos.row][1]=arr[0][1];
	        }
	        if (lines[pos.row][1]==arr[0][1]){
	            undoQue[undoQue.length-1].push(1);
	            var tmp=[lines[pos.row][0].slice(pos.col), lines[pos.row][1]];
	            lines[pos.row][0]=lines[pos.row][0].slice(0,pos.col)+arr[0][0];
	            var i=1;
	            var p=pos.row+1;
	            while(i<arr.length){
	                lines.splice(p,0,arr[i]);
	                p++;
	                i++;
	            }
	            lines.splice(p,0,tmp);
	            if(lines[p][0]=='' || lines[p][0]==' '){
	                lines.splice(p,1);
	                undoQue[undoQue.length-1].push(0);
	            }
	            else{undoQue[undoQue.length-1].push(1)}
	        }
	        else{
	            undoQue[undoQue.length-1].push(0);
	            var tmp=[lines[pos.row][0].slice(pos.col), lines[pos.row][1]];
	            lines[pos.row][0]=lines[pos.row][0].slice(0,pos.col);
	            pos.row++;
	            lines.splice(pos.row,0,arr[0]);
	            var i=1;
	            var p=pos.row+1;
	            while(i<arr.length){
	                lines.splice(p,0,arr[i]);
	                p++;
	                i++;
	            }
	            lines.splice(p,0,tmp);
	            if(lines[p][0]=='' || lines[p][0]==' '){
	                lines.splice(p,1);
	                undoQue[undoQue.length-1].push(0);
	            }
	            else{undoQue[undoQue.length-1].push(1)}
	        }
	        pos.row=anch.row=p;
	        pos.col=anch.col=0;
	        if(pos.row>=lines.length){
	            pos.row=anch.row=lines.length-1
	            pos.col=anch.col=lines[pos.row][0].length;
	        }
	    }
	    pasting=false;
		if(forceCalc){
			sceneIndex();
		}
		goog.dom.getElement('ccp').value="";
		justPasted=true;
		setTimeout("setJustPasted()", 50);
	}
}

/**
 * This is sucky. Sometimes paste fires twice.
 * should have fixed that. Instead, set up this
 * variable that keeps track if there was just
 * a paste (50 milliseconds or less), and keeps
 * the past funtion from going again.
 */
function setJustPasted(){
	if(EOV=='viewer')return;
	justPasted=false;
}

/**
 * When the user drags the drawn scrollbar
 * scroll the page
 * @ param {goog.events.BrowserEvent} e mouse position
 */
function scrollBarDrag(e){
	var diff = mouseY-e.clientY;
	var height = goog.dom.getElement('canvas').height-50;
	var pagesHeight = (pageBreaks.length+1)*72*lineheight;
	vOffset-=pagesHeight/height*diff;
	if (vOffset<0)vOffset=0;
	var pagesHeight = (pageBreaks.length+1)*72*lineheight-goog.dom.getElement('canvas').height+20;
	if(vOffset>pagesHeight)vOffset=pagesHeight+20;
}

/**
 * Um, scroll. This function controls the
 * scrolling. Where the canvas drawing is 
 * scrolled to is stored and contorled by 
 * vOffset. 
 * @ param {int} v How many pixels to scroll
 */
function scroll(v){
	vOffset+=v;
	if (vOffset<0)vOffset=0;
	var pagesHeight = (pageBreaks.length+1)*72*lineheight-goog.dom.getElement('canvas').height+20;
	if(vOffset>pagesHeight)vOffset=pagesHeight+20;
	var d= new Date();
	milli = d.getMilliseconds();
	// if a suggest box is open, redraw it in position
	if(goog.dom.getElement('suggestBox')!=null){
		createSuggestBox((lines[pos.row][1]==0 ? "s" : "c"));
	}
}


/**
 * Action handler for toobar GUI
 * @ param {goog.events.Event} e 
 */
function toolbarActions(e){
	var c = e.target.getId().replace('toolbar','')
	if(c=='New')newScriptPrompt();
	else if(c=='Save')save(0);
	else if(c=='Export')exportPrompt();
	else if(c=='Undo')undo();
	else if(c=='Redo')redo();
	else if(c=='InsertNote')newThread();
	else if(c=='Spellcheck')launchSpellCheck();
	else if(c=='Email')emailPrompt();
}

/**
 * In the right column, there's a scene
 * tab and notes tab. Switch between them
 * Awe shit. Why is there stying in this function
 * make it calss based or something
 *
 * @ param {int} v ; a zero indexed tab thingy
 * only two tabs, so v is 0 or 1
 */
function tabs(v){
	var t = ["sceneTab","noteTab"]
	for(i in t){
		var c = goog.dom.getElement(t[i]);
		if(i==v){
			c.style.backgroundColor="#3F5EA6";
			c.style.color='white';
			goog.dom.getElement(t[i].replace("Tab","s")).style.display="block";
		}
		else{
			c.style.backgroundColor="#6C8CD5";
			c.style.color='black';
			goog.dom.getElement(t[i].replace("Tab","s")).style.display="none";
		}
	}
}



///////////////////// Typing on Keyboard//////////////////////
/**
 * A bunch of funtions handling basic keyboard inputs. Inserting letters
 * backspace, delete, direction arrows, ets
 */


/**
 * Basicly typing. When a user types a letter, 
 * this puts it in the script.
 * @ param {goog.event.KeyEvent} e Button pressed
 */
function handlekeypress(e) {
	//console.log(e.keyCode)
	
	// don't do anything if this isn't 
	// an editor window
	if(EOV=='viewer')return;
	
	// don't do anything if the focus
	// isn't on the canvas
	if (findForcePaint)return;
	
	// only accept these ranges of keyCodes
	// as provided by goog.events.KeyEvent
	// found here http://code.google.com/p/closure-library/source/browse/trunk/closure/goog/events/keycodes.js
	if((e.keyCode>=48 && e.keyCode<=90) || (e.keyCode>=96 && e.keyCode<=111) || (e.keyCode>=187 && e.keyCode<=222) || e.keyCode==32 || e.keyCode==186){
		if(typeToScript && !commandDownBool){
			e.preventDefault();
			//flush redoque
			redoQue=[];
			var d= new Date();
			milli = d.getMilliseconds();
			if (e.which!=13 && e.which!=37 && e.which!=0 && e.which!=8){
				// if there is a drawn text selection,
				// delete that part selected
				if(pos.row!=anch.row || pos.col!=anch.col)deleteButton();
				
				// Add the letter to the line at the right spot
				lines[pos.row][0] = lines[pos.row][0].slice(0,pos.col) + String.fromCharCode(e.charCode) +lines[pos.row][0].slice(pos.col);
				
				// Put this action in the undoQue
				undoQue.push([String.fromCharCode(e.charCode), pos.row, pos.col]);
				
				// more the caret one space forward
				pos.col++;
				anch.col=pos.col;
				anch.row=pos.row;
				
				// update scene list, if this is a Slugline
				if (lines[pos.row][1]==0)updateOneScene(pos.row);
				
				// recreate suggest box if this is
				// a character or scene foramted line
				if (lines[pos.row][1]==2){
					createSuggestBox('c');
				}
				if(lines[pos.row][1]==0){
					createSuggestBox('s');
				}
				//shift notes
				for(x in notes){
					if(pos.row==notes[x][0]){
						if (pos.col-1<=notes[x][1])notes[x][1]=notes[x][1]+1;
					}
				}
				
				// something has changed, so start
				// autosave timer
				saveTimer();
			}
			
			// If the user has a find and replace box open,
			// rescan now the the text has changed
			// basicly, shitty programing
			if(goog.dom.getElement('find_div').style.display=="block")findInputKeyUp({"which":1000}, "f");
			if(goog.dom.getElement('find_replace_div').style.display=="block")findInputKeyUp({"which":1000}, "r");
			
			// put the focus back on the hidden
			// text box
			goog.dom.getElement('ccp').focus();
	        goog.dom.getElement('ccp').select();
		}
	}
	var p = getLines(pos.row);
	if(p)pagination();
}

/**
 * What do when a user hits backspace
 * @ param {goog.event.KeyEvent} e keypress
 */
function backspace(e){
	
	// if this isn't an editor window
	// do nothing
	if(EOV=='viewer')return;
	
	// if the focus is on the canvas, continue
	if(typeToScript){
		//set autosave timer
		saveTimer();
		
		//flush redo que
		redoQue=[];
		
		// prevent default
		if(e)e.preventDefault();
		
		// remember if we need to calc
		// or update things at the end.
		// assume no
		var calcSlug=(lines[pos.row][1]==0 ? true : false)
		
		// simple case, nothing selected
		if(pos.row==anch.row && pos.col==anch.col){
			// if the carret is at the very start, do nothing
			if(pos.col==0 && pos.row==0) return;
		
			if(pos.col==0){
				// if the carret is at the first position
				//in a line, combine this line and the one
				// before
				
				//shift notes
				for(x in notes){
					if(pos.row<notes[x][0]){
						notes[x][0]=notes[x][0]-1;
					}
					else if(pos.row==notes[x][0]){
						notes[x][1]=notes[x][1]+lines[pos.row-1][0].length;
						notes[x][0]=notes[x][0]-1;
					}
					if (notes[x][1]<0)notes[x][1]=0;
				}
				//actually do the operation
				var elem = lines[pos.row][1];
				var j = lines[pos.row][0];
				lines.splice(pos.row,1);
				var newPos = lines[pos.row-1][0].length;
				lines[pos.row-1][0] = lines[pos.row-1][0]+j;
				pos.col=newPos;
				pos.row--;
				
				// add to undoque
				undoQue.push(['back',pos.row, pos.col,'line',elem]);
				
				
				
				// remove suggest, if it's there
				if(goog.dom.getElement('suggestBox')!=null){goog.dom.getElement('suggestBox').parentNode.removeChild(goog.dom.getElement('suggestBox'))};
				
				linesNLB.splice(pos.row+1,1)
				getLines(pos.row);
				pagination();
			}
			else{
				// Removes just one character. Simplest
				// backspace
				
				// add to undo que
				undoQue.push(['back',pos.row, pos.col,lines[pos.row][0][pos.col-1]]);
				
				// do it
				lines[pos.row][0] = lines[pos.row][0].slice(0,pos.col-1)+lines[pos.row][0].slice(pos.col);
				pos.col--;
				// shift notes
				for(x in notes){
					if(pos.row==notes[x][0]){
						if (pos.col<notes[x][1])notes[x][1]=notes[x][1]-1;
					}
				}
				
				// recalc line wrap. if wrapping changes
				// length, run pagination
				var p = getLines(pos.row);
				if(p)pagination();
			}
			
			// finally, make sure pos=anch
			anch.col=pos.col;
			anch.row=pos.row;
		}
		else{
			// This big ass 'else' is for deleting
			// a range.
			
			// remove suggest box
			if(goog.dom.getElement('suggestBox')!=null){goog.dom.getElement('suggestBox').parentNode.removeChild(goog.dom.getElement('suggestBox'))};
			
			// It's easier to start by putting the focus after 
			// the anchor, just so it's always the same operation
			var switchPos =false;
			if(anch.row>pos.row)switchPos=true;
			if(anch.row==pos.row && anch.col>pos.col)switchPos=true;
			if(switchPos){
				var coor = anch.row;
				anch.row = pos.row;
				pos.row = coor;
				coor = anch.col;
				anch.col = pos.col;
				pos.col = coor;
			}
			
			// count how many items are added to the undo que
			var undoCount=0;
			
			// while anch != pos, keep deleting, character by character
			while(pos.col!=anch.col || pos.row!=anch.row){
				undoCount++;
				if(lines[pos.row][1]==0)slug=true;
				if(pos.col==0){
					// if character to delete is virtual
					// nlb
					
					// shift notes
					for(x in notes){
						if(pos.row<notes[x][0]){
							notes[x][0]=notes[x][0]-1;
						}
						else if(pos.row==notes[x][0]){
							notes[x][1]=notes[x][1]+lines[pos.row-1][0].length;
							notes[x][0]=notes[x][0]-1;
						}
						if (notes[x][1]<0)notes[x][1]=0;
					}
					
					// combine two lines of text
					var elem = lines[pos.row][1];
					var j = lines[pos.row][0];
					lines.splice(pos.row,1);
					var newPos = lines[pos.row-1][0].length;
					lines[pos.row-1][0] = lines[pos.row-1][0]+j;
					pos.col=newPos;
					pos.row--;
					undoQue.push(['back',pos.row, pos.col,'line',elem]);
				}
				else{
					// if character to delete is just 
					// a character of text
					undoQue.push(['back',pos.row, pos.col,lines[pos.row][0][pos.col-1]]);
					lines[pos.row][0] = lines[pos.row][0].slice(0,pos.col-1)+lines[pos.row][0].slice(pos.col);
					pos.col--;
					//shift notes
					for(x in notes){
						if(pos.row==notes[x][0]){
							if (pos.col<notes[x][1])notes[x][1]=notes[x][1]-1;
						}
					}
				}
			}
			undoQue.push(['br',undoCount]);
			
			//recalc stuff after
			// waste of recalc, but lazy
			linesNLB=linesNLB.slice(0,pos.row);
			for(var i=pos.row;i<lines.length;i++){
				getLines(i);
			}
			pagination();
		}
		
		// if a slug line has been changed,
		// redo that part of the scene list
		if (calcSlug)updateOneScene(pos.row);
		
		// if a find or replace window is open,
		// rescan text for matches
		if(goog.dom.getElement('find_div').style.display=="block")findInputKeyUp({"which":1000}, "f");
		if(goog.dom.getElement('find_replace_div').style.display=="block")findInputKeyUp({"which":1000}, "r");
	}
}

/**
 * Logic of the Delete button
 * Called when user presses delete
 * button while focused on the canvas
 * script.
 */
function deleteButton(){
	// if this isn't an editor window
	// do nothing
	if(EOV=='viewer')return;
	if(typeToScript){
	saveTimer();
	redoQue=[];
	
	// remove suggest box if visible
	if(goog.dom.getElement('suggestBox')!=null){goog.dom.getElement('suggestBox').parentNode.removeChild(goog.dom.getElement('suggestBox'))};
	
	// keep variable to know if we need
	// to calc in the end. assume not
	var slug=false;
	var forceCalc=false;
	
	// for if pos == anch and need to do a simple,
	// one character delete
	if(pos.row==anch.row && pos.col==anch.col){
		
		// if this is the last posible
		// position in the script. Delete
		// nothing, return
		if(pos.col==(lines[pos.row][0].length) && pos.row==lines.length-1) return;
		
		// remember to recalc scene list
		if (lines[pos.row][1]==0)var slug=true;
		
		if(pos.col==(lines[pos.row][0].length)){
			// if caret is at end of line, combine
			// two lines of text
			
			// shift notes
			for(x in notes){
				if(pos.row+1==notes[x][0]){
					notes[x][1]=notes[x][1]+lines[pos.row][0].length;
					notes[x][0]=notes[x][0]-1;
				}
				else if(pos.row<notes[x][0]){
					notes[x][0]=notes[x][0]-1;
				}
				if (notes[x][1]<0)notes[x][1]=0;
			}
			undoQue.push(['delete',pos.row,pos.col,'line',lines[pos.row+1][1]]);
			if (lines[pos.row+1][1]==0)slug=true;
			
			// actually do it
			var j = lines[pos.row+1][0];
			lines.splice((pos.row+1),1);
			lines[pos.row][0]+=j;
			forceCalc=true;
			
			//recalc lines
			linesNLB.splice(pos.row+1,1)
			getLines(pos.row);
			pagination();
		}
		else{
			// delete one character
			undoQue.push(['delete',pos.row,pos.col,lines[pos.row][0][pos.col]]);
			lines[pos.row][0] = lines[pos.row][0].slice(0,pos.col)+lines[pos.row][0].slice(pos.col+1);
			
			//shift notes
			for(x in notes){
				if(pos.row==notes[x][0]){
					if (pos.col<notes[x][1])notes[x][1]=notes[x][1]-1;
				}
			}
			// recalc line wrap. if wrapping changes
			// length, run pagination
			var p = getLines(pos.row);
			if(p)pagination();
		}
	}
	else{
		// for if pos != anch and need to delete a range
		
		forceCalc=true;
		// put the focus after the anchor, so
		// the operation is always the same
		var switchPos = false;
		if(anch.row>pos.row)switchPos=true;
		if(anch.row==pos.row && anch.col>pos.col)switchPos=true;
		if(switchPos){
			var coor = anch.row;
			anch.row = pos.row;
			pos.row = coor;
			coor = anch.col;
			anch.col = pos.col;
			pos.col = coor;
		}
		
		// count how many things are deleted
		var undoCount=0;
		
		// while pos!=anch, delete character by character
		while(pos.col!=anch.col || pos.row!=anch.row){
			undoCount++;
			if(lines[pos.row][1]==0)slug=true;
			if(pos.col==0){
				// if caret is at the start of 
				// line, delete nlb and combine
				// two line of text
				
				//shift notes
				for(x in notes){
					if(pos.row+1==notes[x][0]){
						notes[x][1]=notes[x][1]+lines[pos.row][0].length;
						notes[x][0]=notes[x][0]-1;
					}
					else if(pos.row<notes[x][0]){
						notes[x][0]=notes[x][0]-1;
					}
					if (notes[x][1]<0)notes[x][1]=0;
				}
				undoQue.push(['delete',pos.row-1,lines[pos.row-1][0].length,'line',lines[pos.row][1]]);
				var j = lines[pos.row][0];
				lines.splice(pos.row,1);
				var newPos = lines[pos.row-1][0].length;
				lines[pos.row-1][0] = lines[pos.row-1][0]+j;
				pos.col=newPos;
				pos.row--;
				slug=true;
				linesNLB.splice(pos.row+1,1)
			}
			else{
				// delete one character of text
				undoQue.push(['delete',pos.row,pos.col,lines[pos.row][0][pos.col-1]]);
				lines[pos.row][0] = lines[pos.row][0].slice(0,pos.col-1)+lines[pos.row][0].slice(pos.col);
				pos.col--;
				//shift notes
				for(x in notes){
					if(pos.row==notes[x][0]){
						if (pos.col<notes[x][1])notes[x][1]=notes[x][1]-1;
					}
				}
			}
		}
		undoQue.push(['dr',undoCount]);
		

		// recalc wraping on current line
		// then figure pages
		getLines(pos.row);
		pagination();
	}
	
	// re calc stuff as needed
	
	if(forceCalc==true){
		sceneIndex();
		scroll(0);
	}
	if (slug)updateOneScene(pos.row);
	
	// if find or replace div is open
	// recalc regex as needed
    if(goog.dom.getElement('find_div').style.display=="block")findInputKeyUp({"which":1000}, "f");
	if(goog.dom.getElement('find_replace_div').style.display=="block")findInputKeyUp({"which":1000}, "r");
	}
}

/**
 * called when enter is pressed and 
 * handles all posible enter situations
 * including creating new line of text
 * or interacting other normal GUI
 */
function enter(){
	// if this is an editor window, do nothing
	if(EOV=='viewer')return;
	
	// if suggest box is open get the
	// text of selection, put it in
	if(goog.dom.getElement('suggestBox')!=null){
        saveTimer();
        var len = lines[pos.row][0].length;
		var txt = googSuggestMenu.getHighlighted().getCaption();
		lines[pos.row][0]= txt;
        undoQue.push(['paste', pos.row, pos.col, lines[pos.row][0].substr(len)]);
		goog.dom.getElement('suggestBox').parentNode.removeChild(goog.dom.getElement('suggestBox'));
		pos.col=anch.col=lines[pos.row][0].length;
		var p = getLines(pos.row);
		if(p)pagination();
	}
	else if(typeToScript){
		// if canvas is users focus add
		// a new line of text
		saveTimer();
		if(checkSpell)ajaxSpell(pos.row);
		
		// remove trailing white space.... don't
		// know why
		lines[pos.row][0]=lines[pos.row][0].replace(/\s+$/,"");
		
		//shift notes
		for(x in notes){
			if(pos.row<notes[x][0]){
				notes[x][0]=notes[x][0]+1;
			}
			if(pos.row==notes[x][0] && pos.col<notes[x][1]){
				notes[x][1]=notes[x][1]-pos.col;
				notes[x][0]=notes[x][0]+1;
			}
		}
		undoQue.push(['enter', pos.row, pos.col]);
		redoQue=[];
		if(lines[pos.row][1]==2)characterIndex(lines[pos.row][0]);
		
		// actually do it. split lines of text
		var j = lines[pos.row][0].slice(0,pos.col);
		var k = lines[pos.row][0].slice(pos.col);
		lines[pos.row][0] = j;
		
		// figure out format of next line of text
		if (lines[pos.row][1] == 0)var newElem = 1;
		else if (lines[pos.row][1] == 1)var newElem = 2;
		else if (lines[pos.row][1] == 2)var newElem = 3;
		else if (lines[pos.row][1] == 4){
			//with parenthetical, get rid of pesky ")"
			var newElem = 3;
			if(k.slice(-1)==")"){
				k=k.slice(0,-1)
			}
		}
		else if (lines[pos.row][1] == 3)var newElem = 2;
		else if (lines[pos.row][1] == 5)var newElem = 0;
		
		// put second half of text in new line
		var newArr = [k,newElem];
		lines.splice(pos.row+1,0,newArr);
		pos.row++;
		pos.col=0;
		anch.row=pos.row;
		anch.col=pos.col;
		
		// if find or replace is open, recalc
		// regex
		if(goog.dom.getElement('find_div').style.display=="block")findInputKeyUp({"which":1000}, "f");
		if(goog.dom.getElement('find_replace_div').style.display=="block")findInputKeyUp({"which":1000}, "r");
		
		// recalcs position of all sorts of stuff
		linesNLB.splice(pos.row,0,"");
		getLines(pos.row-1);
		getLines(pos.row);
		pagination();
		
	}
	sceneIndex();
	// if find or replace is open, recalc
	// regex
	if(goog.dom.getElement('find_div').style.display=="block")findInputKeyUp({"which":1000}, "f");
	if(goog.dom.getElement('find_replace_div').style.display=="block")findInputKeyUp({"which":1000}, "r");
}

/**
 * when user presses 'tab' reformat current
 * line, or whatever else
 */
function tab(){
	if(EOV=='viewer')return;
	if(typeToScript){
		// remove suggest box if exists
		if(goog.dom.getElement('suggestBox')!=null){goog.dom.getElement('suggestBox').parentNode.removeChild(goog.dom.getElement('suggestBox'))};
		saveTimer();
		undoQue.push(['format',pos.row,pos.col,lines[pos.row][1], 'tab']);
		redoQue=[];
		
		// remember to recalc scenes if needed
		var slug=false;
		if (lines[pos.row][1]==0)var slug=true;
		
		// what type of line is this now
		var type = lines[pos.row][1];
		
		// change it to the correct new format
		if (type==1){
			lines[pos.row][1]=0;
			slug=true;
		}
		else if (type==0)lines[pos.row][1]=2;
		else if (type==2)lines[pos.row][1]=1;
		else if (type==3)lines[pos.row][1]=4;
		else if (type==4)lines[pos.row][1]=3;
		else if (type==5){
			lines[pos.row][1]=0;
			slug=true;
		}
		
		// re calc scene list if needed
		if(slug)sceneIndex();
		
		// add parentheses if switched to parenthetical
		if(lines[pos.row][1]==4){
			if(lines[pos.row][0].charAt(0)!='('){
				lines[pos.row][0]='('+lines[pos.row][0];
				pos.col++;
				anch.col++;
			}
			if(lines[pos.row][0].charAt(lines[pos.row][0].length-1)!=')')lines[pos.row][0]=lines[pos.row][0]+')';
		}
		
		// remove parentheses if switched from parenthetical
		if(lines[pos.row][1]==3){
			if(lines[pos.row][0].charAt(0)=='('){
				lines[pos.row][0]=lines[pos.row][0].substr(1);
				pos.col--;
				anch.col--;
			}
			if(lines[pos.row][0].charAt(lines[pos.row][0].length-1)==')')lines[pos.row][0]=lines[pos.row][0].slice(0,-1);
		}
		
		//recalc line wraping/pagination
		var p = getLines(pos.row);
		if(p)pagination()
	}
}

/**
 * Changes the format of the line of text
 * i.e. Dialog -> Action, or whatever
 * @ param { integer } v number for the new line format
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
    undoQue.push(['format',pos.row,pos.col,lines[pos.row][1],v]);
    redoQue=[];
	//change format
    lines[pos.row][1]=v;
	// deselect drawn text
    anch.col=pos.col;
    anch.row=pos.row;
	// handle parentheses if applicalble
    if(lines[pos.row][1]==4){
        if(lines[pos.row][0].charAt(0)!='('){
            lines[pos.row][0]='('+lines[pos.row][0];
            pos.col++;
            anch.col++;
        }
        if(lines[pos.row][0].charAt(lines[pos.row][0].length-1)!=')')lines[pos.row][0]=lines[pos.row][0]+')';
    }
    if(lines[pos.row][1]==3){
        if(lines[pos.row][0].charAt(0)=='('){
            lines[pos.row][0]=lines[pos.row][0].substr(1);
            pos.col--;
            anch.col--;
        }
        if(lines[pos.row][0].charAt(lines[pos.row][0].length-1)==')')lines[pos.row][0]=lines[pos.row][0].slice(0,-1);
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
		goog.dom.getElement('format').selectedIndex=lines[pos.row][1];
		for(i=0; i<=5; i++){
			eMenu.getChild('format'+i).setChecked((lines[pos.row][1]==i ? true : false));
		}
	}
}

/**
 * Creates a menu of character or scene
 * names the user might by typing. Uses
 * goog.UI.Menu()
 * @ param { string } d denotes character "c"
 * or scene "s"
 */
function createSuggestBox(d){
	if(EOV=='viewer')return;
	// remove old box if applicable
	if(goog.dom.getElement('suggestBox')!=null){
		goog.dom.removeNode(goog.dom.getElement('suggestBox'));
	}
	// get correct list of characters or scenes (v)
	// and the position of the left edge of the proposed
	// suggest box
	if(d=='c'){
        var v=characters;
        var left=WrapVariableArray[2][1]+Math.round((editorWidth-fontWidth*87-24)/2)+'px';
    }
    else{
        var v=[];
        for(i in scenes){
            v.push([scenes[i][0].split(') ').splice(1).join(') ')]);
        }
        var left=WrapVariableArray[0][1]+Math.round((editorWidth-fontWidth*87-24)/2)+'px';
    }
	var l=lines[pos.row][0].length;
	var part=lines[pos.row][0].toUpperCase();
	for (x in v){
		var s = v[x][0].substr(0,l).toUpperCase();
		if (part==s){
			//create box now if doens't exist
			if(goog.dom.getElement('suggestBox')==null){
				var box = document.body.appendChild(document.createElement('div'));
				box.id='suggestBox';
				box.style.position='fixed';
				box.style.top=ud+headerHeight+9+lineheight+"px";
				box.style.left=left;
				box.className = 'goog-menu'
			}
			// Scene list could double up
			// Check here to make sure it's
			// unique
            var found=false;
            if(d=='s'){
                var c = box.childNodes;
                for (i in c){
                    if(v[x][0]==c[i].value)found=true;
                }
				c=null;
            }
			// if it isn't found in suggest box
			// already (i.e. "unique"), then put
			// put it in
            if(!found){
                var item = box.appendChild(document.createElement('div'));
                item.className="goog-menuitem";
                item.appendChild(document.createTextNode(v[x][0]))
                item.value=v[x][0];
				item=null;
            }
			found=null;
		}
	}
	// If there is only one item in the suggest box
	// and the user has typed it in full, remove the
	// suggest box
	if(goog.dom.getElement('suggestBox')!=null){
		if (goog.dom.getElement('suggestBox').childNodes.length==1){
			if(goog.dom.getElement('suggestBox').firstChild.value.toUpperCase()==lines[pos.row][0].toUpperCase())goog.dom.removeNode(goog.dom.getElement('suggestBox'))
		}
	}
	// Finally, if there is still a suggest box with
	// options in it, decorate it as a menu with
	// goog.ui.Menu()
	if(goog.dom.getElement('suggestBox')!=null){
		var menuDiv = goog.dom.getElement('suggestBox');
		googSuggestMenu = new goog.ui.Menu();
		googSuggestMenu.decorate(menuDiv)
		googSuggestMenu.setAllowAutoFocus(true);
		googSuggestMenu.setHighlightedIndex(0);
		// set up event for when option is selected
		// i.e. put correct text in, move fake caret
		// add to undoQue, remove suggest box
		goog.events.listen(googSuggestMenu, 'action', function(e) {
			var txt = e.target.getCaption();
			var len = lines[pos.row][0].length;
			lines[pos.row][0]=txt;
		    undoQue.push(['paste', pos.row, pos.col, lines[pos.row][0].substr(len)]);
			pos.col=anch.col=lines[pos.row][0].length;
			goog.dom.removeNode(goog.dom.getElement('suggestBox'))
	    });
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
		while (r.test(lines[i][0])==true){
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
	var l = (findArr.length!=0 ? goog.dom.getElement('find_input').value.length : goog.dom.getElement('fr_find_input').value.length);
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


function ajaxSpell(v, r){
	if(EOV=='viewer')return;
    checkSpell=false;
    var data = lines[v][0];
    if (lines[v][1]==0 || lines[v][1]==2 || lines[v][1]==5){
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
		'data='+escape(j)+'&resource_id='+resource_id
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
    var c = goog.dom.getElement('ccp');
    c.value=sel;
	if(!findForcePaint){
		c.focus();
		c.select();
	}
}


function contextmenu(e){
	if(EOV=='viewer')return;
	if(e.clientX>headerHeight && e.clientX<editorWidth-100 && e.clientY-headerHeight>40 && e.target.id=="canvas"){
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
    var pagesHeight = (pageBreaks.length+1)*72*lineheight-goog.dom.getElement('canvas').height;
    if(vOffset>pagesHeight)vOffset=pagesHeight;
}

/**
 * Moving the position of the Caret when
 * canvas is selected and user presses up
 * arrow
 * @ param { goog.events.BrowserEvent } e
 * gives the mousedown event with associated data
 */
function upArrow(e){
	if(typeToScript && goog.dom.getElement('suggestBox')==null){
		if (pos.row==0 && pos.col==0)return;

		var wrapVars = WrapVariableArray[lines[pos.row][1]];
		// Only do calculations if 
		// there is wrapped text
		if(lines[pos.row][0].length>wrapVars[0]){
			var lineLengths=[];
			for(i in linesNLB[pos.row]){
				lineLengths.push(linesNLB[pos.row][i].length)
			}
			// now we have the variable lineLengths
			//this is an array holding all the wrapped line lengths
			
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
			// if this is the first line in a block of wrapped text
			if(integ==0){
				if(checkSpell)ajaxSpell(pos.row);

				var newWrapVars = WrapVariableArray[lines[pos.row-1][1]];
				// If the previous line (the one we're jumping into)
				// has only one line, don't run the calcs, just go to it
				if(lines[pos.row-1][0].length<newWrapVars[0]){
					pos.row--;
					if(pos.col>lines[pos.row][0].length)pos.col=lines[pos.row][0].length;
				}
				else{
					var lineLengths=[];
					for(i in linesNLB[pos.row]){
						lineLengths.push(linesNLB[pos.row][i].length)
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
		// if the current block does
		// not have wrapped text
		else{
			if(pos.row==0){
				pos.col=0;
			}
			else{
				if(checkSpell)ajaxSpell(pos.row);
				
				var newWrapVars = WrapVariableArray[lines[pos.row-1][1]];
				//If the previous line (the one we're jumping into)
				//has only one line, don't run the calcs, just go to it
				if(lines[pos.row-1][0].length<newWrapVars[0]){
					pos.row--;
					if(pos.col>lines[pos.row][0].length)pos.col=lines[pos.row][0].length;
				}
                //if the previous line has wrapped text
				else{
					var lineLengths=[];
					for(i in linesNLB[pos.row-1]){
						lineLengths.push(linesNLB[pos.row-1][i].length)
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
	}
	else if(goog.dom.getElement('suggestBox')!=null){
		googSuggestMenu.highlightPrevious();
	}
}

/**
 * Moving the position of the Caret when
 * canvas is selected and user presses Down
 * arrow
 * @ param { goog.events.BrowserEvent } e
 * gives the mousedown event with associated data
 */
function downArrow(e){
	if(typeToScript && goog.dom.getElement('suggestBox')==null){
		if(pos.row==lines.length-1 && pos.col==lines[pos.row][0].length)return;
		
		var wrapVars = WrapVariableArray[lines[pos.row][1]];
		if (lines[pos.row][0].length>wrapVars[0]){
            var lineLengths=[];
			for(i in linesNLB[pos.row]){
				if(linesNLB[pos.row][i]!=""){
					lineLengths.push(linesNLB[pos.row][i].length)
				}
			}
			// use variable 'integ' to figure out 
			// what line the cursor is on
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
	}
	else if(goog.dom.getElement('suggestBox')!=null){
		googSuggestMenu.highlightNext();
	}
}

/**
 * Moving the position of the Caret when
 * canvas is selected and user presses left
 * arrow
 * @ param { goog.events.BrowserEvent } e
 * gives the mousedown event with associated data
 */
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
		var c =goog.dom.getElement('suggestBox');
		if(change && c!=null)c.parentNode.removeChild(c);
	}
}

/**
 * Moving the position of the Caret when
 * canvas is selected and user presses right
 * arrow
 * @ param { goog.events.BrowserEvent } e
 * gives the mousedown event with associated data
 */
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
		var c =goog.dom.getElement('suggestBox');
		if(change && c!=null)c.parentNode.removeChild(c);
	}
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
        var j = lines[dir[1]+1][0];
        lines.splice((dir[1]+1),1);
        if(lines[dir[1]][1]==4 && lines[dir[1]][0].charAt(lines[dir[1]][0].length-1)==')')lines[dir[1]][0]=lines[dir[1]][0].slice(0,-1);
        lines[dir[1]][0]+=j;
        forceCalc=true;
    }
    else if(dir[0]=='back'){
        if(dir[3]=='line'){
            //shift notes
            for(x in notes){
                if(dir[1]==notes[x][0]){
                    if (dir[2]<=notes[x][1]){
                        notes[x][0]=notes[x][0]+1;
                        notes[x][1]=notes[x][1]-dir[2];
                    }
                }
                else if(dir[1]<notes[x][0])notes[x][0]=notes[x][0]+1;
            }
            var j = lines[dir[1]][0].slice(0,dir[2]);
            var k = lines[dir[1]][0].slice(dir[2]);
            if(dir[4]==3 && k.charAt(k.length-1)==')')k=k.slice(0,-1);
            lines[dir[1]][0] = j;
            var newArr = [k,dir[4]];
            lines.splice(dir[1]+1,0,newArr);
            dir[1]=dir[1]+1;
            dir[2]=0;
            forceCalc=true;
        }
        else{
            lines[dir[1]][0] = lines[dir[1]][0].slice(0,dir[2]-1) + dir[3] +lines[dir[1]][0].slice(dir[2]-1);
			if (lines[dir[1]][1]==0)updateOneScene(dir[1]);
            //shift notes
            for(x in notes){
                if(dir[1]==notes[x][0]){
                    if (dir[2]<=notes[x][1])notes[x][1]=notes[x][1]+1;
                }
            }
        }
    }
    else if(dir[0]=='delete'){
        if(dir[3]=='line'){
            var j = lines[dir[1]][0].slice(0,dir[2]);
            var k = lines[dir[1]][0].slice(dir[2]);
            if(dir[4]==3 && k.charAt(k.length-1)==')')k=k.slice(0,-1);
            lines[dir[1]][0] = j;
            var newArr = [k,dir[4]];
            lines.splice(dir[1]+1,0,newArr);
            forceCalc=true;
        }
        else{
            lines[dir[1]][0] = lines[dir[1]][0].slice(0,dir[2]) + dir[3] +lines[dir[1]][0].slice(dir[2]);
			if (lines[dir[1]][1]==0)updateOneScene(dir[1]);
        }
    }
    else if(dir[0]=='format'){
        lines[dir[1]][1]=dir[3];
        if(lines[dir[1]][0].charAt(0)=='(')lines[dir[1]][0]=lines[dir[1]][0].substr(1);
        if(lines[dir[1]][0].charAt(lines[dir[1]][0].length-1)==')')lines[dir[1]][0]=lines[dir[1]][0].slice(0,-1);
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
                var j = lines[dir[1]][0].slice(0,dir[2]);
                var k = lines[dir[1]][0].slice(dir[2]);
                if(dir[4]==3 && k.charAt(k.length-1)==')')k=k.slice(0,-1);
                lines[dir[1]][0] = j;
                var newArr = [k,dir[4]];
                lines.splice(dir[1]+1,0,newArr);
                dir[1]=dir[1]+1;
                dir[2]=0;
                forceCalc=true;
            }
            else{
                lines[dir[1]][0] = lines[dir[1]][0].slice(0,dir[2]-1) + dir[3] +lines[dir[1]][0].slice(dir[2]-1);
				if (lines[dir[1]][1]==0)updateOneScene(dir[1]);
            }
        }
    }
    else if(dir[0]=='paste'){
        // if string and not json
        if(dir[3][0]!='[' && dir[3][1]!='['){
            lines[dir[1]][0]=lines[dir[1]][0].slice(0, dir[2])+lines[dir[1]][0].slice(dir[2]+dir[3].length);
			if (lines[dir[1]][1]==0)updateOneScene(dir[1]);
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
                    lines[dir[1]][0]=lines[dir[1]][0]+lines[dir[1]+1][0];
                    lines.splice(dir[1]+1,1);
                }
            }
            //iff added text to first line at paste
            else{
                lines[dir[1]][0]=lines[dir[1]][0].slice(0,dir[2]);
                lines.splice(dir[1]+1,d.length-1);
                //if deleted extra blank line from bad programing
                if(dir[5]==1){
                    lines[dir[1]][0]=lines[dir[1]][0]+lines[dir[1]+1][0];
                    lines.splice(dir[1]+1,1);
                }
            }
            
        }
    }
    else{
        lines[dir[1]][0] = lines[dir[1]][0].slice(0,dir[2])+lines[dir[1]][0].slice(dir[2]+1);
        if(lines[dir[1]][1]==4 && lines[dir[1]][0][dir[2]-1]==')'){
            lines[dir[1]][0] = lines[dir[1]][0].slice(0,dir[2])+lines[dir[1]][0].slice(dir[2]+1);
            dir[2]=dir[2]-1;
        }
		if (lines[dir[1]][1]==0)updateOneScene(dir[1]);
        //shift notes
        for(x in notes){
            if(dir[1]==notes[x][0]){
                if (dir[2]<notes[x][1])notes[x][1]=notes[x][1]-1;
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
        var j = lines[dir[1]][0].slice(0,dir[2]);
        var k = lines[dir[1]][0].slice(dir[2]);
        lines[dir[1]][0] = j;
        if (lines[dir[1]][1] == 0)var newElem = 1;
        else if (lines[dir[1]][1] == 1)var newElem = 2;
        else if (lines[dir[1]][1] == 2)var newElem = 3;
        else if (lines[dir[1]][1] == 4)var newElem = 3;
        else if (lines[dir[1]][1] == 3)var newElem = 2;
        else if (lines[dir[1]][1] == 5)var newElem = 0;
        var newArr = [k,newElem];
        lines.splice(dir[1]+1,0,newArr);
		dir[1]=dir[1]+1;
		dir[2]=0;
		forceCalc=true;
    }
    else if(dir[0]=='back'){
        if(dir[3]!='line'){
            lines[dir[1]][0] = lines[dir[1]][0].slice(0,dir[2]-1)+lines[dir[1]][0].slice(dir[2]);
            dir[2]=dir[2]-1;
			if (lines[dir[1]][1]==0)updateOneScene(dir[1]);
        }
        else{
            var j = lines[dir[1]+1][0];
            lines.splice(dir[1]+1,1);
            lines[dir[1]][0] = lines[dir[1]][0]+j;
			forceCalc=true;
        }
    }
    else if(dir[0]=='delete'){
		if(dir[3]!='line'){
			lines[dir[1]][0] = lines[dir[1]][0].slice(0,dir[2])+lines[dir[1]][0].slice(dir[2]+1);
			if (lines[dir[1]][1]==0)updateOneScene(dir[1]);
		}
		else{
			var j =lines[dir[1]+1][0];
			lines.splice(dir[1]+1,1);
			lines[dir[1]][0]=lines[dir[1]][0]+j;
		}
    }
    else if(dir[0]=='format'){
		if (dir[4]!='tab'){
			lines[dir[1]][1]=dir[4];
		}
		else{
			var j = dir[3];
			if (j==0) lines[dir[1]][1]=2;
			else if(j==1)lines[dir[1]][1]=0;
			else if(j==2)lines[dir[1]][1]=1;
			else if(j==3)lines[dir[1]][1]=4;
			else if(j==4)lines[dir[1]][1]=3;
			else if(j==5)lines[dir[1]][1]=0;
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
				var j=lines[dir[1]+1][0]
				lines.splice(dir[1]+1,1);
				lines[dir[1]][0]=lines[dir[1]][0]+j;
				forceCalc=true;
			}
			else{
				lines[dir[1]][0]=lines[dir[1]][0].slice(0,dir[2]-1)+lines[dir[1]][0].slice(dir[2]);
				if (lines[dir[1]][1]==0)updateOneScene(dir[1]);
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
				var j=lines[dir[1]+1][0]
				lines.splice(dir[1]+1,1);
				lines[dir[1]][0]=lines[dir[1]][0]+j;
				forceCalc=true;
			}
			else{
				lines[dir[1]][0]=lines[dir[1]][0].slice(0,dir[2]-1)+lines[dir[1]][0].slice(dir[2]);
				if (lines[dir[1]][1]==0)updateOneScene(dir[1]);
			}
		}
		dir[2]=dir[2]-1;
    }
    else if(dir[0]=='paste'){
        //for single line, no json
        if(dir[3][0]!='[' && dir[3][1]!='['){
            lines[dir[1]][0]=lines[dir[1]][0].slice(0, dir[2])+dir[3]+lines[dir[1]][0].slice(dir[2]);
			if (lines[dir[1]][1]==0)updateOneScene(dir[1]);
        }
        //for json
        else{
			forceCalc=true;
            var arr=JSON.parse(dir[3]);
            if (lines[dir[1]][0]==''){
                lines[dir[1]][1]=arr[0][1];
            }
            if (lines[dir[1]][1]==arr[0][1]){
                var tmp=[lines[dir[1]][0].slice(dir[2]), lines[dir[1]][1]];
                lines[dir[1]][0]=lines[dir[1]][0].slice(0,dir[2])+arr[0][0];
                var i=1;
                var p=dir[1]+1;
                while(i<arr.length){
                    lines.splice(p,0,arr[i]);
                    p++;
                    i++;
                }
                lines.splice(p,0,tmp);
                if(lines[p][0]=='' || lines[p][0]==' '){
                    lines.splice(p,1);
                }
            }
            else{
                var tmp=[lines[dir[1]][0].slice(dir[2]), lines[dir[1]][1]];
                lines[dir[1]][0]=lines[dir[1]][0].slice(0,dir[2]);
                dir[1]++;
                lines.splice(dir[1],0,arr[0]);
                var i=1;
                var p=dir[1]+1;
                while(i<arr.length){
                    lines.splice(p,0,arr[i]);
                    p++;
                    i++;
                }
                lines.splice(p,0,tmp);
                if(lines[p][0]=='' || lines[p][0]==' '){
                    lines.splice(p,1);
                }
            }
        }
        
    }
    else{
        lines[dir[1]][0] = lines[dir[1]][0].slice(0,dir[2]) + dir[0] +lines[dir[1]][0].slice(dir[2]);
        dir[2]=dir[2]+1;
		if (lines[dir[1]][1]==0)updateOneScene(dir[1]);
    }
	for(var i=0;i<lines.length;i++){
		getLines(i);
	}
	pagination();
	sceneIndex();
	scroll(0);
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

function characterInit(){
	for(var i=0; i<lines.length;i++){
		if (lines[i][1]==2){
			characterIndex(lines[i][0]);
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
	var c = goog.dom.getElement('noteBox')
	goog.dom.removeChildren(c);
	for (x in notes){
		//build box
		var newDiv=c.appendChild(document.createElement('div'));
		newDiv.className='noteListUnit';
		newDiv.id = 'noteListUnit'+notes[x][3];
		// figure out what page its on
		if(pageBreaks.length==0){var pn = 1}
		else{
			var i=0;
			while(notes[x][0]*1+1*1>pageBreaks[i][0]){
				i++;
				if(i==pageBreaks.length)break
			}
			var pn=i*1+1;
		}
		//get note snippet
		var tmpEl = goog.dom.createElement('div');
		tmpEl.innerHTML = notes[x][2][0][0];
		var snippet = goog.dom.getTextContent(tmpEl);
		if (snippet.length>80)snippet = snippet.substr(0,77)+'...';
		snippet = '"'+snippet+'"';
		// figre out reply text
		var replySpan = goog.dom.createElement('span');
		if(notes[x][2].length==2){
			replySpan.appendChild(goog.dom.createTextNode('1 Reply'));
		}
		else if(notes[x][2].length>2){
			replySpan.appendChild(goog.dom.createTextNode((notes[x][2].length*1-1)+' Replies'));
		}
		//figure out how many new replies
		var r = 0;
		for (y in notes[x][2]){
			if(String(notes[x][2][y][3])=='0')r++;
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
				if (notes[i][3]==id){
					var row = notes[i][0];
					var col = notes[i][1];
					pos.row=anch.row=row;
					pos.col=anch.col=col;
				}
			}
			jumpTo('find'+row);
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
		if(notes[i][3]==id){
			for(j in notes[i][2]){
				var classN = (parseInt(notes[i][2][j][3])==0 ? "noteMessageUnread' title='Click To Mark As Read'" : 'noteMessage')
				str+="<div class='"+classN+"' id='"+notes[i][2][j][2]+"' onclick='markAsRead(this)'>";
				str+="<b>"+notes[i][2][j][1]+" - </b><span> </span> ";
				str+=notes[i][2][j][0];
				//edit controls
				var edit = "";
				if(notes[i][2][j][1].toLowerCase()==user){
					edit+=" <span class='noteControls' onclick='newMessage(this)'>edit</span> |"
				}
				if(notes[i][2][j][1].toLowerCase()==user || EOV=='editor'){
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
				if (notes[i][3]==thread_id){
					for(j in notes[i][2]){
						if (notes[i][2][j][2]==msg_id){
							notes[i][2][j][3]=1;
						}
					}
				}
			}
			noteIndex();
		},
		'POST',
		'resource_id='+resource_id+'&thread_id='+thread_id+'&msg_id='+escape(msg_id)
	)
}
function newThread(){
	tabs(1);
	var id=Math.round(Math.random()*1000000000);
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
	notes.push([pos.row, pos.col, ['temp', 'temp', 'temp'],id])
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
		if(notes[i][3]==id){
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
					if (notes[i][3]==thread_id){
						notes[i][2]=[[content, user, msg_id]];
					}
				}
				noteIndex();
				goog.dom.removeNode(el);
				notesDialog(false, thread_id, top, left);
			}
		},
		'POST',
		'fromPage=editor&resource_id='+resource_id+'&row='+pos.row+'&col='+pos.col+'&content='+escape(content)+'&thread_id='+thread_id
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
					if(notes[i][3]==thread_id){
						var found = false;
						for(j in notes[i][2]){
							if(notes[i][2][j][2]==timestamp){
								notes[i][2][j][0]=new_content;
								found=true;
							}
						}
						if(!found){
							notes[i][2].push([new_content, user, timestamp])
						}
					}
				}
				noteIndex();
				notesDialog(false, thread_id, top, left)
			}
		},
		'POST',
		'resource_id='+resource_id+'&content='+escape(content)+'&thread_id='+thread_id+'&msg_id='+msg_id+'&fromPage=editor'
	);
	noteIndex();
	x=d=content=u=n=null;
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
        if (notes[i][3]==v)var found = i;
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
						if(notes[i][3]==threadId){
							for (j in notes[i][2]){
								if(notes[i][2][j][2]==msgId){
									notes[i][2].splice(j,1)
									if(notes[i][2].length==0){
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
			'resource_id='+resource_id+'&thread_id='+threadId+'&msgId='+escape(msgId)
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
	clearTimeout(timer);
    if(resource_id=='Demo' || EOV=='viewer'){
        self.close()
    }
    var data=JSON.stringify(lines);
    goog.dom.getElement('saveButton').value='Saving...';
    goog.net.XhrIo.send('/save', function(d){
        self.close();
		},
		'POST',
		"data="+escape(data)+"&resource_id="+resource_id+"&autosave=0"
	);
    var arr = []
    for (i in notes){
        arr.push([notes[i][0], notes[i][1], notes[i][3]])
    }
    if(arr.length!=0){
		goog.net.XhrIo.send('/notesposition', 
			function(d){},
			'POST',
			"positions="+escape(JSON.stringify(arr))+"&resource_id="+resource_id
		);
    }
	data=arr=i=null;
}
// new script
function newScriptPrompt(){
	if(resource_id=="Demo"){
        alert("Sorry, you'll have to login to open new scripts.");
		return;
    }
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
			'filename='+escape(filename)+'&fromPage=editor'
		);
	}
}
// duplicate
function duplicate(){
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
    var data=JSON.stringify(lines);
    goog.dom.getElement('saveButton').value='Saving...';
    goog.net.XhrIo.send('/save', function(d){
			if(d.target.getResponseText()=='1'){
	        	goog.dom.getElement('saveButton').value='Saved';
	        	goog.dom.getElement('saveButton').disabled=true;
				goog.dom.getElement('saveError').style.display='none';
			}
			else{
				goog.dom.getElement('saveButton').value='Save';
	        	goog.dom.getElement('saveButton').disabled=false;
				goog.dom.getElement('saveError').style.display='table';
			}
		},
		'POST',
		"data="+escape(data)+"&resource_id="+resource_id+"&autosave="+v
	);
    var arr = []
    for (i in notes){
        arr.push([notes[i][0], notes[i][1], notes[i][3]])
    }
    if(arr.length!=0){
		goog.net.XhrIo.send('/notesposition', 
			function(d){},
			'POST',
			"positions="+escape(JSON.stringify(arr))+"&resource_id="+resource_id
		);
    }
	data=arr=i=null;
}
// open other script
function openPrompt(){
    window.open("/scriptlist")
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
	if(resource_id=="Demo"){
        alert("Sorry, you'll have to login to email scripts.");
		return;
    }
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
	goog.net.XhrIo.send('/emailscript', 
		emailComplete,
		'POST',
		"resource_id="+resource_id+"&recipients="+recipients+"&subject="+subject+"&body_message="+escape(body_message)+"&fromPage=editor"
	);
	goog.dom.getElement('emailS').disabled = true;
	goog.dom.getElement('emailS').value = 'Sending...';
	c=arr=recipients=subject=body_message=null;
}

//Sharing scripts
function sharePrompt(){
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
			"removePerson="+escape(v)+"&resource_id="+resource_id+"&autosave="+v
		);
    }
	c=null;
}

function shareScript(){
	if(EOV=='viewer')return;
	var r = goog.format.EmailAddress.parseList(goog.dom.getElement('collaborator').value)
	var arr=[];
	var nonValidEmail=false;
	for(i in r){
		var a = r[i].address_;
		if(a!=""){
			try{
				var domain  = a.split('@')[1].split('.')[0].toLowerCase();
				if(domain=='gmail' || domain=='yahoo' || domain=='googlemail' || domain=='ymail' || domain=='rocketmail'){
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
	var sendEmail = (goog.dom.getElement('email_notify_share').checked==true ? 'y' : 'n');
	var addMsg = (goog.dom.getElement('email_notify_msg').checked==true ? 'y' : 'n');
	var msg = ((sendEmail=='y' && addMsg=='y') ? escape(goog.dom.getElement('share_message').innerHTML) : 'n');
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
		'resource_id='+resource_id+'&collaborators='+escape(collaborators)+'&fromPage=editor&sendEmail='+sendEmail+'&addMsg='+addMsg+'&msg='+msg	
	)
	goog.dom.getElement('shareS').disabled = true;
	goog.dom.getElement('shareS').value = "Sending Invites...";
}
//tag
function tagPrompt(){
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
			'resource_id='+resource_id+'&version=latest&tag='+escape(t)
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
	//lines[pos.row][0]=lines[pos.row][0].slice(0, pos.col)+d+lines[pos.row][0].slice(pos.col)
}
function replaceAndFind(){
	if(EOV=='viewer')return;
	replaceText();
	findDown();
}
// spellCheck
function launchSpellCheck(){
	if(EOV=='viewer')return;
    typeToScript=false;
    ajaxSpell(pos.row)
    var firstLine = (pos.row==0 ? true : false);
    goog.dom.getElement('spellcheckpopup').style.visibility = 'visible';
    spellCheckCycle(firstLine, 0, 0)
    
}
function spellCheckCycle(firstLine, r, w){
	if(EOV=='viewer')return;
    if(r=='finished'){
        alert('Spell Check Complete');
        hideSpellCheck();
        return;
    }
    var line=lines[r][0].split(' ');
    var found = false;
    while (found==false){
        var word = line[w].replace("?", "").replace(".","").replace(",","").replace("(","").replace(")","");
        for (i in spellWrong){
            if (spellWrong[i][0].toUpperCase()==word.toUpperCase()){
                found=[r,w,i];
                for(v in spellIgnore){
                    if (spellIgnore[v].toUpperCase()==word.toUpperCase())found=false;
                }
            }
        }
        if (!found){
            w++;
            if (w==line.length){
                w=0;
                r++;
                if (r==lines.length){
                    found='finished';
                }
                else{
                    line = lines[r][0].split(' ');
                }
            }
        }
    }
    if (found=='finished'){
        goog.dom.getElement('sSuggest').innerHTML="";
        goog.dom.getElement('sSentance').innerHTML = "";
        alert("Spell Check Complete");
        hideSpellCheck()
    }
    else{
        var sen =lines[r][0];
        var reg = new RegExp(word,'i');
        var rep = "<span id='sFocus' title='"+word+"' style='color:red'>"+word+"</span>"
        sen = sen.replace(reg, rep);
        if(lines[r][1]==0 || lines[r][1]==2 || lines[r][1]==5){
            goog.dom.getElement('sSentance').innerHTML = sen.toUpperCase();
            goog.dom.getElement('sSentance').innerHTML =goog.dom.getElement('sSentance').innerHTML.replace("SFOCUS","sFocus")
        }
        else{
            goog.dom.getElement('sSentance').innerHTML = sen;
        }
        goog.dom.getElement('sSentance').title = r;
        var sug = spellWrong[found[2]][1];
        var d=goog.dom.getElement('sSuggest')
        d.innerHTML="";
        for (i in sug){
            var item =d.appendChild(document.createElement('div'))
            item.className='spellcheckitem';
			goog.events.listen(item, goog.events.EventType.CLICK, function(e){
				var f = goog.dom.getElement('spellcheckfocus');
	            if (f!=undefined){
	                f.removeAttribute('id');
	            }
	            e.target.id='spellcheckfocus'
	            goog.dom.getElement('sFocus').innerHTML=e.target.title;
			})
            if(lines[r][1]==0 || lines[r][1]==2 || lines[r][1]==5){
                item.appendChild(document.createTextNode(sug[i].toUpperCase()));
            }
            else{
                item.appendChild(document.createTextNode(sug[i]));
            }
            item.title=sug[i];
        }
        w++;
        if (w==line.length){
            w=0;
            r++;
            if (r==lines.length){
                found='finished';
            }
            else{
                line = lines[r][0].split(' ');
            }
        }
        var h = (found=='finished' ? found : [r,w].join(','))
        goog.dom.getElement('sHidden').value=h;
    }
}

function hideSpellCheck(){
    goog.dom.getElement('spellcheckpopup').style.visibility='hidden';
    typeToScript=true;
    //spellIgnore=[];
	saveTimer()
}
function s_ignore(){
    var tmp = goog.dom.getElement('sHidden').value;
    spellCheckCycle(false, tmp.split(',')[0], tmp.split(',')[1]);
}
function s_ignore_all(){
    spellIgnore.push(goog.dom.getElement('sFocus').title);
    var tmp = goog.dom.getElement('sHidden').value;
    spellCheckCycle(false, tmp.split(',')[0], tmp.split(',')[1]);
}
function s_change(){
    var s=goog.dom.getElement('sSentance');
    var r = s.title;
    lines[r][0]="";
    for (i in s.childNodes){
        if(s.childNodes[i].nodeName=="#text")lines[r][0]=lines[r][0]+s.childNodes[i].nodeValue;
        else{
            var c = s.childNodes[i].childNodes;
            for (j in c){
                if (c[j].nodeName=="#text")lines[r][0]=lines[r][0]+c[j].nodeValue;
            }
        }
    }
    var tmp = goog.dom.getElement('sHidden').value;
    spellCheckCycle(false, tmp.split(',')[0], tmp.split(',')[1]);
}



	


//drawing functions
// like the scroll arrows
function drawScrollArrows(ctx){
    var height = goog.dom.getElement('canvas').height;
    //up arrow
    ctx.fillStyle="#333";
    ctx.fillRect(editorWidth-21, height-39-22, 21,20);
    ctx.fillStyle='#ddd';
    ctx.fillRect(editorWidth-19, height-37-22, 16, 16);
    ctx.beginPath();
    ctx.moveTo(editorWidth-16, height-24-22);
    ctx.lineTo(editorWidth-10.5, height-35-22);
    ctx.lineTo(editorWidth-5, height-24-22);
    ctx.closePath();
    ctx.fillStyle="#333";
    ctx.fill();
    //down arrow
    ctx.fillStyle="#333";
    ctx.fillRect(editorWidth-21, height-19-22, 20,20);
    ctx.fillStyle='#ddd';
    ctx.fillRect(editorWidth-19, height-18-22, 16, 16);
    ctx.beginPath();
    ctx.moveTo(editorWidth-16, height-15-22);
    ctx.lineTo(editorWidth-10.5, height-4-22);
    ctx.lineTo(editorWidth-5, height-15-22);
    ctx.closePath();
    ctx.fillStyle="#333";
    ctx.fill();
	height=null;
}
function drawScrollBar(ctx){
	var lingrad = ctx.createLinearGradient(editorWidth-15,0,editorWidth,0);
	lingrad.addColorStop(0, "#5587c4");
	lingrad.addColorStop(.8, "#95a7d4"); 
	ctx.strokeStyle="#333";
	//ctx.lineWidth=2;
	ctx.fillStyle=lingrad;
    var height = goog.dom.getElement('canvas').height-20;
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
}
function drawFindArr(ctx,pageStartX){
	if(findArr.length!=0 || findReplaceArr.length!=0){
		ctx.fillStyle="yellow";
		var l = (findArr.length==0 ? goog.dom.getElement("fr_find_input").value.length : goog.dom.getElement("find_input").value.length);
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
}
function drawRange(ctx, pageStartX){
	if(pos.row==anch.row && anch.col==pos.col)return;
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
	
	// get on canvas postions of start and end (s,e)
	var s = canvasPosition(startRange.row, startRange.col, pageStartX);
	var e = canvasPosition(endRange.row, endRange.col, pageStartX);
	s.canvasY+=3;
	e.canvasY+=3;
	
	// Now compare stuff and draw blue boxen
	ctx.fillStyle='lightBlue';
	
	// if this is only on one wrapped line
	if(e.canvasY==s.canvasY){
		var onlyBlueLine = s.canvasX;
		ctx.fillRect(onlyBlueLine, s.canvasY,e.canvasX-s.canvasX, 12);
	}
	else{
		// if the range doesn't fall on one bit of wrapped
		// text, cycle through lines, and linesNLB to draw
		// boxes in line by line.
		var y = lineheight*10+3;
		var count = 0;
		var startLine = 0;
		// figure out what page to start printing on
		// i.e. only draw if it'll be visible on screen
		var firstPrintedPage = Math.round(vOffset/(72*lineheight)-0.5);
		if(firstPrintedPage!=0){
			count=firstPrintedPage-1;
			y=72*lineheight*(count)+10*lineheight;
			startLine=pageBreaks[count][0];
		}
		for (var i=startLine; i<linesNLB.length; i++){
			if(y-vOffset>1200)break;
			if(i>endRange.row)break;
			var tc=0; // keep track of total characters passed through so far
			for(var j=0; j<linesNLB[i].length; j++){
				if(pageBreaks.length!=0 && pageBreaks[count]!=undefined && pageBreaks[count][0]==i && pageBreaks[count][2]==j){
					y=72*lineheight*(count+1)+9*lineheight+3;
					count++;
					if(j!=0 && lines[i][1]==3){
						y+=lineheight;
					}
					if(count>=pageBreaks.length){
						count=pageBreaks.length-2;
					}
				}
				if(i==startRange.row && i!=endRange.row){
					// for drawing range in a block that contains
					// the start of the range, but not the end
					if(tc>startRange.col){
						if(lines[i][1]==5){
							ctx.fillRect(WrapVariableArray[lines[i][1]][1]+pageStartX-(linesNLB[i][j].length*fontWidth), y-vOffset, linesNLB[i][j].length*fontWidth,12);
						}
						else{
							ctx.fillRect(WrapVariableArray[lines[i][1]][1]+pageStartX, y-vOffset, linesNLB[i][j].length*fontWidth,12);
						}
					}
					if(tc<startRange.col && startRange.col<(tc+linesNLB[i][j].length)){
						ctx.fillRect(s.canvasX, s.canvasY, (tc+linesNLB[i][j].length-startRange.col)*fontWidth,12);
					}
				}
				else if(i==endRange.row && i!=startRange.row){
					// for drawing range in a block that contains
					// the end of the range, but not the start
					if(tc+linesNLB[i][j].length<endRange.col){
						if(lines[i][1]==5){
							ctx.fillRect(WrapVariableArray[lines[i][1]][1]+pageStartX-(linesNLB[i][j].length*fontWidth), y-vOffset, linesNLB[i][j].length*fontWidth,12);
						}
						else{
							ctx.fillRect(WrapVariableArray[lines[i][1]][1]+pageStartX, y-vOffset, linesNLB[i][j].length*fontWidth,12);
						}
					}
					if(tc<endRange.col && endRange.col<(tc+linesNLB[i][j].length)){
						ctx.fillRect(e.canvasX-(endRange.col-tc)*fontWidth, e.canvasY, (endRange.col-tc)*fontWidth, 12)
					}
					
				}
				else if(i==startRange.row && i==endRange.row){
					// for drawing range in a block that contains
					// the both the start and end of the range
					if(tc<startRange.col && startRange.col<(tc+linesNLB[i][j].length)){
						ctx.fillRect(s.canvasX, s.canvasY, (tc+linesNLB[i][j].length-startRange.col)*fontWidth,12);
					}
					else if(tc<endRange.col && endRange.col<(tc+linesNLB[i][j].length)){
						ctx.fillRect(e.canvasX-(endRange.col-tc)*fontWidth, e.canvasY, (endRange.col-tc)*fontWidth, 12)
					}
					else if(tc>startRange.col && tc<endRange.col){
						if(lines[i][1]==5){
							ctx.fillRect(WrapVariableArray[lines[i][1]][1]+pageStartX-(linesNLB[i][j].length*fontWidth), y-vOffset, linesNLB[i][j].length*fontWidth,12);
						}
						else{
							ctx.fillRect(WrapVariableArray[lines[i][1]][1]+pageStartX, y-vOffset, linesNLB[i][j].length*fontWidth,12);
						}
					}
				}
				else if(i>startRange.row){
					// for drawing range in a block that contains
					// neither the start or the end of the range
					// i.e. the stuff int he middle.
					if(lines[i][1]==5){
						ctx.fillRect(WrapVariableArray[lines[i][1]][1]+pageStartX-(linesNLB[i][j].length*fontWidth), y-vOffset, linesNLB[i][j].length*fontWidth,12);
					}
					else{
						ctx.fillRect(WrapVariableArray[lines[i][1]][1]+pageStartX, y-vOffset, linesNLB[i][j].length*fontWidth,12);
					}
				}
				y+=lineheight;
				tc+=linesNLB[i][j].length+1;
			}
		}
    }
}

function drawallnotes(){
		// calc if there are notes in this line
		var notesArr=[];
		if(viewNotes){
			for (note in notes){
				if(notes[note][0]==i)notesArr.push([notes[note][1], notes[note][3]]);
			}
		}
		notesArr = notesArr.sort(sortNumbers);
		
		
		//
}
function drawNote(width, height, col, ctx, i, pageStartX, id){
    if(lines[i][1]==5){
		notesPosition.push([width-fontWidth*(lines[i][0].length-col+1)+pageStartX, height-vOffset-lineheight+3, id]);
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
		notesPosition.push([width+fontWidth*col+pageStartX, height-vOffset-lineheight+3, id])
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


// wrapp all m'fer
function wrapAll(){
	//var d = new Date();
	//var timestamp = d.getMilliseconds();
	for(var i=0;i<lines.length;i++){
		var a = getLines(i);
	}
	//var d = new Date();
	//console.log(d.getMilliseconds()-timestamp)
}
function getLines(v) {
	var oldLineBreaks = (linesNLB[v]==null ? false : linesNLB[v].length);
	var wa=lines[v][0].split(" ");
	var phraseArray=[];
	var lastPhrase="";
	var l=WrapVariableArray[lines[v][1]][0];
	var uc=WrapVariableArray[lines[v][1]][3];
	var measure=0;
	for (var i=0;i<wa.length;i++) {
		var w=wa[i];
		measure=(lastPhrase+" "+w).length;
		if (measure<l) {
			lastPhrase+=(w+" ");
		}
		else {
			if(uc==1)lastPhrase=lastPhrase.toUpperCase();
			phraseArray.push(lastPhrase.slice(0,-1));
			lastPhrase=w+" ";
		}
		if (i===wa.length-1) {
			if(uc==1)lastPhrase=lastPhrase.toUpperCase();
			phraseArray.push(lastPhrase.slice(0,-1));
			break;
		}
	}
	var addBlankLine=WrapVariableArray[lines[v][1]][4]-1;
	var i=0;
	while(i < addBlankLine){
		phraseArray.push("");
		i++;
	}
    linesNLB[v] = phraseArray;
	
	// return weather or not to re paginate
	if(oldLineBreaks = false || oldLineBreaks-phraseArray.length!=0){
		return true
	}
	else{
		return false
	}
}

function test(){
	var d = new Date();
	var TIME = d.getMilliseconds();
	for(var i=0; i<2621;i++){
		canvasPosition(100,5,80)
	}
	var d = new Date();
	//console.log(TIME - d.getMilliseconds());
}

/**
 * Given a col and row of text, finds
 * the onscreen position. Used for caret
 * and range, and any future uses
 * @ param { integer } r Row of text
 * @ param { integer } c Colulmn of text
 */
function canvasPosition(r,c, pageStartX){
	//figure out what page the caret is on
	var page = 0;
	for(i in pageBreaks){
		if(r<pageBreaks[i][0])break
		page++;
	}
	//handle if caret is in text with page break
	if(page!=0 && pageBreaks[page-1][0]==r){
		var j=0;
		var tc=0;
		while(j<pageBreaks[page-1][2]){
			tc+=linesNLB[r][j].length+1;
			j++;
		}
		if(c<tc)page--;
	}
	//jump to y of desired page
	var y = 72*lineheight*page+9*lineheight;
	
	// adjust if this is the first page
	if(page==0)y+=lineheight;
	
	// adjust if this isn't first page, and
	// there may be page splits in text
	if(page!=0){
		y-=(pageBreaks[page-1][2]*lineheight);
		y+=(lines[pageBreaks[page-1][0]][1]==3 ? lineheight : 0);
	}
	
	//figure which line to start counting from
	var i=(page==0 ? 0 : pageBreaks[page-1][0]);
	while(i<r){
		y+=linesNLB[i].length*lineheight;
		i++
	}
	
	// figure out lateral position
	var x = WrapVariableArray[lines[r][1]][1];
	x+=pageStartX;

	var s = 0; // start of line
	var e = linesNLB[r][0].length; // end of line
	for (var i=0; i<linesNLB[r].length; i++){
		if(s<=c && e+i>=c)break; //then caret is on this wrapped line
		if(i>=linesNLB[r].length-1)break; // then carret is on last wrapped line
		y+=lineheight;
		s=e;
		e+=linesNLB[r][i+1].length;
	}
	// i now equals which wrapped line the caret is on
	// it also equals the number of dropped spaces in linesNLB
	
	//tally it all up
	x+=(c-s-i)*fontWidth;
	
	// for Transition format
	if(lines[r][1]==5){
		x-=(linesNLB[r][i].length*fontWidth)
	}
	return {canvasX:x, canvasY:y-vOffset}
}

function drawPages(ctx, pageStartX){
	//draw pages
	//var d = new Date();
	//var timestamp = d.getMilliseconds();
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
			ctx.strokeStyle = '#999';
			ctx.strokeRect(pageStartX-2, pageStartY-vOffset-2, Math.round(fontWidth*87)+4, lineheight*70+4);
			ctx.fillStyle = foreground;
			if(i>0)ctx.fillText(String(i+1)+'.', 550+pageStartX, pageStartY-vOffset+85);
		}
		pageStartY+= lineheight*72;
	}
	//var d = new Date();
	//console.log(d.getMilliseconds()-timestamp);
}

function drawSluglineBacking(ctx, pageStartX){
	var greyHeight = lineheight*9+2;
	var wrapVars=WrapVariableArray[0];
	ctx.fillStyle='#ddd';
	var count=0;
	var startLine=0;
	var firstPrintedPage = Math.round(vOffset/(72*lineheight)-0.5);
	if(firstPrintedPage!=0){
		count=firstPrintedPage-1;
		y=72*lineheight*(count)+10*lineheight;
		startLine=pageBreaks[count][0];
	}
	for (var i=startLine;i<linesNLB.length;i++){
		if(pageBreaks.length!=0 && pageBreaks[count]!=undefined && pageBreaks[count][0]==i){
			greyHeight=72*lineheight*(count+1)+8*lineheight+2;
			if(pageBreaks[count][2]!=0){
				greyHeight-=pageBreaks[count][2]*lineheight;
				if(lines[i][1]==3)greyHeight+=lineheight;
			}
			count++;
		}
		for(var j=0; j<linesNLB[i].length; j++){
			greyHeight+=lineheight;
			if (lines[i][1]==0){
				if(linesNLB[i][j]!=0)ctx.fillRect(wrapVars[1]-3+pageStartX,greyHeight-vOffset,61*fontWidth+6, 14);
				if(lines[i][0]=='' && j==0)ctx.fillRect(wrapVars[1]-3+pageStartX,greyHeight-vOffset,61*fontWidth+6, 14);
			}
		}
		if(greyHeight-vOffset>1200)break;
	}
}

function drawCaret(ctx, pageStartX){
	var d= new Date();
	var newMilli = d.getMilliseconds();
	var diff = newMilli-milli;
	// only draw caret when you have to.
	if ((diff>0 && diff<500) || (diff<0 && diff<-500)){
		var p = canvasPosition(pos.row,pos.col, pageStartX);
		ctx.fillRect(p.canvasX, p.canvasY, 2, 17);
	}
}

function drawGuides(){
	var canvas = goog.dom.getElement('canvas');
	var ctx = canvas.getContext('2d');
	ctx.fillStyle = '#aaa';
	var y=0;
	var i=0;
	while (y<50000){
		ctx.fillText(i, 10, y-vOffset);
		i++;
		y+=lineheight;
		ctx.fillRect(0,y-vOffset,5000,2)
	}
}

function fillInfoBar(){
	var cell = goog.dom.getElement('info').getElementsByTagName('table')[0].getElementsByTagName('tr')[0].getElementsByTagName('td')[0];
	
	//first cell
	if(EOV=='editor'){
		var wordArr=["Enter : Action  --  Tab : Character", "Enter : Character  --  Tab : Slugline", "Enter : Dialog  --  Tab : Action", "Enter : Character  --  Tab : Parenthetical", "Enter : Dialog  --  Tab : Dialog", "Enter : Slugline  --  Tab : Slugline"];
		goog.dom.setTextContent(cell, wordArr[lines[pos.row][1]]);
	}
	
	//second cell
	cell = goog.dom.getNextElementSibling(cell);
	var ts=0; //total scenes
	var cs=0; // current scene
	for(i in lines){
		if(lines[i][1]==0)ts++;
		if(i==pos.row)cs=ts;
	}
	goog.dom.setTextContent(cell, "Scene "+cs+" of "+ts);
	
	// third cell
	cell = goog.dom.getNextElementSibling(cell);
	//figure out what page the caret is on
	var page = 0;
	for(i in pageBreaks){
		if(pos.row<pageBreaks[i][0])break
		page++;
	}
	//handle if caret is in text with page break
	if(page!=0 && pageBreaks[page-1][0]==pos.row){
		var j=0;
		var tc=0;
		while(j<pageBreaks[page-1][2]){
			tc+=linesNLB[pos.row][j].length+1;
			j++;
		}
		if(pos.col<tc)page--;
	}
	goog.dom.setTextContent(cell, "Page "+(page+1)+" of "+(pageBreaks.length+1));
	
}

function drawText(ctx, pageStartX){
	ctx.fillStyle=foreground;
	ctx.font=font;
	var y = lineheight*11;
	var latestCharacter = '';
	var count = 0;
	var sceneCount=0;
	var startLine = 0;
	// figure out what page to start printing on
	var firstPrintedPage = Math.round(vOffset/(72*lineheight)-0.5);
	if(firstPrintedPage!=0){
		count=firstPrintedPage-1;
		y=72*lineheight*(count)+10*lineheight;
		startLine=pageBreaks[count][0];
	}
	//Stary Cycling through lines
	for (var i=startLine; i<linesNLB.length; i++){
		if(y-vOffset>1200)break;
		if(lines[i][1]==2)latestCharacter=lines[i][0];
		for(var j=0; j<linesNLB[i].length; j++){
			if(pageBreaks.length!=0 && pageBreaks[count]!=undefined && pageBreaks[count][0]==i && pageBreaks[count][2]==j){
				if(j!=0 && lines[i][1]==3){
					ctx.fillText("(MORE)", WrapVariableArray[2][1]+pageStartX, y-vOffset)
				}
				y=72*lineheight*(count+1)+10*lineheight;
				count++;
				if(j!=0 && lines[i][1]==3){
					ctx.fillText(latestCharacter.toUpperCase()+" (CONT'D)", WrapVariableArray[2][1]+pageStartX, y-vOffset)
					y+=lineheight;
				}
				if(count>=pageBreaks.length){
					count=pageBreaks.length-2;
				}
			}
			if(lines[i][1]==5){
				ctx.fillText(linesNLB[i][j], WrapVariableArray[lines[i][1]][1]+pageStartX-(linesNLB[i][j].length*fontWidth) , y-vOffset);
			}
			else{
				ctx.fillText(linesNLB[i][j], WrapVariableArray[lines[i][1]][1]+pageStartX , y-vOffset);
			}
			y+=lineheight;
		}
	}
}

function paint(){
	notesPosition=[];
	if(typeToScript || findForcePaint){
		var pageStartX= Math.round((editorWidth-fontWidth*87-24)/2);
		var canvas = goog.dom.getElement('canvas');
		var ctx = canvas.getContext('2d');
		
		ctx.fillStyle = '#bbb';
		ctx.fillRect(0, 0, editorWidth, goog.dom.getElement('canvas').height);
		
		drawPages(ctx, pageStartX);
		drawSluglineBacking(ctx, pageStartX);
		drawFindArr(ctx, pageStartX);
		drawRange(ctx, pageStartX);
		selection();		
		drawText(ctx, pageStartX);
		drawCaret(ctx, pageStartX);
		drawScrollArrows(ctx);
		drawScrollBar(ctx);
		
		if(mouseDownBool && pos.row<anch.row && mouseY<40)scroll(-20);
		if(mouseDownBool && pos.row>anch.row && mouseY>goog.dom.getElement('canvas').height-50)scroll(20);
	}
	var d = new Date();
	var TIME = d.getMilliseconds();
	var d = new Date();
	//console.log(TIME - d.getMilliseconds());
}