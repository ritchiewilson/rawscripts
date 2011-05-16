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
        if(lines[i].format==3 && lineCount<54 && lineCount+linesNLB[i].length>57){
            s=55-lineCount;
            r=1-s;
            lineCount=56;
        }
        else if(lines[i].format==3 && lineCount<54 && linesNLB[i].length>4){
            s=linesNLB[i].length-3;
            r=1-s;
            lineCount=55;
        }
        else if(lines[i].format==1 && lineCount<55 && lineCount+linesNLB[i].length>57){
            s=55-lineCount;
            r=1-s;
            lineCount=56;
        }
        else if(lines[i].format==1 && lineCount<55 && linesNLB[i].length>4){
            s=linesNLB[i].length-3;
            r=1-s;
            lineCount=55;
        }
        else{
            while(lines[i-1].format==0 || lines[i-1].format==2 || lines[i-1].format==4){
                i--;
                lineCount-=linesNLB[i].length;
            }
        }
        pageBreaks.push([i, lineCount, s]);
    }
}

/**
 * Given a col and row of text, finds
 * the onscreen position. Used for caret
 * and range, and any future uses
 * @ param { integer } r Row of text
 * @ param { integer } c Colulmn of text
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
	var x = WrapVariableArray[lines[r].format][1];
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
	var wa=lines[v].text.split(" ");
	var phraseArray=[];
	var lastPhrase="";
	var l=WrapVariableArray[lines[v].format][0];
	var uc=WrapVariableArray[lines[v].format][3];
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
	var addBlankLine=WrapVariableArray[lines[v].format][4]-1;
	var i=0;
	while(i < addBlankLine){
		phraseArray.push("");
		i++;
	}
	if(lines[v].format==4 && v!=0 && lines[v-1].format==3 && linesNLB[v-1][linesNLB[v-1].length-1]=='')linesNLB[v-1].pop();
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
	var c = goog.dom.getElement('canvas').height //canvas height
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
 * Go through captured user inputs and 
 * update stuff
 */
function calculate(){
	if(updateMouseDrag!=false){
		var p=mousePosition(updateMouseDrag);
		pos.row=p.row;
		pos.col=p.col;
		lineFormatGuiUpdate();
		fillInfoBar();
		updateMouseDrag=false;
	}
}