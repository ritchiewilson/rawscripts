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


/**
 * Called on hover over DOM based menubar items in the browser window
 * (File, Edit, View, Share). If one of the drop downs is open, this
 * closes that one and opens the new apropriate one. Also handles
 * styling the menu header with correct colors.
 *
 * Jeez. It handles styling. Should really make it handle classes.
 *
 * @param {goog.events.BrowserEvent} e gives the hover event with
 * associated data
 */

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
			var d = goog.dom.getElement(v);
			d.style.backgroundColor='#6484df';
	        d.style.color='white';
		}
	}
	if(open!='not open'){
		arr[open][1].setVisible(false);
		t.setVisible(true)
	}
}

/**
 * Called when mouse leaves one of the DOM based menubar items. Just
 * corrects the styling.
 *
 * @param {goog.events.BrowserEvent} e Mouse out event for the DOM
 * object.
 */
function topMenuOut(e){
    var menus = {
        'file': fMenu,
        'edit': eMenu,
        'view': vMenu,
        'share': sMenu
    }
	var v = e.target.id;
    if(!menus[v].isVisible()){
        e.target.style.backgroundColor='#A2BAE9';
        e.target.style.color='black';
    }
}

/**
 * When a Closure Library menu item is chosen, an action event is
 * called. It's called when the item is clicked, or when it's
 * highlighted and user presses enter.
 * 
 * Not as shitty as it could be. Should be made more easily
 * extensible, but I don't know what the syntax would look like.
 *
 * @param {goog.events.BrowserEvent} e The 'action' event on the menu
 * item and associated data
 */
function menuSelect(e){
    var id=e.target.getId();
    //File
    if(id=='save')save(0);
    else if(id=='new')newScriptPrompt();
    else if(id=='open')openPrompt();
    else if(id=='rename')renamePrompt();
    else if(id=='exportas')exportPrompt();
    else if(id=='duplicate')duplicate();
    //Edit
    else if(id=='undo')undo();
    else if(id=='redo')redo();
    else if(id=='insertNote')newThread();
    else if(id=='editTitlePage')editTitlePage();
    else if(id=='tag')tagPrompt();
    else if(id=='spellCheck')window['spell']['launch']();
    else if(id=='find')findPrompt();
    else if(id=='findReplace')findReplacePrompt();
    else if(id=='selectAll')selectAll();
    //View
    else if(id=='revision')revisionHistoryPage();
    else if(id=='notes')viewNotes = (viewNotes ? false : true);
    else if(id.substr(0,6)=='format')changeFormat(parseInt(id.replace('format','')));
    else if(id.substr(0,5)=='font-')changeFontSize(id);
    //Share
    else if(id=='collaborators')sharePrompt();
    else if(id=='email')emailPrompt();

    //Close menus and return to normal.
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

/**
 * A quick but oft repeaded check if this script is the Demo page. If
 * so, tell the user they can't do soemthing, then return true.
 * 
 * Any feature that should be blocked in the Demo can now just run the
 * line if(checkIfDemo())return;
 */
function checkIfDemo(){
    if(resource_id=="Demo"){
	alert("Sorry, you'll have to login to do that.");
	return true;
    }
    else{return false;}
}

/**
 * Open the Closure Libraray DOM menu when menu header (File, Menu,
 * View, Share) is CLICKED
 * 
 * @param {goog.events.BrowserEvent} e Click event with all associated
 * data
 */
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
