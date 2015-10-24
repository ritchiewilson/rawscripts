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
 * When a key is pressed, figures out what to do with it
 * 
 * @param {goog.events.BrowserEvent} e key event
 */
function keyEvent(e){
    forceRepaint = true;
	if(e.platformModifierKey){
		// if ctrl or comman is pressed, the shortcut
		// handler should take care of it
		return;
	}
	else if(e.target.id=="ccp"){
		// for when the browser carret in the hidden text
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
		else if(e.keyCode==33)pageUp();
		else if(e.keyCode==34)pageDown();
		else{handlekeypress(e)}
		
		//console.log(e.keyCode);
	}
	//get selection if any
	// huge slowdown if user hold shift+arrow
	// so just run selection when user stops
	clearTimeout(selectionTimer);
	if(typeToScript){
		selectionTimer = setTimeout('selection()',30);
	}
	fillInfoBar();
	lineFormatGuiUpdate();
	if(e.keyCode!=33 && e.keyCode!=34){
		autoScroll();
	}
	uniqueNotePositions();
}

/**
 * When a shortcut is pressed, do it
 */
function shortcutTriggered(e){
    forceRepaint = true;
	if(e.identifier=="save")save(0);
	else if(e.identifier=="undo")undo();
	else if(e.identifier=="redo")redo();
	else if(e.identifier=="export")exportPrompt();
	else if(e.identifier=="find")findPrompt();
	else if(e.identifier=='all')selectAll();
}


///////////////////// Typing on Keyboard//////////////////////
/**
 * A bunch of funtions handling basic keyboard inputs. Inserting letters
 * backspace, delete, direction arrows, ets
 */


/**
 * Basicly typing. When a user types a letter, this puts it in the
 * script.
 * 
 * @param {goog.event.KeyEvent} e Button pressed
 */
function handlekeypress(e) {
    forceRepaint = true;
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
				lines[pos.row].text = lines[pos.row].text.slice(0,pos.col) + String.fromCharCode(e.charCode) +lines[pos.row].text.slice(pos.col);
				
				// Put this action in the undoQue
				undoQue.push([String.fromCharCode(e.charCode), pos.row, pos.col]);
				
				// more the caret one space forward
				pos.col++;
				anch.col=pos.col;
				anch.row=pos.row;
				
				// update scene list, if this is a Slugline
				if (lines[pos.row].format==0)updateOneScene(pos.row);
				
				// recreate suggest box if this is
				// a character or scene foramted line
				if (lines[pos.row].format==2){
					createSuggestBox('c');
				}
				if(lines[pos.row].format==0){
					createSuggestBox('s');
				}
				//shift notes
				for(x in notes){
					if(pos.row==notes[x].row){
						if (pos.col-1<=notes[x].col)notes[x].col=notes[x].col+1;
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
 * What do when a user hits backspace. Checks if user is editing the
 * screenplay. Adds the action to the undo que. Shifts the position of
 * notes. Then deletes the relevant character or space. Finally
 * rewraps the line of text as needed, and recalculates page breaks as
 * needed.
 *
 * @param {goog.event.KeyEvent} e keypress
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
		var calcSlug=(lines[pos.row].format==0 ? true : false)
		
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
					if(pos.row<notes[x].row){
						notes[x].row=notes[x].row-1;
					}
					else if(pos.row==notes[x].row){
						notes[x].col=notes[x].col+lines[pos.row-1].text.length;
						notes[x].row=notes[x].row-1;
					}
					if (notes[x].col<0)notes[x].col=0;
				}
				//actually do the operation
				var elem = lines[pos.row].format;
				var j = lines[pos.row].text;
				lines.splice(pos.row,1);
				var newPos = lines[pos.row-1].text.length;
				lines[pos.row-1].text = lines[pos.row-1].text+j;
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
				undoQue.push(['back',pos.row, pos.col,lines[pos.row].text[pos.col-1]]);
				
				// do it
				lines[pos.row].text = lines[pos.row].text.slice(0,pos.col-1)+lines[pos.row].text.slice(pos.col);
				pos.col--;
				// shift notes
				for(x in notes){
					if(pos.row==notes[x].row){
						if (pos.col<notes[x].col)notes[x].col=notes[x].col-1;
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
			switchPosAndAnch()
			
			// count how many items are added to the undo que
			var undoCount=0;
			
			// while anch != pos, keep deleting, character by character
			while(pos.col!=anch.col || pos.row!=anch.row){
				undoCount++;
				if(lines[pos.row].format==0)slug=true;
				if(pos.col==0){
					// if character to delete is virtual
					// nlb
					
					// shift notes
					for(x in notes){
						if(pos.row<notes[x].row){
							notes[x].row=notes[x].row-1;
						}
						else if(pos.row==notes[x].row){
							notes[x].col=notes[x].col+lines[pos.row-1].text.length;
							notes[x].row=notes[x].row-1;
						}
						if (notes[x].col<0)notes[x].col=0;
					}
					
					// combine two lines of text
					var elem = lines[pos.row].format;
					var j = lines[pos.row].text;
					lines.splice(pos.row,1);
					var newPos = lines[pos.row-1].text.length;
					lines[pos.row-1].text = lines[pos.row-1].text+j;
					pos.col=newPos;
					pos.row--;
					undoQue.push(['back',pos.row, pos.col,'line',elem]);
				}
				else{
					// if character to delete is just 
					// a character of text
					undoQue.push(['back',pos.row, pos.col,lines[pos.row].text[pos.col-1]]);
					lines[pos.row].text = lines[pos.row].text.slice(0,pos.col-1)+lines[pos.row].text.slice(pos.col);
					pos.col--;
					//shift notes
					for(x in notes){
						if(pos.row==notes[x].row){
							if (pos.col<notes[x].col)notes[x].col=notes[x].col-1;
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
 * Logic of the Delete button. Called when user presses delete button
 * while focused on the canvas script. Removes the character or space,
 * shifts notes, recalculates all that is needed.
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
		if(pos.col==(lines[pos.row].text.length) && pos.row==lines.length-1) return;
		
		// remember to recalc scene list
		if (lines[pos.row].format==0)var slug=true;
		
		if(pos.col==(lines[pos.row].text.length)){
			// if caret is at end of line, combine
			// two lines of text
			
			// shift notes
			for(x in notes){
				if(pos.row+1==notes[x].row){
					notes[x].col=notes[x].col+lines[pos.row].text.length;
					notes[x].row=notes[x].row-1;
				}
				else if(pos.row<notes[x].row){
					notes[x].row=notes[x].row-1;
				}
				if (notes[x].col<0)notes[x].col=0;
			}
			undoQue.push(['delete',pos.row,pos.col,'line',lines[pos.row+1].format]);
			if (lines[pos.row+1].format==0)slug=true;
			
			// actually do it
			var j = lines[pos.row+1].text;
			lines.splice((pos.row+1),1);
			lines[pos.row].text+=j;
			forceCalc=true;
			
			//recalc lines
			linesNLB.splice(pos.row+1,1)
			getLines(pos.row);
			pagination();
		}
		else{
			// delete one character
			undoQue.push(['delete',pos.row,pos.col,lines[pos.row].text[pos.col]]);
			lines[pos.row].text = lines[pos.row].text.slice(0,pos.col)+lines[pos.row].text.slice(pos.col+1);
			
			//shift notes
			for(x in notes){
				if(pos.row==notes[x].row){
					if (pos.col<notes[x].col)notes[x].col=notes[x].col-1;
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
		switchPosAndAnch()
		
		// count how many things are deleted
		var undoCount=0;
		
		// while pos!=anch, delete character by character
		while(pos.col!=anch.col || pos.row!=anch.row){
			undoCount++;
			if(lines[pos.row].format==0)slug=true;
			if(pos.col==0){
				// if caret is at the start of 
				// line, delete nlb and combine
				// two line of text
				
				//shift notes
				for(x in notes){
					if(pos.row+1==notes[x].row){
						notes[x].col=notes[x].col+lines[pos.row].text.length;
						notes[x].row=notes[x].row-1;
					}
					else if(pos.row<notes[x].row){
						notes[x].row=notes[x].row-1;
					}
					if (notes[x].col<0)notes[x].col=0;
				}
				undoQue.push(['delete',pos.row-1,lines[pos.row-1].text.length,'line',lines[pos.row].format]);
				var j = lines[pos.row].text;
				lines.splice(pos.row,1);
				var newPos = lines[pos.row-1].text.length;
				lines[pos.row-1].text = lines[pos.row-1].text+j;
				pos.col=newPos;
				pos.row--;
				slug=true;
				linesNLB.splice(pos.row+1,1)
			}
			else{
				// delete one character of text
				undoQue.push(['delete',pos.row,pos.col,lines[pos.row].text[pos.col-1]]);
				lines[pos.row].text = lines[pos.row].text.slice(0,pos.col-1)+lines[pos.row].text.slice(pos.col);
				pos.col--;
				//shift notes
				for(x in notes){
					if(pos.row==notes[x].row){
						if (pos.col<notes[x].col)notes[x].col=notes[x].col-1;
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
 * called when enter is pressed and handles all posible enter
 * situations including creating new line of text or interacting other
 * normal GUI
 */
function enter(){
	// if this is an editor window, do nothing
	if(EOV=='viewer')return;
	
	// if suggest box is open get the
	// text of selection, put it in
	if(goog.dom.getElement('suggestBox')!=null){
        saveTimer();
        var len = lines[pos.row].text.length;
		var txt = googSuggestMenu.getHighlighted().getCaption();
		lines[pos.row].text= txt;
        undoQue.push(['paste', pos.row, pos.col, lines[pos.row].text.substr(len)]);
		goog.dom.getElement('suggestBox').parentNode.removeChild(goog.dom.getElement('suggestBox'));
		pos.col=anch.col=lines[pos.row].text.length;
		var p = getLines(pos.row);
		if(p)pagination();
	}
	else if(typeToScript){
		// if canvas is users focus add
		// a new line of text
		saveTimer();

		// remove trailing white space.... don't
		// know why
		lines[pos.row].text=lines[pos.row].text.replace(/\s+$/,"");
		
		//shift notes
		for(x in notes){
			if(pos.row<notes[x].row){
				notes[x].row=notes[x].row+1;
			}
			if(pos.row==notes[x].row && pos.col<notes[x].row){
				notes[x].col=notes[x].col-pos.col;
				notes[x].row=notes[x].row+1;
			}
		}
		undoQue.push(['enter', pos.row, pos.col]);
		redoQue=[];
		if(lines[pos.row].format==2)characterIndex(lines[pos.row].text);
		
		// actually do it. split lines of text
		var j = lines[pos.row].text.slice(0,pos.col);
		var k = lines[pos.row].text.slice(pos.col);
		lines[pos.row].text = j;
		
		// figure out format of next line of text
		if (lines[pos.row].format == 0)var newElem = 1;
		else if (lines[pos.row].format == 1)var newElem = 2;
		else if (lines[pos.row].format == 2)var newElem = 3;
		else if (lines[pos.row].format == 4){
			//with parenthetical, get rid of pesky ")"
			var newElem = 3;
			if(k.slice(-1)==")"){
				k=k.slice(0,-1)
			}
		}
		else if (lines[pos.row].format == 3)var newElem = 2;
		else if (lines[pos.row].format == 5)var newElem = 0;
		
		// put second half of text in new line
		var newArr = {};
		newArr.text=k;
		newArr.format=newElem;
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
		autoScroll();
		
	}
	sceneIndex();
	// if find or replace is open, recalc
	// regex
	if(goog.dom.getElement('find_div').style.display=="block")findInputKeyUp({"which":1000}, "f");
	if(goog.dom.getElement('find_replace_div').style.display=="block")findInputKeyUp({"which":1000}, "r");
}

/**
 * when user presses 'tab' reformat current line if the user is
 * focused on the canvas. Else, normal dom interaction.
 */
function tab(){
	if(EOV=='viewer')return;
	if(typeToScript){
		// remove suggest box if exists
		if(goog.dom.getElement('suggestBox')!=null){goog.dom.getElement('suggestBox').parentNode.removeChild(goog.dom.getElement('suggestBox'))};
		saveTimer();
		undoQue.push(['format',pos.row,pos.col,lines[pos.row].format, 'tab']);
		redoQue=[];
		
		// remember to recalc scenes if needed
		var slug=false;
		if (lines[pos.row].format==0)var slug=true;
		
		// what type of line is this now
		var type = lines[pos.row].format;
		
		// change it to the correct new format
		if (type==1){
			lines[pos.row].format=0;
			slug=true;
		}
		else if (type==0)lines[pos.row].format=2;
		else if (type==2)lines[pos.row].format=1;
		else if (type==3)lines[pos.row].format=4;
		else if (type==4)lines[pos.row].format=3;
		else if (type==5){
			lines[pos.row].format=0;
			slug=true;
		}
		
		// re calc scene list if needed
		if(slug)sceneIndex();
		
		// add parentheses if switched to parenthetical
		if(lines[pos.row].format==4){
			if(lines[pos.row].text.charAt(0)!='('){
				lines[pos.row].text='('+lines[pos.row].text;
				pos.col++;
				anch.col++;
			}
			if(lines[pos.row].text.charAt(lines[pos.row].text.length-1)!=')')lines[pos.row].text=lines[pos.row].text+')';
		}
		
		// remove parentheses if switched from parenthetical
		if(lines[pos.row].format==3){
			if(lines[pos.row].text.charAt(0)=='('){
				lines[pos.row].text=lines[pos.row].text.substr(1);
				pos.col--;
				anch.col--;
			}
			if(lines[pos.row].text.charAt(lines[pos.row].text.length-1)==')')lines[pos.row].text=lines[pos.row].text.slice(0,-1);
		}
		
		//recalc line wraping/pagination
		var p = getLines(pos.row);
		if(p)pagination()
	}
}

/**
 * Moving the position of the Caret when canvas is selected and user
 * presses up arrow
 *
 * @param {goog.events.BrowserEvent} e gives the keydown event with
 * associated data
 */
function upArrow(e){
    if (goog.dom.getElement('suggestBox')!=null){
        googSuggestMenu.highlightPrevious();
        return;
    }

    if (!typeToScript){
        return;
    }

    if (pos.row!=anch.row || pos.col!=anch.col){
        if (!e.shiftKey){
            switchPosAndAnch();
            pos.row=anch.row;
            pos.col=anch.col;
            return;
        }
    }

    // moving from first line of wrapped text up to prev row
    if (pos.col <= linesNLB[pos.row][0].length){
        if (pos.row == 0){
            pos.col = 0;
        }
        else {
            pos.row--;
            var newCol = 0;
            var wraps = linesNLB[pos.row];
            if (wraps.length > 1 && wraps[wraps.length - 1].length == 0)
                wraps = wraps.slice(0, -1);
            for (i in wraps.slice(0, -1))
                newCol += wraps[i].length + 1;
            var lastWrappedLine = wraps[wraps.length - 1];
            newCol += Math.min(lastWrappedLine.length, pos.col);
            pos.col = newCol;
        }
    }
    // moving up within wrapped text
    else {
        var currentCol = pos.col;
        var currentRowInWrappedText = 0;
        var wraps = linesNLB[pos.row];
        for (i in wraps){
            if (currentCol <= wraps[i].length)
                break;
            currentRowInWrappedText++;
            currentCol = currentCol - (wraps[i].length + 1);
        }
        var prevWrapLength = wraps[currentRowInWrappedText - 1].length;
        pos.col = pos.col - (Math.max(currentCol, prevWrapLength) + 1);
    }

    if (!e.shiftKey){
        anch.col=pos.col;
        anch.row=pos.row;
    }
}

/**
 * Moving the position of the Caret when canvas is selected and user
 * presses Down arrow
 *
 * @param {goog.events.BrowserEvent} e gives the key event with
 * associated data
 */
function downArrow(e){
    if (goog.dom.getElement('suggestBox')!=null){
        googSuggestMenu.highlightNext();
        return;
    }

    if (!typeToScript){
        return;
    }

    if(pos.row!=anch.row || pos.col!=anch.col){
        if (!e.shiftKey){
            switchPosAndAnch();
            anch.row=pos.row;
            anch.col=pos.col;
            return;
        }
    }

    var currentCol = pos.col;
    var currentRowInWrappedText = 0;
    var wraps = linesNLB[pos.row];
    if (wraps.length > 1 && wraps[wraps.length - 1].length == 0)
        wraps = wraps.slice(0, -1);
    for (i in wraps){
        if (currentCol <= wraps[i].length)
            break;
        currentRowInWrappedText++;
        currentCol = currentCol - (wraps[i].length + 1);
    }

    // down should move to next line
    if (currentRowInWrappedText >= wraps.length - 1){
        if (pos.row == linesNLB.length - 1){
            pos.col = lines[pos.row].text.length;
        }
        else {
            pos.row++;
            pos.col = Math.min(currentCol, linesNLB[pos.row][0].length);
        }
    }
    // down should move within wrapped text
    else {
        var lengthOfCurrentWrappedLine = wraps[currentRowInWrappedText].length;
        var lengthOfNextWrappedLine = wraps[currentRowInWrappedText + 1].length;
        pos.col += lengthOfCurrentWrappedLine + 1;
        if (currentCol > lengthOfNextWrappedLine)
            pos.col -= (currentCol - lengthOfNextWrappedLine)
    }

    if (!e.shiftKey){
        anch.col=pos.col;
        anch.row=pos.row;
    }
}

/**
 * Moving the position of the Caret when canvas is selected and user
 * presses left arrow
 *
 * @param {goog.events.BrowserEvent} e gives the key event with
 * associated data
 */
function leftArrow(e){
	if(typeToScript){
		if(pos.row!=anch.row || pos.col!=anch.col){
			if(!e.shiftKey){
				switchPosAndAnch();
				pos.row=anch.row;
				pos.col=anch.col;
				return;
			}
		}
		var change=false;
		if(pos.row==0 && pos.col==0) return;
		if(pos.col==0){
			pos.row--;
			pos.col=lines[pos.row].text.length;
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
 * Moving the position of the Caret when canvas is selected and user
 * presses right arrow
 *
 * @param {goog.events.BrowserEvent} e gives the key event with
 * associated data
 */
function rightArrow(e){
	if(typeToScript){
		if(pos.row!=anch.row || pos.col!=anch.col){
			if(!e.shiftKey){
				switchPosAndAnch();
				anch.row=pos.row;
				anch.col=pos.col;
				return;
			}
		}
		var change=false;
		if(pos.col==lines[pos.row].text.length && pos.row==lines.length-1)return;
		if(pos.col==lines[pos.row].text.length){
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

/**
 * When pageup is pressed scroll the script up one full page.
 */
function pageUp(){
	scroll(-(lineheight*72))
}

/**
 * When pagedown is pressed scroll the script down one full page.
 */
function pageDown(){
	scroll(lineheight*72)
};
