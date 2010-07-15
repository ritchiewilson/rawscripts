   var OSName="Unknown OS";
   if (navigator.appVersion.indexOf("Win")!=-1) OSName="Windows";
   if (navigator.appVersion.indexOf("Mac")!=-1) OSName="MacOS";
   if (navigator.appVersion.indexOf("X11")!=-1) OSName="UNIX";
   if (navigator.appVersion.indexOf("Linux")!=-1) OSName="Linux";
   if($.browser.webkit)var browser='webkit';
   if($.browser.mozilla)var browser='mozilla';
   if($.browser.opera)var browser='opera';
   var ud=0;
   var timer;
   var typeToScript=true;
   var pasting=false;
   var undoQue = [];
   var redoQue = [];
   var pageBreaks=[];
   var mouseX=0;
   var mouseY=0;
   var shiftDown=false;
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
    var WrapVariableArray = [[62, 111+50,0,1,2],[62,111+50,0,0,2],[40, 271+50,0,1,1],[36, 191+50,0,0,2],[30, 231+50,0,0,1],[61, 601+50,1,1,2]];
    
    //if ($.browser.mozilla)fontWidth=9;
    var editorWidth = 850;
    var headerHeight=65;
	var lines = [];
	/*
	 * Notes notation
	 * notes[x] refers to thread
	 * notes[x][0], notes[x][1] is row and col
	 * notes[x][2] is content
	 * notes[x][2].length is number of messages in thread
	 * notes[x][2][0] ,[1], [2] =content, user, timestamp
	 * */
	var notes = [[6,4,[["message from ritchie and stuff and ore thigs and words","ritchie","timestamp"],["response","kristen","newTimestamp"]],123456789],[10,5,[["Second message and stuffmessage from ritchie and stuff and ore thigs and words","ritchie","timestamp"],["response","kristen","newTimestamp"]],123456709]];
    notes=[];
    
    
$(document).ready(function(){
    document.getElementById('canvas').height = $('#container').height()-65;
    document.getElementById('sidebar').style.height = ($('#container').height()-65)+'px';
    document.getElementById('sidebar').style.width = ($('#container').width()-855)+'px';
    $('#container').mousewheel(function(e, d){if(e.target.id=='canvas'){e.preventDefault();scroll(-d*45);}});
    $(':radio').click(function(){
        var c = document.getElementsByTagName('input');
        for (i in c){
            if(c[i].type=='radio')c[i].checked=false;
        }
        this.checked=true;
        changeVersion(this.value);
    });
    var c = document.getElementsByTagName('input');
    var found = false;
    for(i in c){
        if(!found){
            if(c[i].type=='radio'){
                c[i].checked=true;
                found=true;
            }
        }
    }
  });
  $(window).resize(function(){
    document.getElementById('canvas').height = $('#container').height()-65;
    document.getElementById('sidebar').style.height = ($('#container').height()-65)+'px';
    document.getElementById('sidebar').style.width = ($('#container').width()-855)+'px';
  });
  $('*').mousedown(function(e){mouseDown(e)});
  $('*').mouseup(function(e){mouseUp(e)});
  $('*').mousemove(function(e){mouseMove(e)});
  

function setup(){
    resource_id=window.location.href.split('=')[1];
    $.post('/scriptcontent', {resource_id:resource_id}, function(data){
    if(data=='not found'){
        lines = [["Sorry, the script wasn't found.",1]];
        paint(false,false,true,false);
        return;
    }
    var p = JSON.parse(data);
    var title=p[0];
    document.getElementById('title').innerHTML=title;
    var x = p[1];
    for(var i=0; i<x.length; i++){
        lines.push([x[i][0], x[i][1]]);
    }
    if(lines.length==2){
        pos.row=1;
        anch.row=1;
        pos.col=lines[1][0].length;
        anch.col=pos.col;
    }
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    paint(false,false,true,false);
    setInterval('paint(false,false, false,false)', 40);
    });
}
function changeVersion(v){
    console.log(v);
    $.post('/getversion', {resource_id : resource_id, version : v}, function(d){
        var x = JSON.parse(d);
        lines=[]
        for (i in x){
            lines.push([x[i][0], x[i][1]]);
        }
        paint(false,false,true,false);
    });
}

function autosaveToggle(){
    var d=(document.getElementById('at').checked==true ? 'block' : 'none');
    var c = document.getElementsByTagName('tr');
    for (i in c){
        if (c[i].className=='manual')c[i].style.display=block3;
        if (c[i].className=='autosave')c[i].style.display=d;
    }
    
}


function mouseUp(e){
    mouseDownBool=false;
    scrollBarBool=false;
    var width = document.getElementById('canvas').width;
    var height = document.getElementById('canvas').height;
            
    if(e.clientY-headerHeight>height-39 && e.clientY-headerHeight<height && e.clientX>editorWidth-22 && e.clientX<editorWidth-2){
            if(e.clientY-headerHeight>height-20)scroll(30);
            else scroll(-30);
        }
}
function mouseDown(e){
    var height = document.getElementById('canvas').height;
    var pagesHeight = (pageBreaks.length+1)*72*lineheight;
    var barHeight = ((height)/pagesHeight)*(height-39);
    if (barHeight<20)barHeight=20;
    if (barHeight>=height-39)barHeight=height-39;
    var topPixel = (vOffset/(pagesHeight-height))*(height-39-barHeight)+headerHeight;
    if(e.clientX<editorWidth && e.clientX>editorWidth-20 && e.clientY>topPixel && e.clientY<topPixel+barHeight){
        scrollBarBool=true;
    }
}

function mouseMove(e){
    if(scrollBarBool)scrollBarDrag(e);
    mouseX=e.clientX;
    mouseY=e.clientY;
}
function scrollBarDrag(e){
    var diff = mouseY-e.clientY;
    var height = document.getElementById('canvas').height-50;
    var pagesHeight = (pageBreaks.length+1)*72*lineheight;
    vOffset-=pagesHeight/height*diff;
    if (vOffset<0)vOffset=0;
    var pagesHeight = (pageBreaks.length+1)*72*lineheight-document.getElementById('canvas').height;
    if(vOffset>pagesHeight)vOffset=pagesHeight;
}
function scroll(v){
    vOffset+=v;
    if (vOffset<0)vOffset=0;
    var pagesHeight = (pageBreaks.length+1)*72*lineheight-document.getElementById('canvas').height;
    if(vOffset>pagesHeight)vOffset=pagesHeight;
	//if(document.getElementById('suggestBox')!=null)createSuggestBox('c');
}
function jumpTo(v){
    if(v!=''){
        var e = parseInt(v.replace('row',''));
        pos.row=e;
        anch.row=pos.row;
        pos.col=lines[pos.row][0].length;
        anch.col=pos.col;
    }
    else var e=pos.row;
    var scrollHeight=0;
    for(var i=0;i<e;i++){
        for(var count=0; count<pageBreaks.length; count++){
            if(pageBreaks[count][0]==i){
                scrollHeight+=lineheight*(72-pageBreaks[count][1]);
            }
        }
        scrollHeight+=(linesNLB[i].length*lineheight);
    }
    vOffset=scrollHeight;
    var pagesHeight = (pageBreaks.length+1)*72*lineheight-document.getElementById('canvas').height;
    if(vOffset>pagesHeight)vOffset=pagesHeight;
}
function upArrow(){
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
            
            //if this is the first line in a block of wrapped text
            if(integ==0){
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
                        if(wordsArr.slice(word).join().length<=wrapVars[0]){
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
                        if(wordsArr.slice(word).join().length<=wrapVars[0]){
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
        if(!shiftDown){
            anch.col=pos.col;
            anch.row=pos.row;
        }
        paint(false,false,false,true);
    }
	else if(document.getElementById('suggestBox')!=null){
		var f=document.getElementById('focus');
		f.removeAttribute('id');
		f=f.previousSibling;
		if(f==null)f=document.getElementById('suggestBox').lastChild;
		if(f.nodeType=="#text")f=f.previousSibling;
		if(f==null)f=document.getElementById('suggestBox').lastChild;
		f.id='focus';
	}
}
	
function downArrow(){
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
                if(wordsArr.slice(word).join().length<=wrapVars[0]){
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
        if(!shiftDown){
            anch.col=pos.col;
            anch.row=pos.row;
        }
        paint(false,false,false,true);
    }
	else if(document.getElementById('suggestBox')!=null){
		var f=document.getElementById('focus');
		f.removeAttribute('id');
		f=f.nextSibling;
		if(f==null)f=document.getElementById('suggestBox').firstChild;
		if(f.nodeType=="#text")f=f.nextSibling;
		if(f==null)f=document.getElementById('suggestBox').firstChild;
		f.id='focus';
	}
}

function leftArrow(){
    if(typeToScript){
		var change=false;
        if(pos.row==0 && pos.col==0) return;
        if(pos.col==0){
            pos.row--;
            pos.col=lines[pos.row][0].length;
			var change=true;
        }
        else{
            pos.col = pos.col-1;
        }
        
        if(!shiftDown){
            anch.col=pos.col;
            anch.row=pos.row;
        }
		var c =document.getElementById('suggestBox');
		if(change && c!=null)c.parentNode.removeChild(c);
    }
}
	
function rightArrow(){
    if(typeToScript){
		var change=false;
        if(pos.col==lines[pos.row][0].length && pos.row==lines.length-1)return;
        if(pos.col==lines[pos.row][0].length){
            pos.row++;
            pos.col=0;
			change=true;
        }
        else pos.col = pos.col+1;
        
        if(!shiftDown){
            anch.col=pos.col;
            anch.row=pos.row;
        }
		var c =document.getElementById('suggestBox');
		if(change && c!=null)c.parentNode.removeChild(c);
    }
}

function backspace(e){
    if(typeToScript){
        saveTimer();
		redoQue=[];
        if(e)e.preventDefault();
        var forceCalc=false;
        var slug=false;
        if (lines[pos.row][1]==0)var slug=true;
        // simple case, one letter backspace
        if(pos.row==anch.row && pos.col==anch.col){
            if(pos.col==0 && pos.row==0) return;
            else if(lines[pos.row][1]==4 && pos.col==1){
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
                var j=lines[pos.row][0];
                if(j.charAt(0)=='(')j=j.substr(1);
                if(j.charAt(j.length-1)==')')j=j.slice(0,-1);
                var newPos = lines[pos.row-1][0].length;
                lines.splice(pos.row,1);
                pos.row--
                pos.col=newPos;
                lines[pos.row][0]=lines[pos.row][0]+j;
                undoQue.push(['back',pos.row, pos.col,'line',4]);
            }
            else if(pos.col==0){
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
                var elem = lines[pos.row][1];
                var j = lines[pos.row][0];
                lines.splice(pos.row,1);
                var newPos = lines[pos.row-1][0].length;
                lines[pos.row-1][0] = lines[pos.row-1][0]+j;
                pos.col=newPos;
                pos.row--;
                undoQue.push(['back',pos.row, pos.col,'line',elem]);
                forceCalc=true;
            }
            else{
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
            anch.col=pos.col;
            anch.row=pos.row;
        }
        // This is for deleting a range
        else{
            forceCalc=true;
            //put the focus after the anchor
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
            var undoCount=0;
            while(pos.col!=anch.col || pos.row!=anch.row){
                undoCount++;
                if(lines[pos.row][1]==0)slug=true;
                if(pos.col==0){
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
        }
        paint(false,false,forceCalc,false);
        if (slug)sceneIndex();
    }
}
function deleteButton(){
    if(typeToScript){
    saveTimer();
	redoQue=[];
        var slug=false;
        var forceCalc=false;
        if(pos.row==anch.row&&pos.col==anch.col){
            if (lines[pos.row][1]==0)var slug=true;
            if(pos.col==(lines[pos.row][0].length) && pos.row==lines.length-1) return;
            if(lines[pos.row][1]==4 && lines[pos.row][0]=='()'){
                undoQue.push(['delete',pos.row,pos.col,'line',4]);
                lines.splice(pos.row,1);
                pos.col=0;
                anch.col=0;
            }
            else if(pos.col==(lines[pos.row][0].length)){
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
                undoQue.push(['delete',pos.row,pos.col,'line',lines[pos.row+1][1]]);
                if (lines[pos.row+1][1]==0)slug=true;
                var j = lines[pos.row+1][0];
                lines.splice((pos.row+1),1);
                lines[pos.row][0]+=j;
                forceCalc=true;
            }
            else{
                undoQue.push(['delete',pos.row,pos.col,lines[pos.row][0][pos.col]]);
                lines[pos.row][0] = lines[pos.row][0].slice(0,pos.col)+lines[pos.row][0].slice(pos.col+1);
                //shift notes
                for(x in notes){
                    if(pos.row==notes[x][0]){
                        if (pos.col<notes[x][1])notes[x][1]=notes[x][1]-1;
                    }
                }
            }
        }
        // This is for deleting a range
        else{
            forceCalc=true;
            //put the focus after the anchor
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
            var undoCount=0;
            while(pos.col!=anch.col || pos.row!=anch.row){
                undoCount++;
                if(lines[pos.row][1]==0)slug=true;
                if(pos.col==0){
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
                }
                else{
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
        }
        paint(false,false,forceCalc,false);
        if (slug)sceneIndex();
    }
}
	
function enter(){
    if(typeToScript && document.getElementById('suggestBox')==null){
        saveTimer();
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
            
        var j = lines[pos.row][0].slice(0,pos.col);
        var k = lines[pos.row][0].slice(pos.col);
        lines[pos.row][0] = j;
        if (lines[pos.row][1] == 0)var newElem = 1;
        else if (lines[pos.row][1] == 1)var newElem = 2;
        else if (lines[pos.row][1] == 2)var newElem = 3;
        else if (lines[pos.row][1] == 4)var newElem = 3;
        else if (lines[pos.row][1] == 3)var newElem = 2;
        else if (lines[pos.row][1] == 5)var newElem = 0;
        var newArr = [k,newElem];
        lines.splice(pos.row+1,0,newArr);
        pos.row++;
        pos.col=0;
        anch.row=pos.row;
        anch.col=pos.col;
        // This means it was a scene before
        // so run scene index
        paint(false,false,true,false);
        if(lines[pos.row][1]==1)sceneIndex();
    }
	else if(document.getElementById('suggestBox')!=null){
        saveTimer();
        var len = lines[pos.row][0].length;
		lines[pos.row][0]=document.getElementById('focus').value;
        undoQue.push(['paste', pos.row, pos.col, lines[pos.row][0].substr(len)]);
		document.getElementById('suggestBox').parentNode.removeChild(document.getElementById('suggestBox'));
		pos.col=anch.col=lines[pos.row][0].length;
        sceneIndex();
	}
}

function tab(){
if(typeToScript){
    saveTimer();
    undoQue.push(['format',pos.row,pos.col,lines[pos.row][1], 'tab']);
    redoQue=[];
    var slug=false;
    if (lines[pos.row][1]==0)var slug=true;
	var type = lines[pos.row][1];
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
    if(slug)sceneIndex();
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
}
}
	
function handlekeypress(event) {
    if(typeToScript){
        event.preventDefault();
		redoQue=[];
        var d= new Date();
        milli = d.getMilliseconds();
        
        if (event.which!=13 && event.which!=37 && event.which!=0 && event.which!=8 && !commandDownBool){
            if(pos.row!=anch.row || pos.col!=anch.col)deleteButton();
            undoQue.push([String.fromCharCode(event.charCode), pos.row, pos.col]);
            lines[pos.row][0] = lines[pos.row][0].slice(0,pos.col) + String.fromCharCode(event.charCode) +lines[pos.row][0].slice(pos.col);
            pos.col++;
            if (lines[pos.row][1]==0)sceneIndex();
			if (lines[pos.row][1]==2){
				createSuggestBox('c');
			}
            if(lines[pos.row][1]==0){
                createSuggestBox('s');
            }
            //shift notes
            for(x in notes){
                if(pos.row==notes[x][0]){
                    if (pos.col<=notes[x][1])notes[x][1]=notes[x][1]+1;
                }
            }
            saveTimer();
            anch.col=pos.col;
            anch.row=pos.row;
        }
        
        document.getElementById('ccp').focus();
        document.getElementById('ccp').select();
    }
}

// Managining arrays
// calcing data
function undo(){
    saveTimer();
    if (undoQue.length==0)return;
    var dir = undoQue.pop();
	var tmp=[];
	for(x in dir){
		tmp.push(dir[x]);
	}
    redoQue.push(tmp);
    var forceCalc=false;
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
        }
    }
    else if(dir[0]=='format'){
        lines[dir[1]][1]=dir[3];
        if(lines[dir[1]][0].charAt(0)=='(')lines[dir[1]][0]=lines[dir[1]][0].substr(1);
        if(lines[dir[1]][0].charAt(lines[dir[1]][0].length-1)==')')lines[dir[1]][0]=lines[dir[1]][0].slice(0,-1);
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
            }
        }
    }
    else if(dir[0]=='paste'){
        // if string and not json
        if(dir[3][0]!='[' && dir[3][1]!='['){
            lines[dir[1]][0]=lines[dir[1]][0].slice(0, dir[2])+lines[dir[1]][0].slice(dir[2]+dir[3].length);
        }
        // if json
        else{
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
    paint(false,false,true,false);
    
}
function redo(){
    saveTimer();
    if (redoQue.length==0)return;
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
    }
    else if(dir[0]=='back'){
        if(dir[3]!='line'){
            lines[dir[1]][0] = lines[dir[1]][0].slice(0,dir[2]-1)+lines[dir[1]][0].slice(dir[2]);
            dir[2]=dir[2]-1;
        }
        else{
            
            var j = lines[dir[1]+1][0];
            lines.splice(dir[1]+1,1);
            lines[dir[1]][0] = lines[dir[1]][0]+j;
        }
    }
    else if(dir[0]=='delete'){
		if(dir[3]!='line'){
			lines[dir[1]][0] = lines[dir[1]][0].slice(0,dir[2])+lines[dir[1]][0].slice(dir[2]+1);
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
			}
			else{
				lines[dir[1]][0]=lines[dir[1]][0].slice(0,dir[2]-1)+lines[dir[1]][0].slice(dir[2]);
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
			}
			else{
				lines[dir[1]][0]=lines[dir[1]][0].slice(0,dir[2]-1)+lines[dir[1]][0].slice(dir[2]);
			}
		}
		dir[2]=dir[2]-1;
    }
    else if(dir[0]=='paste'){
        //for single line, no json
        if(dir[3][0]!='[' && dir[3][1]!='['){
            lines[dir[1]][0]=lines[dir[1]][0].slice(0, dir[2])+dir[3]+lines[dir[1]][0].slice(dir[2]);
        }
        //for json
        else{
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
            paint(false,false,true,false);
        }
        
    }
    else{
        lines[dir[1]][0] = lines[dir[1]][0].slice(0,dir[2]) + dir[0] +lines[dir[1]][0].slice(dir[2]);
        dir[2]=dir[2]+1;
    }
    pos.row=anch.row=dir[1]
    pos.col=anch.col=dir[2]
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


function topMenuOut(v){
    if(document.getElementById(v+'Menu').style.display=='none'){
        document.getElementById(v).style.backgroundColor='#A2BAE9';
        document.getElementById(v).style.color='black';
    }
}

//menu options and stuff
// closing the window
function closeScript(){
    self.close()
}

// duplicate
function duplicate(){
    $.post('/duplicate',
     {resource_id : resource_id, fromPage : 'editor'}, 
     function(d){
        if (d=='fail')return;
        else{window.open(d)}
     });
}

//exporting
function exportPrompt(){
    save(0);
    typeToScript=false;
    document.getElementById("exportpopup").style.visibility="visible"
}
function hideExportPrompt(){
    typeToScript=true;
    document.getElementById("exportpopup").style.visibility="hidden";
}
function exportScripts(){
    var b=window.location.href;
    var resource_id=b.split("=")[1];
    if (resource_id=='demo'){
        nope();
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
    }
}




	


//drawing functions
// like the scroll arrows
function scrollArrows(ctx){
    var height = document.getElementById('canvas').height;
    //up arrow
    ctx.fillStyle="#333";
    ctx.fillRect(editorWidth-22, height-39, 20,20);
    ctx.fillStyle='#ddd';
    ctx.fillRect(editorWidth-20, height-37, 16, 16);
    ctx.beginPath();
    ctx.moveTo(editorWidth-18, height-24);
    ctx.lineTo(editorWidth-12, height-35);
    ctx.lineTo(editorWidth-6, height-24);
    ctx.closePath();
    ctx.fillStyle="#333";
    ctx.fill();
    //down arrow
    ctx.fillStyle="#333";
    ctx.fillRect(editorWidth-22, height-19, 20,20);
    ctx.fillStyle='#ddd';
    ctx.fillRect(editorWidth-20, height-18, 16, 16);
    ctx.beginPath();
    ctx.moveTo(editorWidth-18, height-15);
    ctx.lineTo(editorWidth-12, height-4);
    ctx.lineTo(editorWidth-6, height-15);
    ctx.closePath();
    ctx.fillStyle="#333";
    ctx.fill();
}
function scrollBar(ctx, y){
    var height = document.getElementById('canvas').height;
    var pagesHeight = (pageBreaks.length+1)*72*lineheight;
    var barHeight = ((height)/pagesHeight)*(height-39);
    if (barHeight<20)barHeight=20;
    if (barHeight>=height-39)barHeight=height-39;
    var topPixel = (vOffset/(pagesHeight-height))*(height-39-barHeight);
    ctx.fillRect(editorWidth-22, topPixel, 20,barHeight);
}




function paint(e, anchE, forceCalc, forceScroll){
    if(typeToScript){
    var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');
	ctx.clearRect(0,0, 2000,2500);
	ctx.fillStyle = '#999';
	ctx.fillRect(0, 0, editorWidth, document.getElementById('canvas').height);
    ctx.fillStyle = foreground;
    
    
    //draw pages
    var pageStartX = 45;
    var pageStartY = lineheight;
    for(var i=0; i<=pageBreaks.length;i++){
        ctx.fillStyle = background;
        ctx.fillRect(pageStartX, pageStartY-vOffset, editorWidth*0.85, lineheight*70);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(pageStartX, pageStartY-vOffset, Math.round(editorWidth*0.85), lineheight*70);
        ctx.strokeStyle='#999';
        ctx.strokeRect(pageStartX-2, pageStartY-vOffset-2, Math.round(editorWidth*0.85)+4, lineheight*70+4);
        ctx.fillStyle=foreground;
        if(i>0)ctx.fillText(String(i+1)+'.', 645, pageStartY-vOffset+85);
        pageStartY+= lineheight*72;
    }
    
    // use this opportunity to put in the grey backing
    var greyHeight = lineheight*9+2;
    var wrapVars=WrapVariableArray[0];
    ctx.fillStyle='#ddd';
    if(!forceCalc){
        var count=0;
        for (var i=0;i<lines.length;i++){
            if(pageBreaks.length!=0 && pageBreaks[count][0]==i){
                greyHeight=72*lineheight*(count+1)+9*lineheight+2;
                if(pageBreaks[count][2]!=0){
                    greyHeight-=pageBreaks[count][2]*lineheight;
                    if(lines[i][1]==3)greyHeight+=lineheight;
                }
                count++;
                if(count==pageBreaks.length)count--;
            }
            if(i<linesNLB.length){
                for(var j=0; j<linesNLB[i].length; j++){
                    greyHeight+=lineheight;
                    if (lines[i][1]==0){
                       if(linesNLB[i][j]!=0)ctx.fillRect(wrapVars[1]-3,greyHeight-vOffset,61*fontWidth+6, 14);
                       if(lines[i][0]=='' && j==0)ctx.fillRect(wrapVars[1]-3,greyHeight-vOffset,61*fontWidth+6, 14);
                    }
                }
            }
        }
    }
    ctx.fillStyle=foreground;
    
    //Draw in range if there is one
    if(pos.row!=anch.row || anch.col!=pos.col){
        drawRange(ctx);
        if(!pasting)selection();
    }
    
    ctx.fillStyle=foreground;
    
    ctx.font=font;
	var y = lineheight*11;
    var cos=[];
    //Stary Cycling through lines
    var latestCharacter = '';
    var count = 0;
	for (var i=0; i<lines.length; i++){
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
                    if(count>=pageBreaks.length)count=pageBreaks.length-2;
                }
                else{
                    bb=true;
                }
            }
        }
        //Don't render things way outside the screen
        if(!forceCalc && !bb && (y-vOffset>1200||y-vOffset<-200)){
            y+=(lineheight*linesNLB[i].length);
            if(i==pos.row){
                cursorY=y;
                wrappedText=[];
            }
        }
        
        else{
            var type = lines[i][1];
            //Cursor position
            var anchOrFocus = (anchE ? anch.row : pos.row);
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
            if(e||anchE)var wrapCounterOnClick=[];
            linesNLB[i]=[];
            while(word<wordsArr.length){
                var itr=0;
                if (wordsArr.slice(word).join().length<wrapVars[0]){
                    var printString = wordsArr.slice(word).join(' ');
                    if(lines[i][1]==2 && latestCharacter!='' && lines[i][0].toUpperCase()==latestCharacter.toUpperCase())printString+=" (Cont'd)";
                    if(lines[i][1]==0)latestCharacter='';
                    if (wrapVars[3]==1)printString= printString.toUpperCase();
                    if (wrapVars[2]==1)ctx.textAlign='right';
                    if(printString!='')ctx.fillText(printString, wrapVars[1] , y-vOffset);
                    ctx.textAlign='left';
                    word=wordsArr.length;
                    linesNLB[i].push(printString.length);
                    y+=lineheight;
                    if(wrapVars[4]==2){
                        linesNLB[i].push(0);
                        y+=lineheight;
                    }
                    if(e||anchE)wrapCounterOnClick.push(printString.length);
                    if(thisRow)wrappedText.push(printString.length);
                    if(anchorThisRow)anchorWrappedText.push(printString.length);
                }
                else{
                    var itr=0;
                    while(wordsArr.slice(word, word+itr).join(' ').length<wrapVars[0]){
                        newLineToPrint=wordsArr.slice(word, word+itr).join(' ');
                        itr++;
                        if (wrapVars[3]==1)newLineToPrint= newLineToPrint.toUpperCase();
                    }
                    ctx.fillText(newLineToPrint, wrapVars[1], y-vOffset);
                    linesNLB[i].push(newLineToPrint.length);
                    y+=lineheight;
                    word+=itr-1;
                    itr =0;
                    if(e||anchE)wrapCounterOnClick.push(newLineToPrint.length);
                    if (thisRow)wrappedText.push(newLineToPrint.length);
                    if(anchorThisRow)anchorWrappedText.push(newLineToPrint.length);
                }
                //remve a line if it's dialog
                //followed by parenthetics
                if(lines[i][1]==3 && i+1!=lines.length && lines[i+1][1]==4 && linesNLB[i][linesNLB[i].length-1]==0){
                    linesNLB[i].pop();
                    y-=lineheight;
                }
                // changing cursor position
                // on click
                // Bad place to put it. See if can be done
                // better in mouseClick function
                if(e && e.clientY-headerHeight<y-vOffset-lineheight && e.clientY-headerHeight>y-vOffset-(linesNLB[i].length*lineheight)-lineheight){
                    pos.row=i;
                    pos.col=0;
                    var itr=0;
                    var lbMeasure = y-vOffset-(linesNLB[i].length*lineheight);
                    while(e.clientY-headerHeight>lbMeasure){
                        pos.col+=linesNLB[i][itr]+1;
                        lbMeasure+=lineheight;
                        itr++;
                    }
                    if(type!=5){
                        var remainder = Math.round(((e.clientX-wrapVars[1])/fontWidth));
                        if(remainder>linesNLB[i][itr])remainder = linesNLB[i][itr];
                        if(remainder<0)remainder=0;
                        pos.col+=remainder;
                    }
                    else{
                        var remainder = Math.round(((wrapVars[1]-e.clientX)/fontWidth));
                        if(remainder<0)remainder = 0;
                        pos.col-=remainder;
                        pos.col+=lines[i][0].length;
                    }
                    var onClickLengthLimit=0;
                    for(var integ=0; integ<wrapCounterOnClick.length; integ++){
                        onClickLengthLimit+=wrapCounterOnClick[integ]+1;
                    }
                    if(pos.col<0)pos.col=0;
                    if(pos.col>lines[pos.row][0].length)pos.col=lines[pos.row][0].length;
                    
                }
                // Now setting anchor position
                
                if(anchE && anchE.clientY-headerHeight<y-vOffset-lineheight && anchE.clientY-headerHeight>y-vOffset-(linesNLB[i].length*lineheight)-lineheight){
                    anch.row=i;
                    anch.col=0;
                    var itr=0;
                    var lbMeasure = y-vOffset-(linesNLB[i].length*lineheight);
                    while(anchE.clientY-headerHeight>lbMeasure){
                        anch.col+=linesNLB[i][itr]+1;
                        lbMeasure+=lineheight;
                        itr++;
                    }
                    if(type!=5){
                        var remainder = Math.round(((anchE.clientX-wrapVars[1])/fontWidth));
                        if(remainder>linesNLB[i][itr])remainder = linesNLB[i][itr];
                        if(remainder<0)remainder=0;
                        anch.col+=remainder;
                    }
                    else{
                        var remainder = Math.round(((wrapVars[1]-anchE.clientX)/fontWidth));
                        if(remainder<0)remainder = 0;
                        anch.col-=remainder;
                        anch.col+=lines[i][0].length;
                    }
                    var onClickLengthLimit=0;
                    for(var integ=0; integ<wrapCounterOnClick.length; integ++){
                        onClickLengthLimit+=wrapCounterOnClick[integ]+1;
                    }
                    if(anch.col<0)anch.col=0;
                    if(anch.col>lines[anch.row][0].length)anch.col=lines[anch.row][0].length;
                }
                if(bb && linesNLB[i].length==pageBreaks[count][2]){
                    if(lines[i][1]==3)ctx.fillText("(MORE)", WrapVariableArray[2][1], y-vOffset);
                    y=72*lineheight*(count+1)+11*lineheight;
                    if(lines[i][1]==3){
                        ctx.fillText(latestCharacter.toUpperCase()+" (CONT'D)", WrapVariableArray[2][1], y-vOffset);
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
    if(count>=pageBreaks.length)count=pageBreaks.length-2;
        
    }
      // End Looping through lines
	  // delete extra data in linesNLB
      while(lines.length<linesNLB.length){
        linesNLB.pop();
      }
	  
    //Start work on frame and buttons and stuff
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#999';
    ctx.beginPath();
    ctx.moveTo(2,2);
    ctx.lineTo(2,document.getElementById('canvas').height-1);
    ctx.lineTo(editorWidth, document.getElementById('canvas').height-1);
    ctx.lineTo(editorWidth,2);
    ctx.lineTo(2,2);
    ctx.stroke();
    ctx.fillStyle = '#6484df';
      //Make ScrollBar
      scrollArrows(ctx);
      scrollBar(ctx, y);
      if(anchE){
        pos.row=anch.row;
        pos.col=anch.col;
      }
      if(mouseDownBool && pos.row<anch.row && mouseY<40)scroll(-20);
      if(mouseDownBool && pos.row>anch.row && mouseY>document.getElementById('canvas').height-50)scroll(20);
      if(forceScroll){
        if((2+cursorY+(wrapCounter*lineheight)-vOffset)>document.getElementById('canvas').height-100)scroll(45);
        if((2+cursorY+(wrapCounter*lineheight)-vOffset)<45)scroll(-45);
      }
      if(forceCalc){
        pagination();
        paint(false,false,false,false);
      }
    }
}
