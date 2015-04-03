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
 * Simple thing for cut
 */
function cut(){
    forceRepaint = true;
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
    forceRepaint = true;
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
				var nl={}; //new line to add
				nl.text=tmp[x];
				nl.format=1;
	            if(tmp[x]!='' && tmp[x]!=null)tmpArr.push(nl)
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
	    if(data[0]=='[' && data[1]=='{')j=true;
	    if(!j){
	        lines[pos.row].text=lines[pos.row].text.slice(0,pos.col)+ data + lines[pos.row].text.slice(pos.col);
	        pos.col+=goog.dom.getElement('ccp').value.length;
	        anch.col=pos.col;
	    }
	    else{
			forceCalc = true;
	        var arr=JSON.parse(data);
	        if (lines[pos.row].text==''){
	            lines[pos.row].format=arr[0].format;
	        }
	        if (lines[pos.row].format==arr[0].format){
	            undoQue[undoQue.length-1].push(1);
	            var tmp={};
				tmp.text=lines[pos.row].text.slice(pos.col);
				tmp.format=lines[pos.row].format;
	            lines[pos.row].text=lines[pos.row].text.slice(0,pos.col)+arr[0].text;
	            var i=1;
	            var p=pos.row+1;
	            while(i<arr.length){
					var nl={}; //new line to insert
					nl.text=arr[i].text;
					nl.format=arr[i].format;
	                lines.splice(p,0,nl);
	                p++;
	                i++;
	            }
	            lines.splice(p,0,tmp);
	            if(lines[p].text=='' || lines[p].text==' '){
	                lines.splice(p,1);
	                undoQue[undoQue.length-1].push(0);
	            }
	            else{undoQue[undoQue.length-1].push(1)}
	        }
	        else{
	            undoQue[undoQue.length-1].push(0);
	            var tmp={};
				tmp.text=lines[pos.row].text.slice(pos.col);
				tmp.format=lines[pos.row].format;
	            lines[pos.row].text=lines[pos.row].text.slice(0,pos.col);
	            pos.row++;
				var nl={}; //new line to insert
				nl.text=arr[0].text;
				nl.format=arr[0].format;
	            lines.splice(pos.row,0,nl);
	            var i=1;
	            var p=pos.row+1;
	            while(i<arr.length){
					var nl={}; //new line to insert
					nl.text=arr[i].text;
					nl.format=arr[i].format;
	                lines.splice(p,0,nl);
	                p++;
	                i++;
	            }
	            lines.splice(p,0,tmp);
	            if(lines[p].text=='' || lines[p].text==' '){
	                lines.splice(p,1);
	                undoQue[undoQue.length-1].push(0);
	            }
	            else{undoQue[undoQue.length-1].push(1)}
	        }
	        pos.row=anch.row=p;
	        pos.col=anch.col=0;
	        if(pos.row>=lines.length){
	            pos.row=anch.row=lines.length-1
	            pos.col=anch.col=lines[pos.row].text.length;
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
