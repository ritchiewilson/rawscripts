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
 * Draw the scrollbar for the editor in the <canvas> element. Called
 * from paint().
 *
 * @param { canvas context } ctx The canvas context to be drawn on
 */
function drawScrollBar(ctx){
    var height = goog.dom.getElement('canvasText').height-23;
    var pagesHeight = (pageBreaks.length+1)*72*lineheight+lineheight;
    var barHeight = height*height/pagesHeight;
    if (barHeight<20)barHeight=25;
    if (barHeight>=height)barHeight=height;
    var topPixel = (vOffset/(pagesHeight-height))*(height-barHeight);
    if (goog.dom.getElement('canvasText').style.cursor == 'default' || scrollBarBool){ctx.fillStyle = '#22b'}
    else{ctx.fillStyle = '#55f'};
    ctx.fillRect(editorWidth-16.5, topPixel, 12,barHeight);

    // remember where we're drawing this
    scrollBarPos={x:editorWidth-16.5, y:topPixel, w:12, h:barHeight}
}

/**
 * When user is searching for text in a script, the result of the
 * RegExp is put into an array.  This goes through and highlights
 * everything in the array.
 *
 * @param { canvas context } ctx The canvas context to be drawn on
 * @param { integer } pageStartX The x coordinate of start of page
 */
function drawFindArr(ctx, pageStartX){
	if(findArr.length!=0 || findReplaceArr.length!=0){
		ctx.fillStyle="yellow";
		var l = (findArr.length==0 ? goog.dom.getElement("fr_find_input").value.length : goog.dom.getElement("find_input").value.length);
		var drawArr=(findArr.length==0 ? findReplaceArr : findArr)
		
		// figure out what page to start printing on
		// i.e. only draw if it'll be visible on screen
		var firstPrintedPage = Math.round(vOffset/(72*lineheight)-0.5);
		var startLine=(firstPrintedPage!=0 ? pageBreaks[firstPrintedPage-1][0] : 0);
		for(i in drawArr){
			if(drawArr[i][0]>startLine){
				var p = canvasPosition(drawArr[i][0],drawArr[i][1],pageStartX);
				if(p.canvasY>editorHeight)break;
				ctx.fillRect(p.canvasX,p.canvasY+4,l*fontWidth,Math.round(lineheight * 0.8));
			}
		}
	}
}

/**
 * Draws the range of highlighted text in the script. Done on the
 * <canvas> element.
 *
 * @param { canvas context } ctx The canvas context to be drawn on
 * @param { integer } pageStartX The x coordinate of start of page
 */
function drawRange(ctx, pageStartX){
	if(pos.row==anch.row && anch.col==pos.col){
		return;
	}
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
	var blueheight = Math.round(lineheight * 0.9);
	
	// Now compare stuff and draw blue boxen
	ctx.fillStyle='lightBlue';
	
	// if this is only on one wrapped line
	if(e.canvasY==s.canvasY){
		var onlyBlueLine = s.canvasX;
		ctx.fillRect(onlyBlueLine, s.canvasY,e.canvasX-s.canvasX, blueheight);
	}
	else{
		// if the range doesn't fall on one bit of wrapped
		// text, cycle through lines, and linesNLB to draw
		// boxes in line by line.
		var y = lineheight*9+3;
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
			if(y-vOffset>editorHeight)break;
			if(i>endRange.row)break;
			var tc=0; // keep track of total characters passed through so far
			for(var j=0; j<linesNLB[i].length; j++){
				if(pageBreaks.length!=0 && pageBreaks[count]!=undefined && pageBreaks[count][0]==i && pageBreaks[count][2]==j){
					y=72*lineheight*(count+1)+9*lineheight+3;
					count++;
					if(j!=0 && lines[i].format==3){
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
						if(lines[i].format==5){
							ctx.fillRect(textDistanceFromEdge[lines[i].format]*fontWidth+pageStartX-(linesNLB[i][j].length*fontWidth), y-vOffset, linesNLB[i][j].length*fontWidth, blueheight);
						}
						else{
							ctx.fillRect(textDistanceFromEdge[lines[i].format]*fontWidth+pageStartX, y-vOffset, linesNLB[i][j].length*fontWidth,blueheight);
						}
					}
					if(tc<=startRange.col && startRange.col<(tc+linesNLB[i][j].length)){
						ctx.fillRect(s.canvasX, s.canvasY, (tc+linesNLB[i][j].length-startRange.col)*fontWidth,blueheight);
					}
				}
				else if(i==endRange.row && i!=startRange.row){
					// for drawing range in a block that contains
					// the end of the range, but not the start
					if(tc+linesNLB[i][j].length<endRange.col){
						if(lines[i].format==5){
							ctx.fillRect(textDistanceFromEdge[lines[i].format]*fontWidth+pageStartX-(linesNLB[i][j].length*fontWidth), y-vOffset, linesNLB[i][j].length*fontWidth,blueheight);
						}
						else{
							ctx.fillRect(textDistanceFromEdge[lines[i].format]*fontWidth+pageStartX, y-vOffset, linesNLB[i][j].length*fontWidth,blueheight);
						}
					}
					if(tc<endRange.col && endRange.col<=(tc+linesNLB[i][j].length)){
						ctx.fillRect(e.canvasX-(endRange.col-tc)*fontWidth, e.canvasY, (endRange.col-tc)*fontWidth, blueheight)
					}
					
				}
				else if(i==startRange.row && i==endRange.row){
					// for drawing range in a block that contains
					// the both the start and end of the range
					if(tc<startRange.col && startRange.col<(tc+linesNLB[i][j].length)){
						ctx.fillRect(s.canvasX, s.canvasY, (tc+linesNLB[i][j].length-startRange.col)*fontWidth,blueheight);
					}
					else if(tc<endRange.col && endRange.col<(tc+linesNLB[i][j].length)){
						ctx.fillRect(e.canvasX-(endRange.col-tc)*fontWidth, e.canvasY, (endRange.col-tc)*fontWidth, blueheight)
					}
					else if(tc>startRange.col && tc<endRange.col){
						if(lines[i].format==5){
							ctx.fillRect(textDistanceFromEdge[lines[i].format]*fontWidth+pageStartX-(linesNLB[i][j].length*fontWidth), y-vOffset, linesNLB[i][j].length*fontWidth, blueheight);
						}
						else{
							ctx.fillRect(textDistanceFromEdge[lines[i].format]*fontWidth+pageStartX, y-vOffset, linesNLB[i][j].length*fontWidth, blueheight);
						}
					}
				}
				else if(i>startRange.row){
					// for drawing range in a block that contains
					// neither the start or the end of the range
					// i.e. the stuff int he middle.
					if(lines[i].format==5){
						ctx.fillRect(textDistanceFromEdge[lines[i].format]*fontWidth+pageStartX-(linesNLB[i][j].length*fontWidth), y-vOffset, linesNLB[i][j].length*fontWidth, blueheight);
					}
					else{
						ctx.fillRect(textDistanceFromEdge[lines[i].format]*fontWidth+pageStartX, y-vOffset, linesNLB[i][j].length*fontWidth, blueheight);
					}
				}
				y+=lineheight;
				tc+=linesNLB[i][j].length+1;
			}
		}
    }
}

/**
 * Cycle through the notes in the global array "notes". Sort the notes
 * so they are in order.  figure out where they are, and if it is in
 * view, send it to drawNote() to draw it.
 *
 * @param { canvas context } ctx The canvas context to be drawn on
 * @param { integer } pageStartX The x coordinate of start of page
 */
function drawNotes(ctx, pageStartX){
	notesPosition=[];
	var notesArr=[];
	if(viewNotes){
		for (note in notes){
			notesArr.push(notes[note]);
		}
	}
	notesArr = notesArr.sort(sortNumbers);
	ctx.strokeStyle="#111";
	ctx.fillStyle="dodgerBlue"
	for(i in notesArr){
		var p = canvasPosition(notes[i].row, notes[i].col, pageStartX);
		if(p.canvasY>editorHeight)break;
		if(p.canvasY>-10){
			drawNote(p.canvasX, p.canvasY, ctx, notes[i]);
		}
	}
		
}

/**
 * Get the on screen position and id of note and draw it to <canvas>.
 *
 * @param { integer } x The x position on the canvas of the note to be drawn
 * @param { integer } y The y position on the canvas of the note to be drawn
 * @param { canvas context} ctx The canvas context
 */
function drawNote(x, y, ctx, note){
	y+=0.5;
	x-=3.5;
	var radius = 3,
		width = 7,
		height = 8;
	notesPosition.push([x, y, note.thread_id])
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
	ctx.stroke();
	ctx.fill();
	
	ctx.beginPath();
	for(var i=1; i<4; i++){
		ctx.moveTo(x+2, y+(2*i));
		ctx.lineTo(x+width-2, y+(2*i));
		ctx.stroke();
	}
}

/**
 * Draws the grey backing on the canvas, then the white pages and the
 * dark grey border.
 * 
 * @param { canvas context } ctx The canvas context to be drawn on
 * @param { integer } pageStartX The x coordinate of start of page
 */
function drawPages(ctx, pageStartX){
	ctx.fillStyle = '#bbb';
	ctx.fillRect(0, 0, editorWidth, goog.dom.getElement('canvasText').height);
	ctx.font=font;
	ctx.lineWidth = 1;
	var pageStartY = lineheight-vOffset;
	var firstPrintedPage = Math.round(vOffset/(72*lineheight)-0.5);
	pageStartY+=(firstPrintedPage*72*lineheight);
	for(var i=firstPrintedPage; i<=pageBreaks.length;i++){
		if (pageStartY>editorHeight)break;
		ctx.fillStyle = background;
		ctx.fillRect(pageStartX, pageStartY, fontWidth*87, lineheight*70);
		ctx.strokeStyle = '#000';
		ctx.strokeRect(pageStartX, pageStartY, Math.round(fontWidth*87), lineheight*70);
		ctx.strokeStyle = '#999';
		ctx.strokeRect(pageStartX-2, pageStartY-2, Math.round(fontWidth*87)+4, lineheight*70+4);
		ctx.fillStyle = foreground;
		if(i>0)ctx.fillText(String(i+1)+'.', 68.75*fontWidth+pageStartX, pageStartY+85);
		pageStartY+= lineheight*72;
	}
}

/**
 * Draws the grey backing behind sluglines to the <canvas>
 *
 * @param { canvas context } ctx The canvas context to be drawn on
 * @param { integer } pageStartX The x coordinate of start of page
 */
function drawSluglineBacking(ctx, pageStartX){
	ctx.fillStyle='#ddd';
	var firstPrintedPage = Math.round(vOffset/(72*lineheight)-0.5);
	var startLine=(firstPrintedPage!=0 ? pageBreaks[firstPrintedPage-1][0] : 0);
	for (var i=startLine;i<linesNLB.length;i++){
		if(lines[i].format==0){
			var p = canvasPosition(i,0,pageStartX)
			if(p.canvasY>editorHeight)break;
			if(p.canvasY>-10){
				for(var j=0; j<linesNLB[i].length-1;j++){
					ctx.fillRect(p.canvasX-3,p.canvasY+2+(lineheight*j), fontWidth*61.5, (lineheight * 1.1));
				}
			}
		}
	}
}
/**
 * Draws the caret to the <canvas>
 *
 * @param { canvas context } ctx The canvas context to be drawn on
 * @param { integer } pageStartX The x coordinate of start of page
 */
function drawCaret(ctx, pageStartX){
	var d= new Date();
	var newMilli = d.getMilliseconds();
	var diff = newMilli-milli;
	// only draw caret when you have to.
	if ((diff>0 && diff<500) || (diff<0 && diff<-500)){
		ctx.fillStyle=foreground;
		var p = canvasPosition(pos.row,pos.col, pageStartX);
		ctx.fillRect(p.canvasX, p.canvasY, 2, (lineheight * 1.3));
	}
}

/**
 * Draws a series of parallel lines down the page. Not used in the
 * software, just occasionally used for development in measuring
 * things.
 */
function drawGuides(){
	var canvas = goog.dom.getElement('canvasText');
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

/**
 * Draws text to the <canvas>. Only draws text if it will actually be
 * shown in the window.
 * 
 * @param { canvas context } ctx The canvas context to be drawn on
 * @param { integer } pageStartX The x coordinate of start of page
 */
function drawText(ctx, pageStartX){
	ctx.fillStyle=foreground;
	ctx.font=font;
	var y = lineheight*10;
	var count = 0;
	var startLine = 0;
	// figure out what page to start printing on
	var firstPrintedPage = Math.round(vOffset/(72*lineheight)-0.5);
	if(firstPrintedPage!=0){
		count=firstPrintedPage-1;
		y=72*lineheight*(count)+10*lineheight;
		startLine=pageBreaks[count][0];
	}
	//figure out character with most recent dialog for CONT'Ds
	var latestCharacter=''
	var i=startLine;
	while(i>0){
		i--;
		if(lines[i].format==0)break; // if a scene header is encounterd, don't look further
		if(lines[i].format==2){latestCharacter=lines[i].format;break} //when character found
	}
	//Stary Cycling through lines
	for (var i=startLine; i<linesNLB.length; i++){
		if(y-vOffset>editorHeight)break; // quit drawing if off page
		for(var j=0; j<linesNLB[i].length; j++){
			if(pageBreaks.length!=0 && pageBreaks[count]!=undefined && pageBreaks[count][0]==i && pageBreaks[count][2]==j){
				if(j!=0 && lines[i].format==3){
					ctx.fillText("(MORE)", textDistanceFromEdge[2]*fontWidth+pageStartX, y-vOffset)
				}
				y=72*lineheight*(count+1)+10*lineheight;
				count++;
				if(j!=0 && lines[i].format==3){
					var cbpb=''; // character before page break
					var lci=i-1 //latest character iterator
					while(lci>=0){
						if(lines[lci].format==2){
							cbpb = lines[lci].text;
							break;
						}
						lci--;
					}
					ctx.fillText(cbpb.toUpperCase()+" (CONT'D)", textDistanceFromEdge[2]*fontWidth+pageStartX, y-vOffset)
					y+=lineheight;
				}
				if(count>=pageBreaks.length){
					count=pageBreaks.length-2;
				}
			}
			if(lines[i].format==5){
				ctx.fillText(linesNLB[i][j], textDistanceFromEdge[lines[i].format]*fontWidth+pageStartX-(linesNLB[i][j].length*fontWidth) , y-vOffset);
			}
			else if(lines[i].format==2 && lines[i].text==latestCharacter && latestCharacter!=''){
					ctx.fillText(linesNLB[i][j]+" (CONT'D)", textDistanceFromEdge[lines[i].format]*fontWidth+pageStartX , y-vOffset);
			}
			else{
				ctx.fillText(linesNLB[i][j], textDistanceFromEdge[lines[i].format]*fontWidth+pageStartX , y-vOffset);
			}
			
			if(lines[i].format==2)latestCharacter=lines[i].text;
			if(lines[i].text==0)latestCharacter='';
			y+=lineheight;
		}
	}
}

/**
 * requestAnimationFrame is a nice new HTML5 API. It let's the browser
 * know that what you're doing is an animation, so it can sync it with
 * other graphics functions. It can harware accelrate it. It will only
 * do it when necessary. Great stuff.
 *
 * But, it's nonstandard, to check if the browser supports it, use the
 * right right API, and use setTimeout() as a fallback. Nice shim.
 */
var requestAnimFrame = (function(){
	return function(/* function */ callback, /* DOMElement */ element){
			window.setTimeout(callback, 1000 / 60);
		};
})();


/**
 * BIG ASS IMPORTANT FUNCTION. This is called multiple times a second
 * and draws an animation frame. The result of the animation is the
 * screenplay editor in a <canvas> element.
 *
 * Depending on the browser and it's capabilites, this is called from
 * mozRequestAnimationFrame, webkitRequestAnimationFrame, etc. The
 * fallback is setTimeout(). All these posible posible APIs are kept
 * in the shim window.requestAnimeFrame().
 */
function paint(){
	var TIME=new Date().getMilliseconds();
	var pageStartX= Math.round((editorWidth-fontWidth*87-24)/2);
	var canvas = goog.dom.getElement('canvasText');
	var ctx = canvas.getContext('2d');
	
	drawPages(ctx, pageStartX);
	drawSluglineBacking(ctx, pageStartX);
	drawFindArr(ctx, pageStartX);
	drawRange(ctx, pageStartX);
	drawText(ctx, pageStartX);
	drawCaret(ctx, pageStartX);
	drawNotes(ctx, pageStartX);
	drawScrollBar(ctx);
	
	var d = new Date();
	//console.log(TIME - d.getMilliseconds());
    timeOfLastPaint = new Date().getTime();
};
