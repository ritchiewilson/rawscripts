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
 * Makes sure the pos is after anch. helpful
 * in a half dozen functions
 */
function switchPosAndAnch(){
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
}

/**
 * Looks through linesNLB to figure out
 * where to put pageBreaks. Updates
 * the array pageBreaks for other functions
 * to use. Identical to pagination in PDF
 * export on serverside python
 */
function pagination(){
	// get rid of old results
	pageBreaks = [];
	var i = 0; // iterator through all lines
	var r=0; // remainder, for when lines split across pages
	while(i<lines.length){
		lineCount = r;
		//cycle through lines until you get to the end of a page
		while(lineCount+linesNLB[i].length<56){
			lineCount+=linesNLB[i].length;
			i++;
			if (i==lines.length){
				return;
			}
		}
		var s=0; // split across page. i.e. number of lines that end up on new page
		r=0;
		if(lines[i].format==3 && lineCount<54 && lineCount+linesNLB[i].length>57){
			// for if dialog is split across pages
			s=55-lineCount;
			r=1-s;
			lineCount=56;
		}
		else if(lines[i].format==3 && lineCount<54 && linesNLB[i].length>4){
			// for if dialog is split across pages, keeping two lines on both pages
			s=linesNLB[i].length-3;
			r=1-s;
			lineCount=55;
		}
		else if(lines[i].format==1 && lineCount<55 && lineCount+linesNLB[i].length>57){
			// for if dialog is split across pages
			s=55-lineCount;
			r=1-s;
			lineCount=56;
		}
		else if(lines[i].format==1 && lineCount<55 && linesNLB[i].length>4){
			// for if action is split across pages, keeping two lines on both pages
			s=linesNLB[i].length-3;
			r=1-s;
			lineCount=55;
		}
		else{
			// not splitting lines across pages, so just
			// make sure that the page doesn't end with 
			// Slugline, character or parenthetical
			while(lines[i-1].format==0 || lines[i-1].format==2 || lines[i-1].format==4){
				i--;
				lineCount-=linesNLB[i].length;
			}
		}
		// add info to pageBreaks array
		pageBreaks.push([i, lineCount, s]);
	}
}

/**
 * Given a col and row of text, finds
 * the onscreen position. Used for caret
 * and range, and any future uses
 * @param { integer } r Row of text
 * @param { integer } c Colulmn of text
 */
function canvasPosition(r,c, pageStartX){
	// for if notes appear before line
	var cd=0; //character differance
	if(c<0){
		cd=c;
		c=0;
	}
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
	
	
	// adjust if this isn't first page, and
	// there may be page splits in text
	if(page!=0){
		y-=(pageBreaks[page-1][2]*lineheight);
		y+=(lines[pageBreaks[page-1][0]].format==3 ? lineheight : 0);
	}
	
	//figure which line to start counting from
	var i=(page==0 ? 0 : pageBreaks[page-1][0]);
	while(i<r){
		y+=linesNLB[i].length*lineheight;
		i++
	}
	
	// figure out lateral position
	var x = textDistanceFromEdge[lines[r].format]*fontWidth;
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
	x+=(c-s-i+cd)*fontWidth;
	
	// for Transition format
	if(lines[r].format==5){
		x-=(linesNLB[r][i].length*fontWidth)
	}
	return {canvasX:x, canvasY:y-vOffset}
}

/**
 * Called on init, wrap each line
 */
function wrapAll(){
	for(var i=0;i<lines.length;i++){
		var a = getLines(i);
	}
}

/**
 * @param {integer} which line to figure out
 * @return {boolean} whether or not should re-paginate after wrap
 */
function getLines(v) {
	var oldLineBreaks = (linesNLB[v]==null ? false : linesNLB[v].length); // remember how many wrapped lines currently
	var wa=lines[v].text.split(" "); // word array
	var phraseArray=[]; // phrase is the wrapped line, incrementally assembled
	var lastPhrase=""; // the wrapped line to add to array
	var l=WrapVariableArray[lines[v].format][0]; // number or character per line
	var uc=WrapVariableArray[lines[v].format][3]; // uppercase?
	var measure=0;
	for (var i=0;i<wa.length;i++){
		// loop through all words in this line
		// figuring out where to put line breaks
		var w=wa[i]; // word in word array
		measure=(lastPhrase+" "+w).length;
		if (measure<l) {
			// add another word to phrase if there is room
			lastPhrase+=(w+" ");
		}
		else{
			// add phrase to array when limit is reached
			if(uc==1)lastPhrase=lastPhrase.toUpperCase();
			phraseArray.push(lastPhrase.slice(0,-1));
			// get set to start over
			lastPhrase=w+" ";
		}
		if (i===wa.length-1){
			// when reach the last word, just add the
			// remainder to the array
			if(uc==1)lastPhrase=lastPhrase.toUpperCase();
			phraseArray.push(lastPhrase.slice(0,-1));
			break;
		}
	}
	// for stuff that needs bottom spacing, add blank lines
	var addBlankLine=WrapVariableArray[lines[v].format][4]-1;
	var i=0;
	while(i < addBlankLine){
		phraseArray.push("");
		i++;
	}
	// when parenthetical is between two dialogs, remove that blank line
	if(lines[v].format==4 && v!=0 && lines[v-1].format==3 && linesNLB[v-1][linesNLB[v-1].length-1]=='')linesNLB[v-1].pop();
	
	// add all this data to linesNLB
    linesNLB[v] = phraseArray;
	
	// return weather or not to re paginate
	if(oldLineBreaks = false || oldLineBreaks-phraseArray.length!=0){
		return true
	}
	else{
		return false
	}
}

/**
 * Figures out if the caret (pos) is 
 * visible. If not, scroll so that it
 * is.
 */
function autoScroll(){
	// find position of caret. X is less important
	// so just feed pageStartX as 0
	var p = canvasPosition(pos.row,pos.col,0)
	var c = goog.dom.getElement('canvasText').height //canvas height
	if(p.canvasY>c-40 || p.canvasY<-2){
		vOffset+=p.canvasY-(c*0.5);
		scroll(0);
	}
}

/*
 * figures if pos or anch is out of 
 * acceptible range, fixes it
 */
function caretInLimits(){
	if(pos.row<0)pos.row=0;
	if(anch.row<0)anch.row=0;
	if(pos.row>lines.length-1)pos.row=lines.length-1;
	if(anch.row>lines.length-1)anch.row=lines.length-1;
	if(pos.col<0)pos.col=0;
	if(anch.col<0)anch.col=0;
	if(pos.col>lines[lines.length-1].text.length)pos.col=lines[lines.length-1].text.length
	if(anch.col>lines[lines.length-1].text.length)anch.col=lines[lines.length-1].text.length
}

/**
 * There is no native method for getting text height in HTML5
 * canvas. So there is this, grabbed verbatim from
 * stackoverflow. Thanks Prestaul.
 */
function measureTextHeight() {
    var ctx = goog.dom.getElement('canvasText').getContext('2d'),
        left=0,
        top=0,
        width = goog.dom.getElement('canvasText').width,
        height = goog.dom.getElement('canvasText').height;
        top = Math.round(height * 0.8);
    // Draw the text in the specified area
    ctx.clearRect(0,0,width,height);
    ctx.fillStyle = 'white';
    ctx.fillText('gM',left,top); // This seems like tall text...  Doesn't it?

    // Get the pixel data from the canvas
    var data = ctx.getImageData(0, 0, width, height).data,
        first = false, 
        last = false
        r = height,
        c = 0;

    // Find the last line with a non-white pixel
    while(!last && r) {
        r--;
        for(c = 0; c < width; c++) {
                if(data[r * width * 4 + c * 4 + 3]) {
                        last = r;
                        break;
                }
        }
    }

    // Find the first line with a non-white pixel
    while(r) {
        r--;
        for(c = 0; c < width; c++) {
                if(data[r * width * 4 + c * 4 + 3]) {
                        first = r;
                        break;
                }
        }

        // If we've got it then return the height
        if(first != r) return last - first;
    }

    // We screwed something up...  What do you expect from free code?
    return 13; // return a default value
}


/**
 * Go through captured user inputs and 
 * update stuff
 */
function calculate(){
	if(updateMouseDrag!=false){
		if(updateMouseDrag.clientY<100){
			scroll(-20);
			var c=goog.dom.getElement('ccp');
			c.focus();
			c.select();
		}
		else if(updateMouseDrag.clientY>goog.style.getSize(goog.dom.getElement('container')).height-20)scroll(20);
		else{
			var p=mousePosition(updateMouseDrag);
			pos.row=p.row;
			pos.col=p.col;
			lineFormatGuiUpdate();
			fillInfoBar();
			updateMouseDrag=false;
		}
	}
	if(resizeElements==true){
		setElementSizes('r');
		resizeElements=false;
	}
	if(fontWidth==0){
		var ctx = goog.dom.getElement('canvasText').getContext('2d');
		ctx.font = font;
		fontWidth = ctx.measureText('A').width;
		var textheight = measureTextHeight();
		lineheight = Math.round(textheight * 1.4);
	}
	
}