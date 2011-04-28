/**
 * Simple thing for cut
 */
function cut(){
	if(EOV=='viewer')return;
	if(!typeToScript)return;
	if(pos.row!=anch.row || pos.col!=anch.col)backspace();
	saveTimer();
}

/**
 * Simple thing for copy. Need not do anything anymore
 */
function copy(){
	if(EOV=='viewer')return;
	if(!typeToScript)return;
}

/**
 * Complicated thing to paste text
 * to canvas. Called just after the browser paste
 */
function paste(){
	if(EOV=='viewer')return;
	if(!typeToScript)return;
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
	wrapAll();
	pagination();
	fillInfoBar();
	lineFormatGuiUpdate();
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
