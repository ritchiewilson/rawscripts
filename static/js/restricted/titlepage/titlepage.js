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


var arr = goog.dom.getElementsByClass('checkbox')
for (i in arr){
	if(arr[i].type=='checkbox')goog.events.listen(arr[i], goog.events.EventType.CLICK, update)
}
var arr = goog.dom.getElementsByClass('textbox')
for (i in arr){
	if(arr[i].nodeName=='INPUT' || arr[i].nodeName=='TEXTAREA')goog.events.listen(arr[i], goog.events.EventType.KEYUP, update)
}

window['closeTitlePage']=closeTitlePage;
window['save']=save;
window['update']=update;

function closeTitlePage(){
    window.close()
}
function save(){
    var resource_id=window.location.href.split('=')[1];
    if (resource_id=='Demo'){
        alert("Sorry, but you'll have to login to use these functions!");
        return;
    }
    var i =[];
    var c = document.getElementsByTagName('input');
    for(x in c){
        if(c[x].type=='text')i.push(c[x].value)
        else if(c[x].type=='checkbox'){
            if(c[x].checked==true)i.push('checked');
            else{i.push('')}
        }
    }
    c = document.getElementsByTagName('textarea');
    for(x in c){
        if(c[x].value!=undefined){
            var data = c[x].value;
            var re = new RegExp( "\\n", "g" );
            data=data.replace(re,'LINEBREAK');
            i.push(data);
        }
    }
	var postData = 'title='+encodeURIComponent(i[0]);
	postData+='&authorOne='+encodeURIComponent(i[1]);
	postData+='&authorTwo='+encodeURIComponent(i[2]);
	postData+='&authorTwoChecked='+encodeURIComponent(i[3]);
	postData+='&authorThree='+encodeURIComponent(i[4]);
	postData+='&authorThreeChecked='+encodeURIComponent(i[5]);
	postData+='&based_onChecked='+encodeURIComponent(i[6]);
	postData+='&addressChecked='+encodeURIComponent(i[7]);
	postData+='&phone='+encodeURIComponent(i[8]);
	postData+='&phoneChecked='+encodeURIComponent(i[9]);
	postData+='&cell='+encodeURIComponent(i[10]);
	postData+='&cellChecked='+encodeURIComponent(i[11]);
	postData+='&email='+encodeURIComponent(i[12]);
	postData+='&emailChecked='+encodeURIComponent(i[13]);
	postData+='&registered='+encodeURIComponent(i[14]);
	postData+='&registeredChecked='+encodeURIComponent(i[15]);
	postData+='&other='+encodeURIComponent(i[16]);
	postData+='&otherChecked='+encodeURIComponent(i[17]);
	postData+='&based_on='+encodeURIComponent(i[18]);
	postData+='&address='+encodeURIComponent(i[19]);
	postData+='&resource_id='+resource_id;
	goog.net.XhrIo.send('/titlepagesave',
		function(e){
			goog.dom.getElement('saveButton').value='Saved'
		},
		'POST',
		postData
	);
    document.getElementById('saveButton').disabled=true;
    document.getElementById('saveButton').value="Saving..."
}


function update(){
    document.getElementById('saveButton').value="Save";
    document.getElementById('saveButton').disabled=false;
    document.getElementById('title').innerHTML="";
    document.getElementById('title').appendChild(document.createTextNode(document.getElementById("title_input").value));
    document.getElementById('authorOne').innerHTML="";
    document.getElementById('authorOne').appendChild(document.createTextNode(document.getElementById("authorOne_input").value));
    var c=document.getElementsByTagName('input')
    for(i in c){
        if (c[i].type=='checkbox'){
            var check = (c[i].checked==true ? true : false);
            var n = c[i].parentNode;
            n=n.previousSibling;
            if(n.nodeName=='#text')n=n.previousSibling;
            n=n.firstChild;
            if(n.nodeName=='#text')n=n.nextSibling;
            if(n.value=="" && !check)n.value="none";
            var data = n.value;
            if (c[i].id=="address_checkbox" || c[i].id=="based_on_checkbox"){
                var re = new RegExp( "\\n", "g" );
                data=data.replace(re,'<br>');
                document.getElementById(c[i].id.replace('_checkbox',"")).innerHTML=data;
            }
            else{
                document.getElementById(c[i].id.replace('_checkbox',"")).innerHTML="";
                document.getElementById(c[i].id.replace('_checkbox',"")).appendChild(document.createTextNode(data));
            }
            if(check){
                document.getElementById(c[i].id.replace('_checkbox',"_input")).disabled=false;
                document.getElementById(c[i].id.replace('_checkbox',"")).style.visibility='visible';
            }
            else{
                document.getElementById(c[i].id.replace('_checkbox',"_input")).disabled=true;
                document.getElementById(c[i].id.replace('_checkbox',"")).style.visibility='hidden';
            }
        }
    }
}