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
		var drawArr=(findArr.length==0 ? findReplaceArr : findArr)
		
		// figure out what page to start printing on
		// i.e. only draw if it'll be visible on screen
		var firstPrintedPage = Math.round(vOffset/(72*lineheight)-0.5);
		var startLine=(firstPrintedPage!=0 ? pageBreaks[firstPrintedPage-1][0] : 0);
		for(i in drawArr){
			if(drawArr[i][0]>startLine){
				var p = canvasPosition(drawArr[i][0],drawArr[i][1],pageStartX);
				if(p.canvasY>1200)break;
				ctx.fillRect(p.canvasX,p.canvasY+4,l*fontWidth,lineheight-2);
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
			if(y-vOffset>1200)break;
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
							ctx.fillRect(WrapVariableArray[lines[i].format][1]+pageStartX-(linesNLB[i][j].length*fontWidth), y-vOffset, linesNLB[i][j].length*fontWidth,12);
						}
						else{
							ctx.fillRect(WrapVariableArray[lines[i].format][1]+pageStartX, y-vOffset, linesNLB[i][j].length*fontWidth,12);
						}
					}
					if(tc<=startRange.col && startRange.col<(tc+linesNLB[i][j].length)){
						ctx.fillRect(s.canvasX, s.canvasY, (tc+linesNLB[i][j].length-startRange.col)*fontWidth,12);
					}
				}
				else if(i==endRange.row && i!=startRange.row){
					// for drawing range in a block that contains
					// the end of the range, but not the start
					if(tc+linesNLB[i][j].length<endRange.col){
						if(lines[i].format==5){
							ctx.fillRect(WrapVariableArray[lines[i].format][1]+pageStartX-(linesNLB[i][j].length*fontWidth), y-vOffset, linesNLB[i][j].length*fontWidth,12);
						}
						else{
							ctx.fillRect(WrapVariableArray[lines[i].format][1]+pageStartX, y-vOffset, linesNLB[i][j].length*fontWidth,12);
						}
					}
					if(tc<endRange.col && endRange.col<=(tc+linesNLB[i][j].length)){
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
						if(lines[i].format==5){
							ctx.fillRect(WrapVariableArray[lines[i].format][1]+pageStartX-(linesNLB[i][j].length*fontWidth), y-vOffset, linesNLB[i][j].length*fontWidth,12);
						}
						else{
							ctx.fillRect(WrapVariableArray[lines[i].format][1]+pageStartX, y-vOffset, linesNLB[i][j].length*fontWidth,12);
						}
					}
				}
				else if(i>startRange.row){
					// for drawing range in a block that contains
					// neither the start or the end of the range
					// i.e. the stuff int he middle.
					if(lines[i].format==5){
						ctx.fillRect(WrapVariableArray[lines[i].format][1]+pageStartX-(linesNLB[i][j].length*fontWidth), y-vOffset, linesNLB[i][j].length*fontWidth,12);
					}
					else{
						ctx.fillRect(WrapVariableArray[lines[i].format][1]+pageStartX, y-vOffset, linesNLB[i][j].length*fontWidth,12);
					}
				}
				y+=lineheight;
				tc+=linesNLB[i][j].length+1;
			}
		}
    }
}

function drawNotes(ctx, pageStartX){
	notesPosition=[];
	// calc if there are notes in this line
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
		if(p.canvasY>1200)break;
		if(p.canvasY>-10){
			drawNote(p.canvasX, p.canvasY, ctx, notes[i]);
		}
	}
		
}
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

function drawPages(ctx, pageStartX){
	ctx.font=font;
	ctx.lineWidth = 1;
	var pageStartY = lineheight-vOffset;
	var firstPrintedPage = Math.round(vOffset/(72*lineheight)-0.5);
	pageStartY+=(firstPrintedPage*72*lineheight);
	for(var i=firstPrintedPage; i<=pageBreaks.length;i++){
		if (pageStartY>1200)break;
		ctx.fillStyle = background;
		ctx.fillRect(pageStartX, pageStartY, fontWidth*87, lineheight*70);
		ctx.strokeStyle = '#000';
		ctx.strokeRect(pageStartX, pageStartY, Math.round(fontWidth*87), lineheight*70);
		ctx.strokeStyle = '#999';
		ctx.strokeRect(pageStartX-2, pageStartY-2, Math.round(fontWidth*87)+4, lineheight*70+4);
		ctx.fillStyle = foreground;
		if(i>0)ctx.fillText(String(i+1)+'.', 550+pageStartX, pageStartY+85);
		pageStartY+= lineheight*72;
	}
}

function drawSluglineBacking(ctx, pageStartX){
	ctx.fillStyle='#ddd';
	var firstPrintedPage = Math.round(vOffset/(72*lineheight)-0.5);
	var startLine=(firstPrintedPage!=0 ? pageBreaks[firstPrintedPage-1][0] : 0);
	for (var i=startLine;i<linesNLB.length;i++){
		if(lines[i].format==0){
			var p = canvasPosition(i,0,pageStartX)
			if(p.canvasY>1200)break;
			if(p.canvasY>-10){
				for(var j=0; j<linesNLB[i].length-1;j++){
					ctx.fillRect(p.canvasX-3,p.canvasY+2+(lineheight*j), fontWidth*61.5, 14)
				}
			}
		}
	}
}

function drawCaret(ctx, pageStartX){
	var d= new Date();
	var newMilli = d.getMilliseconds();
	var diff = newMilli-milli;
	// only draw caret when you have to.
	if ((diff>0 && diff<500) || (diff<0 && diff<-500)){
		ctx.fillStyle=foreground;
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
		if(y-vOffset>1200)break; // quit drawing if off page
		for(var j=0; j<linesNLB[i].length; j++){
			if(pageBreaks.length!=0 && pageBreaks[count]!=undefined && pageBreaks[count][0]==i && pageBreaks[count][2]==j){
				if(j!=0 && lines[i].format==3){
					ctx.fillText("(MORE)", WrapVariableArray[2][1]+pageStartX, y-vOffset)
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
					ctx.fillText(cbpb.toUpperCase()+" (CONT'D)", WrapVariableArray[2][1]+pageStartX, y-vOffset)
					y+=lineheight;
				}
				if(count>=pageBreaks.length){
					count=pageBreaks.length-2;
				}
			}
			if(lines[i].format==5){
				ctx.fillText(linesNLB[i][j], WrapVariableArray[lines[i].format][1]+pageStartX-(linesNLB[i][j].length*fontWidth) , y-vOffset);
			}
			else if(lines[i].format==2 && lines[i].text==latestCharacter && latestCharacter!=''){
					ctx.fillText(linesNLB[i][j]+" (CONT'D)", WrapVariableArray[lines[i].format][1]+pageStartX , y-vOffset);
			}
			else{
				ctx.fillText(linesNLB[i][j], WrapVariableArray[lines[i].format][1]+pageStartX , y-vOffset);
			}
			
			if(lines[i].format==2)latestCharacter=lines[i].text;
			if(lines[i].text==0)latestCharacter='';
			y+=lineheight;
		}
	}
}

function paint(){
	var pageStartX= Math.round((editorWidth-fontWidth*87-24)/2);
	var canvas = goog.dom.getElement('canvas');
	var ctx = canvas.getContext('2d');
	
	ctx.fillStyle = '#bbb';
	ctx.fillRect(0, 0, editorWidth, canvas.height);
	
	drawPages(ctx, pageStartX);
	drawSluglineBacking(ctx, pageStartX);
	drawFindArr(ctx, pageStartX);
	drawRange(ctx, pageStartX);	
	drawText(ctx, pageStartX);
	drawCaret(ctx, pageStartX);
	drawNotes(ctx, pageStartX);	
	drawScrollArrows(ctx);
	drawScrollBar(ctx);
	
	if(mouseDownBool && pos.row<anch.row && mouseY<110)scroll(-20);
	if(mouseDownBool && pos.row>anch.row && mouseY>goog.dom.getElement('canvas').height-50)scroll(20);
	var d = new Date();
	var TIME = d.getMilliseconds();
	var d = new Date();
	//console.log(TIME - d.getMilliseconds());
}