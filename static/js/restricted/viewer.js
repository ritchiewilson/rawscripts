   var OSName="Unknown OS";
   if (navigator.appVersion.indexOf("Win")!=-1) OSName="Windows";
   if (navigator.appVersion.indexOf("Mac")!=-1) OSName="MacOS";
   if (navigator.appVersion.indexOf("X11")!=-1) OSName="UNIX";
   if (navigator.appVersion.indexOf("Linux")!=-1) OSName="Linux";
   if($.browser.webkit)var browser='webkit';
   if($.browser.mozilla)var browser='mozilla';
   if($.browser.opera)var browser='opera';
   var ud=0;
   var viewNotes=true;
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
    var headerHeight=65;
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
    
    
	$(document).ready(function(){
	    document.getElementById('canvas').height = $('#container').height()-60;
		document.getElementById('canvas').width = $('#container').width()-320;
		editorWidth=$('#container').width()-323;
	    document.getElementById('sidebar').style.height = ($('#container').height()-65)+'px';
	    //document.getElementById('sidebar').style.width = ($('#container').width()-853)+'px';
	    $('#container').mousewheel(function(e, d){if(e.target.id=='canvas'){e.preventDefault();scroll(-d*25);}});
	    $('#recipient').keyup(function(event){if(event.which==188)tokenize('recipient')});
		$('#recipient').keydown(function(e){if(e.which==13){e.preventDefault();}});
		$('#subject').keydown(function(e){if(e.which==13){e.preventDefault();}});
	    //stuff for filelike menu
	    $('.menuItem').click(function(){openMenu(this.id)});
	    $('.menuItem').mouseover(function(){topMenuOver(this.id)});
	    $('.menuItem').mouseout(function(){topMenuOut(this.id)});
	  });
	  $(window).resize(function(){
	    document.getElementById('canvas').height = $('#container').height()-60;
		document.getElementById('canvas').width = $('#container').width()-320;
		editorWidth=$('#container').width()-323;
	    document.getElementById('sidebar').style.height = ($('#container').height()-65)+'px';
	    //document.getElementById('sidebar').style.width = ($('#container').width()-853)+'px';
		paint(false,false,false,false)
	  });
  $('*').keydown(function(e){
  var d= new Date();
  milli = d.getMilliseconds();
  if(e.which==38)upArrow();
  else if(e.which==40)downArrow();
  else if(e.which==39)rightArrow();
  else if(e.which==37)leftArrow();
  else if(e.which==16)shiftDown=true;
  else if((OSName=='MacOS' && (e.which==91 || e.which==93) && browser=='webkit') || (OSName=='MacOS' && e.which==224 && browser=='mozilla') || (OSName=='MacOS' && e.which==17 && browser=='opera') || (OSName!='MacOS' && e.which==17))commandDownBool=true;

  if((ud<0 || ud>document.getElementById('canvas').height-80) && typeToScript && e.which!=13 && e.which!=46 && e.which!=8){
    scroll(ud-400);
  }
    if(typeToScript){
		if (anch.row==pos.row && pos.col==anch.col)document.getElementById("ccp").value="";
        document.getElementById('ccp').focus();
        document.getElementById('ccp').select();
    }
  });
  
  $('*').keyup(function(e){
  //console.log(ud);
  if(e.which==16)shiftDown=false;
  if(typeToScript){
      document.getElementById('ccp').focus();
      document.getElementById('ccp').select();
  }
  });
  
  
  $('*').mousedown(function(e){
    if(typeToScript){
        mouseDown(e);
        document.getElementById('ccp').focus();
        document.getElementById('ccp').select();
    }
  });
  $('*').mouseup(function(e){
    if(typeToScript){
        mouseUp(e);
        document.getElementById('ccp').focus();
        document.getElementById('ccp').select();
    }
  });
  $('*').mousemove(function(e){
    mouseMove(e);
  });
    
	
// Character and Scene Suggest
//Build it in the dom. Easier. Stick actual data in value, not in innerhtml




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
        startRange.row+=1;
        while(startRange.row<endRange.row){
            arr.push([lines[startRange.row][0],lines[startRange.row][1]]);
            startRange.row+=1;
        }
        arr.push([lines[endRange.row][0].slice(0,endRange.col),lines[endRange.row][1]]);
        var sel=JSON.stringify(arr);
    }
    var c = document.getElementById('ccp');
    c.value=sel;
    c.focus();
    c.select();
}

function setup(){
    resource_id=window.location.href.split('=')[1];
    $.post('/scriptcontent', {resource_id:resource_id}, function(data){
    //console.log(data);
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
    //setupnotes
    for(i in p[3]){
        notes.push(p[3][i]);
    }
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    document.getElementById('edit_title_href').href='/titlepage?resource_id='+resource_id;
    tabs(0);
    sceneIndex();
	noteIndex();
    document.getElementById('ccp').focus();
    document.getElementById('ccp').select();
    paint(false,false,true,false);
    setInterval('paint(false,false, false,false)', 40);
    });
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
    var menu = false;
    var c = document.getElementsByTagName('div');
    for(var i=0;i<c.length;i++){
        if(c[i].className=='topMenu' && c[i].style.display=='block'){
            menu=true;
            var a=c[i];
        }
    }
    if(menu){
        var command = e.target;
        while(command.nodeName!='DIV'){
            command=command.parentNode
        }
        id=command.id;
        var f = id.slice(0,-1);
        if (f=='format'){
            changeFormat(id.slice(-1));

        }
        //FILE
        if(id=='save')save(0);
        else if(id=='new')newScriptPrompt();
        else if(id=='open')openPrompt();
        else if(id=='rename')renamePrompt();
        else if(id=='exportas')exportPrompt();
        else if(id=='duplicate')duplicate();
        else if(id=='close')closeScript();
        //Edit
        else if(id=='undo')undo();
        else if(id=='redo')redo();
        else if(id=='cut')var t=setTimeout("cut()",50);
        else if(id=='copy')copy();
        else if(id=='paste'){
            pasting=true;
            var t=setTimeout("paste()",50);
        }
        else if(id=='insertNote'){
            viewNotes=true;
            newThread();
        }
        else if(id=='editTitlePage')window.open('/titlepage?resource_id='+resource_id);
        //View
        else if(id=='revision')window.open('/revisionhistory?resource_id='+resource_id);
        else if(id=='notes'){
            viewNotes = (viewNotes ? false : true);
        }
        //Share
        else if(id=='email')emailPrompt();
        a.style.display='none';
    }
	else if(document.getElementById('suggestBox')!=null){
		if (e.target.className=='suggestItem'){
			lines[pos.row][0]=e.target.value;
			pos.col=anch.col=lines[pos.row][0].length;
		}
		document.getElementById('suggestBox').parentNode.removeChild(document.getElementById('suggestBox'));
	}
    else{
        var height = document.getElementById('canvas').height;
        var pagesHeight = (pageBreaks.length+1)*72*lineheight;
        var barHeight = ((height)/pagesHeight)*(height-39);
        if (barHeight<20)barHeight=20;
        if (barHeight>=height-39)barHeight=height-39;
        var topPixel = (vOffset/(pagesHeight-height))*(height-39-barHeight)+headerHeight;
        
        if(e.clientX>headerHeight && e.clientX<editorWidth-100 && e.clientY-headerHeight>40){
            mouseDownBool=true;
            paint(false, e, false,false);
        }
        else if(e.clientX<editorWidth && e.clientX>editorWidth-20 && e.clientY>topPixel && e.clientY<topPixel+barHeight){
            scrollBarBool=true;
        }
    }
}
function mouseMove(e){
    if(scrollBarBool)scrollBarDrag(e);
    mouseX=e.clientX;
    mouseY=e.clientY;
    if(mouseDownBool) paint(e, false, false,true);
}
function scrollBarDrag(e){
    var diff = mouseY-e.clientY;
    var height = document.getElementById('canvas').height-50;
    var pagesHeight = (pageBreaks.length+1)*72*lineheight;
    vOffset-=pagesHeight/height*diff;
    if (vOffset<0)vOffset=0;
    var pagesHeight = (pageBreaks.length+1)*72*lineheight-document.getElementById('canvas').height+20;
    if(vOffset>pagesHeight)vOffset=pagesHeight+20;
}
function scroll(v){
    vOffset+=v;
    if (vOffset<0)vOffset=0;
    var pagesHeight = (pageBreaks.length+1)*72*lineheight-document.getElementById('canvas').height+20;
    if(vOffset>pagesHeight)vOffset=pagesHeight+20;
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
            if(pos.row==0 && integ==0){
				pos.col=anch.col=0;
				return;
			}
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
		if(ud<0)paint(false,false,false,false);
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
        if(ud>document.getElementById('canvas').height-50)paint(false,false,false,false);
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
	$('.sceneItem').unbind();
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
    var c = document.getElementById('sceneBox').childNodes;
    for (var i=0;i<c.length;i++){
		if(c[i]!=undefined)c[i].parentNode.removeChild(c[i]);
		i--;
	}
    
    for (var i=0; i<scenes.length; i++){
        var elem = document.getElementById('sceneBox').appendChild(document.createElement('p'))
        elem.appendChild(document.createTextNode(scenes[i][0]));
        elem.className='sceneItem';
        elem.id="row"+scenes[i][1];
		elem.title=scenes[i][2];
		elem=null;
    }
	c=i=num=null;
    $('.sceneItem').click(function(){$(this).css("background-color", "#999ccc");jumpTo(this.id)});
    $(".sceneItem").mouseover(function(){$(this).css("background-color", "#ccccff");});
	$(".sceneItem").mouseout(function(){$(this).css("background-color", "white");});
    
}
//notes
function sortNotes(a,b){
    if (a[0]<b[0]) return -1;
    if (a[0]>b[0]) return 1;
    if (a[1]<b[1]) return -1;
    if (a[1]>b[1]) return 1;
    return 0;
}

function noteIndex(){
    notes.sort(sortNotes);
	var c = document.getElementById('noteBox');
	c.innerHTML="";
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
		}
		var cont=newDiv.appendChild(document.createElement('div'));
		cont.className='respond';
		cont.appendChild(document.createTextNode('Respond'));
		cont.id=notes[x][3];
	}
    typeToScript=true;
	$('.respond').click(function(){newMessage(this.id)});
    $('.msg').click(function(){
        for (i in notes){
            if (String(notes[i][3])==String(this.id.replace("msg",""))){
                pos.row=anch.row=notes[i][0];
                pos.col=anch.col=notes[i][1];
            }
        }
        paint(false, false, false, false);
        if(ud>document.getElementById('canvas').height)scroll(ud-document.getElementById('canvas').height+200);
        if(ud<0)scroll(ud-200);
    });
}
function newThread(){
    tabs(1);
	viewNotes=true;
	document.getElementById("notesViewHide").innerHTML = "✓";
	paint(false,false,false,false);
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
    sb.id='noteSave';
    var cb = n.appendChild(document.createElement('input'));
    cb.type='button';
    cb.value='Cancel';
    cb.id="noteCancel"
    $('#noteSave').click(function(){submitNewThread(id)});
    $('#noteCancel').click(function(){noteIndex()});
    i.focus();
}
function submitNewThread(v){
    var content = document.getElementById('nmi').innerHTML
    var u =document.getElementById('user_email').innerHTML;
    var d = new Date();
    if (content!=""){
        var arr = [pos.row, pos.col, [[content,u,d]], v];
        notes.push(arr);
        var data = [pos.row, pos.col, content, v]
        $.post("/notesnewthread", {resource_id:resource_id, row:pos.row, col:pos.col, content: content, thread_id:v, fromPage:'viewer'}, function(d){if(d!='sent')alert("Sorry, there was a problem sending that message. Please try again later.")})
    }
    noteIndex();
}
function newMessage(v){
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
    sb.id='noteSave';
    var cb = n.appendChild(document.createElement('input'));
    cb.type='button';
    cb.value='Cancel';
    cb.id="noteCancel"
    c.parentNode.removeChild(c);
    $('#noteSave').click(function(){submitMessage(v)});
    $('#noteCancel').click(function(){noteIndex()});
    i.focus();
}

function submitMessage(v){
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
        $.post("/notessubmitmessage", {resource_id:resource_id, content : content, thread_id : v, fromPage:'viewer'}, function(d){if(d!='sent')alert("Sorry, there was a problem sending that message. Please try again later.")})
    }
	noteIndex();
}

//Menu
// function to hand the file like menu

function openMenu(v){
    document.getElementById(v).style.backgroundColor='#6484df';
    document.getElementById(v).style.color='white';
    document.getElementById(v+'Menu').style.display='block';
    var c = document.getElementsByTagName('td');
    for(var i=0; i<c.length; i++){
        if(c[i].className=='formatTD'){
            if(c[i].id=='check'+lines[pos.row][1]){
                c[i].innerHTML='';
                c[i].appendChild(document.createTextNode('✓'));
            }
            else{
                c[i].innerHTML='';
            }
        }
    }
}
function topMenuOver(v){
    var open=false;
    var c = document.getElementsByTagName('div');
    for(var i=0; i<c.length; i++){
        if(c[i].className=='menuItem'){
            c[i].style.backgroundColor='#A2BAE9';
            c[i].style.color='black';
        }
        if(c[i].className=='topMenu'){
            if(c[i].style.display=='block'){
                c[i].style.display='none';
                open=true;
            }
        }
    }
    if(open){
        document.getElementById(v+'Menu').style.display='block';
    }
    document.getElementById(v).style.backgroundColor='#6484df';
    document.getElementById(v).style.color='white';
    var c = document.getElementsByTagName('td');
    for(var i=0; i<c.length; i++){
        if(c[i].className=='formatTD'){
            if(c[i].id=='check'+lines[pos.row][1]){
                c[i].innerHTML='';
                c[i].appendChild(document.createTextNode('✓'));
            }
            else{
                c[i].innerHTML='';
            }
        }
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
    var data=JSON.stringify(lines);
    $.post('/save', {data : data, resource_id : resource_id}, function(d){self.close()});
}
// new script
function newScriptPrompt(){
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
		$.post('/newscript', {filename:filename, fromPage:"viewer"}, function(data){
            window.open('editor?resource_id='+data);
			hideNewScriptPrompt();
        });
	}
}


//exporting
function exportPrompt(){
    if(document.getElementById('saveButton').value=="Save")save(0);
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
            }
            
        }
        //ctx.fillStyle="blue";
        var lastBlueLine=WrapVariableArray[lines[endRange.row][1]][1]; 
        if (lines[endRange.row][1]==5)lastBlueLine-=(lines[endRange.row][0].length*fontWidth);
        ctx.fillRect(lastBlueLine+pageStartX, endHeight-vOffset, (endRange.col-endRangeCol)*fontWidth,12);
    }
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

function paint(e, anchE, forceCalc, forceScroll){
    if(typeToScript){
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
    for(var i=0; i<=pageBreaks.length;i++){
        ctx.fillStyle = background;
        ctx.fillRect(pageStartX, pageStartY-vOffset, fontWidth*87, lineheight*70);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(pageStartX, pageStartY-vOffset, Math.round(fontWidth*87), lineheight*70);
        ctx.strokeStyle='#999';
        ctx.strokeRect(pageStartX-2, pageStartY-vOffset-2, Math.round(fontWidth*87)+4, lineheight*70+4);
        ctx.fillStyle=foreground;
        if(i>0)ctx.fillText(String(i+1)+'.', 550+pageStartX, pageStartY-vOffset+85);
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
                       if(linesNLB[i][j]!=0)ctx.fillRect(wrapVars[1]-3+pageStartX,greyHeight-vOffset,61*fontWidth+6, 14);
                       if(lines[i][0]=='' && j==0)ctx.fillRect(wrapVars[1]-3+pageStartX,greyHeight-vOffset,61*fontWidth+6, 14);
                    }
                }
            }
        }
    }
    ctx.fillStyle=foreground;
    
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
    var currentPage=false;
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
                        if(!currentPage)currentPage=count+1;
                        count=pageBreaks.length-2;
                    }
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
                var cursorY=y;
                wrappedText=[];
            }
        }
        
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
            // tc = total characters, used
            // mainly to put in notes
            var tc = 0;
            var anchEFound=false;
            var eFound=false;
            while(word<wordsArr.length){
                var itr=0;
                if (wordsArr.slice(word).join().length<wrapVars[0]){
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
                if(e && !eFound && e.clientY-headerHeight<y-vOffset-lineheight && e.clientY-headerHeight>y-vOffset-(linesNLB[i].length*lineheight)-lineheight){
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
                        var remainder = Math.round(((e.clientX-wrapVars[1]-pageStartX)/fontWidth));
                        if(remainder>linesNLB[i][itr])remainder = linesNLB[i][itr];
                        if(remainder<0)remainder=0;
                        pos.col+=remainder;
                    }
                    else{
                        var remainder = Math.round(((wrapVars[1]-e.clientX-pageStartX)/fontWidth));
                        if(remainder<0)remainder = 0;
                        pos.col-=remainder;
                        pos.col+=lines[i][0].length;
                    }
                    if(viewNotes){
                        for (note in notesInThisLine){
                            if (notesInThisLine[note]<pos.col)pos.col--;
                        }
                    }
                    var onClickLengthLimit=0;
                    for(var integ=0; integ<wrapCounterOnClick.length; integ++){
                        onClickLengthLimit+=wrapCounterOnClick[integ]+1;
                    }
                    if(pos.col<0)pos.col=0;
                    if(pos.col>lines[pos.row][0].length)pos.col=lines[pos.row][0].length;
                    eFound=true;
                    
                }
                // Now setting anchor position
                
                if(anchE && !anchEFound && anchE.clientY-headerHeight<y-vOffset-lineheight && anchE.clientY-headerHeight>y-vOffset-(linesNLB[i].length*lineheight)-lineheight){
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
                        var remainder = Math.round(((anchE.clientX-wrapVars[1]-pageStartX)/fontWidth));
                        if(remainder>linesNLB[i][itr])remainder = linesNLB[i][itr];
                        if(remainder<0)remainder=0;
                        anch.col+=remainder;
                    }
                    else{
                        var remainder = Math.round(((wrapVars[1]-anchE.clientX-pageStartX)/fontWidth));
                        if(remainder<0)remainder = 0;
                        anch.col-=remainder;
                        anch.col+=lines[i][0].length;
                    }
                    if(viewNotes){
                        for (note in notesInThisLine){
                            if (notesInThisLine[note]<anch.col)anch.col--;
                        }
                    }
                    var onClickLengthLimit=0;
                    for(var integ=0; integ<wrapCounterOnClick.length; integ++){
                        onClickLengthLimit+=wrapCounterOnClick[integ]+1;
                    }
                    if(anch.col<0)anch.col=0;
                    if(anch.col>lines[anch.row][0].length)anch.col=lines[anch.row][0].length;
                    anchEFound=true;
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
        if(i==pos.row && currentPage==false) currentPage=count+1;
        if(i==pos.row){
            var currentScene=sceneCount;
            var notesOnThisLine=notesArr; 
        }
        if(count>=pageBreaks.length){
            if (currentPage==false)currentPage=count+1;
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
            console.log();
            if(n<pos.col && n>totalCharacters && n<totalCharacters+wrappedText[wrapCounter]){
                notesSpacingDiff++;
            }
        }
        //console.log(notesSpacingDiff);
        if(cos.length>0 && wrapCounter>=pageBreaks[cos[0]-1][2]){
            currentPage+=1;
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
            catch(err){console.log(lines[pos.row][0]);}
        }
    }
      
    
    //Start work on frame and buttons and stuff
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(2,2);
    ctx.lineTo(2,document.getElementById('canvas').height-1);
    ctx.lineTo(editorWidth, document.getElementById('canvas').height-1);
    ctx.lineTo(editorWidth,2);
    ctx.lineTo(2,2);
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
    ctx.fillText(txt, 50, document.getElementById('canvas').height-8);
    ctx.font = font;
    //Make ScrollBar
    scrollArrows(ctx);
    scrollBar(ctx, y);
    if(anchE){
        pos.row=anch.row;
        pos.col=anch.col;
    }
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
}
