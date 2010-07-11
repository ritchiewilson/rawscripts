   var OSName="Unknown OS";
   if (navigator.appVersion.indexOf("Win")!=-1) OSName="Windows";
   if (navigator.appVersion.indexOf("Mac")!=-1) OSName="MacOS";
   if (navigator.appVersion.indexOf("X11")!=-1) OSName="UNIX";
   if (navigator.appVersion.indexOf("Linux")!=-1) OSName="Linux";
   var ud=0;
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
    $('#recipient').keyup(function(event){if(event.which==188)tokenize('recipient')});
    $('#renameField').keydown(function(e){if(e.which==13){e.preventDefault(); renameScript()}});
	$('#recipient').keydown(function(e){if(e.which==13){e.preventDefault();}});
	$('#subject').keydown(function(e){if(e.which==13){e.preventDefault();}});
    //stuff for filelike menu
    $('.menuItem').click(function(){openMenu(this.id)});
    $('.menuItem').mouseover(function(){topMenuOver(this.id)});
    $('.menuItem').mouseout(function(){topMenuOut(this.id)});
  });
  $(window).resize(function(){
    document.getElementById('canvas').height = $('#container').height()-65;
    document.getElementById('sidebar').style.height = ($('#container').height()-65)+'px';
    document.getElementById('sidebar').style.width = ($('#container').width()-855)+'px';
  });
  $('*').keydown(function(e){
  if (commandDownBool && e.which!=16){
        keyboardShortcut(e)
    }
   else{
      var d= new Date();
      milli = d.getMilliseconds();
      if(e.which==13)enter();
      else if(e.which==38)upArrow();
      else if(e.which==40)downArrow();
      else if(e.which==39)rightArrow();
      else if(e.which==37)leftArrow();
      else if(e.which==8)backspace(e);
      else if(e.which==46)deleteButton();
      else if(e.which==9){e.preventDefault(); tab();}
      else if(e.which==16)shiftDown=true;
      else if((OSName=='MacOS' && (e.which==91 || e.which==93)) || (OSName!='MacOS' && e.which==17))commandDownBool=true;
      //console.log(e.which);
    }
    if(typeToScript){
        document.getElementById('ccp').focus();
        document.getElementById('ccp').select();
    }
  });
  
  $('*').keyup(function(e){
  if(e.which==16)shiftDown=false;
  else if((OSName=='MacOS' && (e.which==91 || e.which==93)) || (OSName!='MacOS' && e.which==17))commandDownBool=false;
  if(typeToScript){
      document.getElementById('ccp').focus();
      document.getElementById('ccp').select();
  }
  });
  
  $('*').keypress(function(e){
    handlekeypress(e)
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

function createSuggestBox(d){
	if(document.getElementById('suggestBox')!=null)document.getElementById('suggestBox').parentNode.removeChild(document.getElementById('suggestBox'));
	if(d=='c'){
        v=characters;
        var left=WrapVariableArray[2][1]+'px';
    }
    else{
        v=scenes;
        for(i in v){
            v[i][0]=v[i][0].split(') ').splice(1).join(') ');
        }
        var left=WrapVariableArray[0][1]+'px';
    }
	var l=lines[pos.row][0].length;
	for (x in v){
		var part=lines[pos.row][0].toUpperCase();
		var s = v[x][0].substr(0,l).toUpperCase();
		if (part==s && part!=v[x][0]){
			//create box now if doens't exist
			if(document.getElementById('suggestBox')==null){
				var box = document.body.appendChild(document.createElement('div'));
				box.id='suggestBox';
				box.style.position='fixed';
				box.style.top=ud+70+lineheight+"px";
				box.style.left=left;
			}
            var found=false;
            if(d=='s'){
                var c = box.childNodes;
                for (i in c){
                    if(v[x][0]==c[i].value)found=true;
                }
            }
            if(!found){
                var item = box.appendChild(document.createElement('div'));
                item.className="suggestItem";
                item.appendChild(document.createTextNode(v[x][0]))
                item.value=v[x][0]
                document.getElementById('suggestBox').firstChild.id='focus';
            }
		}
	}
	$('.suggestItem').mouseover(function(){
		document.getElementById('focus').removeAttribute('id');
		this.id='focus';})
}

function keyboardShortcut(e){
    // don't do anything if cut, copy or paste
    if (e.which!=67 && e.which!=86 && e.which!=88){
        e.preventDefault();
        if(shiftDown && e.which==90)redo();
        else if (e.which==90)undo();
        else if (e.which==83)save();
        else if (e.which==82)window.location.href=window.location.href;
    }
}
function cut(){
    if(pos.row!=anch.row || pos.col!=anch.col)backspace();
}
function copy(){
}
function paste(){
    redoQue=[];
    if(pos.row!=anch.row || pos.col!=anch.col)backspace();
    var j=false;
    var data=document.getElementById('ccp').value;
    var r = new RegExp( "\\n", "g" );
    if (data.split(r).length>1) {
        var tmp=data.split(r);
        var tmpArr=[];
        for (x in tmp){
            if(tmp[x]!='' && tmp[x]!=null)tmpArr.push([tmp[x],1])
        }
        data=JSON.stringify(tmpArr);
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
        pos.col+=document.getElementById('ccp').value.length;
        anch.col=pos.col;
    }
    else{
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
    }
    pasting=false;
    sceneIndex();
    document.getElementById('canvas').height = $('#container').height()-65;
    document.getElementById('sidebar').style.height = ($('#container').height()-65)+'px';
    document.getElementById('sidebar').style.width = ($('#container').width()-855)+'px';
    paint(false,false,true,false);
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
    if(data=='not found'){
        lines = [["Sorry, the script wasn't found.",1]];
        paint(false,false,true,false);
        return;
    }
    var title=data.split('?title=')[0];
    document.getElementById('title').innerHTML=title;
    data=data.split('?title=')[1];
    if(data==''){
        lines = [["Fade In:",1],["Int. ",0]];
    }
    else{
        var x = JSON.parse(data);
        for(var i=0; i<x.length; i++){
            lines.push([x[i][0], x[i][1]]);
        }
    }
    if(lines.length==2){
        pos.row=1;
        anch.row=1
        pos.col=lines[1][0].length
        anch.col=pos.col;
    }
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    characterInit();
    sceneIndex();
	noteIndex();
    document.getElementById('ccp').focus();
    document.getElementById('ccp').select();
    paint(false,false,true,false);
    setInterval('paint(false,false, false,false)', 40);
    });
}
function changeFormat(v){
    undoQue.push(['format',pos.row,pos.col,lines[pos.row][1],v]);
    redoQue=[];
    lines[pos.row][1]=v;
    anch.col=pos.col;
    anch.row=pos.row;
    sceneIndex();
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
        if(id=='save')save();
        else if(id=='new')newScriptPrompt();
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
        else if(id=='insertNote')newThread();
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
        if(pos.row!=anch.row || pos.col!=anch.col)deleteButton();
        if (event.which!=13 && event.which!=37 && event.which!=0 && event.which!=8){
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
        }
        anch.col=pos.col;
        anch.row=pos.row;
        document.getElementById('ccp').focus();
        document.getElementById('ccp').select();
    }
}

// Managining arrays
// calcing data
function undo(){
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
            scenes.push([String(num)+') '+lines[i][0].toUpperCase(), i]);
        }
    }
    var c = document.getElementById('sceneBox');
    c.innerHTML="";
    
    for (var i=0; i<scenes.length; i++){
        var elem = c.appendChild(document.createElement('p'))
        elem.appendChild(document.createTextNode(scenes[i][0]));
        elem.className='sceneItem';
        elem.id="row"+scenes[i][1];
    }
    $('.sceneItem').click(function(){$(this).css("background-color", "#999ccc");jumpTo(this.id)});
    $(".sceneItem").mouseover(function(){$(this).css("background-color", "#ccccff");});
	$(".sceneItem").mouseout(function(){$(this).css("background-color", "white");});
    
}
function noteIndex(){
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
            infoDiv.appendChild(document.createTextNode("-"+notes[x][2][y][1]));
            infoDiv.align='right';
            infoDiv.className="msgInfo";
			msgDiv.className='msg';
		}
		var cont=newDiv.appendChild(document.createElement('div'));
		cont.className='respond';
		cont.appendChild(document.createTextNode('respond'));
		cont.id=notes[x][3];
	}
    typeToScript=true;
	$('.respond').click(function(){newMessage(this.id)});
}
function newThread(){
    return;
	id=Math.round(Math.random()*1000000000);
	var tmp=[pos.row, pos.col, [['new thread', 'ritchie', 'timestamp']],id];
	notes.push(tmp);
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
}

function submitMessage(v){
	for (x in notes){
		if (notes[x][3]==v){
			var n=x;
		}
	}
    var content = document.getElementById('nmi').innerHTML
	notes[n][2].push([content, 'other ritchie', 'timestamp']);
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
}

function createScript (){
	var filename = document.getElementById('newScript').value;
	if (filename!=''){
		$.post('/newscript', {filename:filename}, function(data){
            window.open('/editor?resource_id='+data);
        });
            
	}
	hideNewScriptPrompt();
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
// save
function save(){
    var data=JSON.stringify(lines);
    $.post('/save', {data : data, resource_id : resource_id}, function(d){
    });
}
//rename
function renamePrompt(){
    typeToScript=false;
    document.getElementById('renameTitle').innerHTML = "Rename: " + document.getElementById('title').innerHTML;
    document.getElementById('renameField').value = document.getElementById('title').innerHTML;
    document.getElementById('renamepopup').style.visibility = 'visible';
}

function hideRenamePrompt(){
	document.getElementById('renameField').value = "";
	document.getElementById('renamepopup').style.visibility = 'hidden';
    typeToScript=true;
}
	
function renameScript(){
	var rename = document.getElementById('renameField').value;
	if (rename==""){return;}
	document.getElementById('title').innerHTML = rename;
	$.post("/rename", {resource_id : resource_id, rename : rename, fromPage : 'scriptlist'});
	hideRenamePrompt()
}
//exporting
function exportPrompt(){
    save();
    document.getElementById("exportpopup").style.visibility="visible"
}
function hideExportPrompt(){
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
        var a=document.getElementsByTagName("input");
        for(var c=0;c<a.length;c++){
            if(a[c].checked==true){
                if(a[c].className=="exportList"){
                    d=a[c].name;
                    b="/export?resource_id="+resource_id+"&export_format="+d+"&fromPage=editor";
                    window.open(b)
                }
            }
        }
    }
}
// emailing
function emailPrompt(){
    save();
    typeToScript=false;
    document.getElementById("emailpopup").style.visibility='visible'
}
function hideEmailPrompt(){
    document.getElementById("emailpopup").style.visibility='hidden';
    document.getElementById('recipient').value='';
    document.getElementById('recipients').innerHTML='';
    document.getElementById('message').innerHTML='';
    typeToScript=true;
}

function emailComplete(e){
	document.getElementById('emailS').disabled = false;
	document.getElementById('emailS').value = 'Send';
	if (e=='sent'){
		alert("Email Sent")
		hideEmailPrompt();
	}
	else{
		alert("There was a problem sending your email. Please try again later.")
	}
}
function emailScript(){
	tokenize('recipient');
	var arr = new Array();
	var c = document.getElementsByTagName('span');
	for(var i=0;i<c.length; i++){
		if (c[i].className=='mailto'){
			arr.push(c[i].innerHTML);
			}
		}
	var recipients = arr.join(',');
	var subject = document.getElementById('subject').value;
	var body_message = document.getElementById('message').innerHTML;
	$.post("/emailscript", {resource_id : resource_id, recipients : recipients, subject :subject, body_message:body_message, fromPage : 'editor'}, function(e){emailComplete(e)});
	document.getElementById('emailS').disabled = true;
	document.getElementById('emailS').value = 'Sending...';
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
function drawRange(ctx){
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
        if(pageBreaks.length!=0 && pageBreaks[count][0]==i){
            startHeight=72*lineheight*(count+1)+9*lineheight+4;
            startHeight-=(pageBreaks[count][2])*lineheight;
            if(lines[i][1]==3)startHeight+=lineheight;
            count++;
            if(count==pageBreaks.length)count--;
        }
        startHeight+=lineheight*linesNLB[i].length;
    }
    var i=0;
    var startRangeCol=linesNLB[startRange.row][i]+1;
    while(startRange.col>startRangeCol){
        startHeight+=lineheight;
        if(pageBreaks.length!=0 && pageBreaks[count][0]==startRange.row && pageBreaks[count][2]==i+1){
            startHeight=72*lineheight*(count+1)+9*lineheight+4;
            if(lines[startRange.row][1]==3)startHeight+=lineheight;
        }
        else if(pageBreaks.length!=0 && pageBreaks[count][0]-1==startRange.row && pageBreaks[count][2]==i){
            startHeight=72*lineheight*(count+1)+9*lineheight+4;
            if(lines[startRange.row][1]==3)startHeight+=lineheight;
        }
        i++;
        startRangeCol+=linesNLB[startRange.row][i]+1;
    }
    startRangeCol-=linesNLB[startRange.row][i]+1;
    var startWidth = WrapVariableArray[lines[startRange.row][1]][1];
    startWidth+=((startRange.col-startRangeCol)*fontWidth);
    startHeight+=lineheight;

    //getting the ending position

    var endHeight = lineheight*9+3;
    count=0;
    for (var j=0; j<endRange.row;j++){
        if(pageBreaks.length!=0 && pageBreaks[count][0]==j){
            endHeight=72*lineheight*(count+1)+9*lineheight+4;
            endHeight-=(pageBreaks[count][2])*lineheight;
            if(lines[j][1]==3)endHeight+=lineheight;
            count++;
            if(count==pageBreaks.length)count--;
        }
        endHeight+=lineheight*linesNLB[j].length;
    }
    var j=0;
    var endRangeCol=linesNLB[endRange.row][j]+1;
    while(endRange.col>endRangeCol){
        endHeight+=lineheight;
        if(pageBreaks.length!=0 && pageBreaks[count][0]==endRange.row && pageBreaks[count][2]==j+1){
            endHeight=72*lineheight*(count+1)+9*lineheight+4;
            if(lines[endRange.row][1]==3)endHeight+=lineheight;
        }
        else if(pageBreaks.length!=0 && pageBreaks[count][0]-1==endRange.row && pageBreaks[count][2]==i){
            endHeight=72*lineheight*(count+1)+9*lineheight+4;
            if(lines[endRange.row][1]==3)endHeight+=lineheight;
        }
        j++;
        endRangeCol+=linesNLB[endRange.row][j]+1;
    }
    endRangeCol-=linesNLB[endRange.row][j]+1;
    var endWidth = WrapVariableArray[lines[endRange.row][1]][1];
    endWidth+=((endRange.col-endRangeCol)*fontWidth);
    endHeight+=lineheight;
    
    // Now compare stuff and draw blue Box
    ctx.fillStyle='lightBlue';
    if(endHeight==startHeight){
        var onlyBlueLine = startWidth;
        if (lines[startRange.row][1]==5)onlyBlueLine-=(lines[startRange.row][0].length*fontWidth);
        ctx.fillRect(onlyBlueLine, startHeight-vOffset,endWidth-startWidth, 12);
    }
    else{
        var firstLineBlue = startWidth;
         if (lines[startRange.row][1]==5)firstLineBlue-=(lines[startRange.row][0].length*fontWidth);
        ctx.fillRect(firstLineBlue,startHeight-vOffset, (startRangeCol+linesNLB[startRange.row][i]-startRange.col)*fontWidth, 12);
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
            var blueStart = WrapVariableArray[lines[startRange.row][1]][1];
            if (lines[startRange.row][1]==5)blueStart-=(lines[startRange.row][0].length*fontWidth);
            ctx.fillRect(blueStart, startHeight-vOffset, linesNLB[startRange.row][i]*fontWidth, 12);
            
        }
        //ctx.fillStyle="blue";
        var lastBlueLine=WrapVariableArray[lines[endRange.row][1]][1]; 
        if (lines[endRange.row][1]==5)lastBlueLine-=(lines[endRange.row][0].length*fontWidth);
        ctx.fillRect(lastBlueLine, endHeight-vOffset, (endRange.col-endRangeCol)*fontWidth,12);
    }
}

function drawNotes(ctx){
    for (x in notes){
        var startHeight = lineheight*9+3;
        var count=0;
        for (var i=0; i<notes[x][0];i++){
            if(pageBreaks.length!=0 && pageBreaks[count][0]==i){
                startHeight=72*lineheight*(count+1)+9*lineheight+4;
                startHeight-=(pageBreaks[count][2])*lineheight;
                if(lines[i][1]==3)startHeight+=lineheight;
                count++;
                if(count==pageBreaks.length)count--;
            }
            startHeight+=lineheight*linesNLB[i].length;
        }
        var i=0;
        var startRangeCol=linesNLB[notes[x][0]][i]+1;
        while(notes[x][1]>startRangeCol){
            startHeight+=lineheight;
            if(pageBreaks.length!=0 && pageBreaks[count][0]==notes[x][0] && pageBreaks[count][2]==i+1){
                startHeight=72*lineheight*(count+1)+9*lineheight+4;
                if(lines[notes[x][0]][1]==3)startHeight+=lineheight;
            }
            else if(pageBreaks.length!=0 && pageBreaks[count][0]-1==notes[x][0] && pageBreaks[count][2]==i){
                startHeight=72*lineheight*(count+1)+9*lineheight+4;
                if(lines[notes[x][0]][1]==3)startHeight+=lineheight;
            }
            i++;
            startRangeCol+=linesNLB[notes[x][0]][i]+1;
        }
        startRangeCol-=linesNLB[notes[x][0]][i]+1;
        var startWidth = WrapVariableArray[lines[notes[x][0]][1]][1];
        startWidth+=((notes[x][1]-startRangeCol)*fontWidth);
        startWidth-=(fontWidth/2);
        startHeight+=lineheight;
        ctx.moveTo(startWidth,startHeight-vOffset);
        ctx.fillStyle='red';
        ctx.fillRect(startWidth,startHeight-vOffset,5,5);
        ctx.strokeStyle='black';
        ctx.stroke();
    }
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
            if(pageBreaks.length!=0 && pageBreaks[count][0]==i){
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
                        ctx.fillText(latestCharacter.toUpperCase()+"(CONT'D)", WrapVariableArray[2][1], y-vOffset);
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
	  if(cursor&&wrappedText){
          var wrapCounter=0;
          var lrPosDiff = pos.col;
          var totalCharacters=wrappedText[wrapCounter];
          while (pos.col>totalCharacters){
                wrapCounter++;
                totalCharacters+=1+wrappedText[wrapCounter];
          }
          if(cos.length>0 && wrapCounter>=pageBreaks[cos[0]-1][2]){
                cursorY=72*cos[0]*lineheight+7*lineheight;
                if(pageBreaks[cos[0]-1][1]!=56 && lines[pos.row][1]==3)cursorY+=lineheight*2;
                else if(lines[pos.row][1]==3)cursorY+=lineheight;
                else if(pageBreaks[cos[0]-1][1]!=56 && lines[pos.row][1]==1)cursorY+=lineheight;
          }
          totalCharacters-=wrappedText[wrapCounter];
		  var lr = cursorX+((pos.col-totalCharacters)*fontWidth);
          if(lines[pos.row][1]==5)lr -= lines[pos.row][0].length*fontWidth;
		  ud = 2+cursorY+(wrapCounter*lineheight)-vOffset;
          try{
            ctx.fillRect(lr,ud,2,17);
          }
          catch(err){console.log(lines[pos.row][0]);}
	  }
      
      //Draw Notes if any
    if(notes.length!=0 && !forceCalc){
        drawNotes(ctx);
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
        if((2+cursorY+(wrapCounter*lineheight)-vOffset)>document.getElementById('canvas').height-50)scroll(45);
        if((2+cursorY+(wrapCounter*lineheight)-vOffset)<45)scroll(-45);
      }
      if(forceCalc)pagination();
      document.getElementById('format').selectedIndex=lines[pos.row][1];
    }
}
