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


window['closeTitlePage']=closeTitlePage;
window['save']=save;
window['update']=update;


//Set up global events.
//First Clicking on checkbox
var arr = goog.dom.getElementsByClass('checkbox')
for (i in arr){
	if(arr[i].type=='checkbox')goog.events.listen(arr[i], goog.events.EventType.CLICK, update)
}
// Listen for keyup events in text boxes
var arr = goog.dom.getElementsByClass('textbox')
for (i in arr){
	if(arr[i].nodeName=='INPUT' || arr[i].nodeName=='TEXTAREA')goog.events.listen(arr[i], goog.events.EventType.KEYUP, update)
}
// Listen for resize events because I suck at css. Suck suck suck.
var vsm = new goog.dom.ViewportSizeMonitor();
goog.events.listen(vsm, goog.events.EventType.RESIZE, setElementSizes);
// then initial resize
setElementSizes();

function setElementSizes(){
    var s = goog.dom.getViewportSize();
    var c = goog.style.getSize(goog.dom.getElement('controls'));
    goog.dom.getElement('pageContainer').style.width = (s.width - c.width ) + "px";
    goog.dom.getElement('page').style.visibility = 'visible';
}

function closeTitlePage(){
    window.close()
}
function save(){
    var resource_id=window.location.href.split('=')[1];
    if (resource_id=='Demo'){
        alert("Sorry, but you'll have to login to use these functions!");
        return;
    }
    var inputs = [
        ['title', 'title_input'],
        ['authorOne', 'authorOne_input'],
        ['authorTwo', 'authorTwo_input'],
        ['authorTwoChecked', 'authorTwo_checkbox'],
        ['authorThree', 'authorThree_input'],
        ['authorThreeChecked', 'authorThree_checkbox'],
        ['based_on', 'based_on_input'],
        ['based_onChecked', 'based_on_checkbox'],
        ['address', 'address_input'],
        ['addressChecked', 'address_checkbox'],
        ['phone', 'phone_input'],
        ['phoneChecked', 'phone_checkbox'],
        ['cell', 'cell_input'],
        ['cellChecked', 'cell_checkbox'],
        ['email', 'email_input'],
        ['emailChecked', 'email_checkbox'],
        ['registered', 'registered_input'],
        ['registeredChecked', 'registered_checkbox'],
        ['other', 'other_input'],
        ['otherChecked', 'other_checkbox']
    ];
    var postData = '';
    for (i in inputs){
        var elem = document.getElementById(inputs[i][1]);
        var value = '';
        if (elem.type == 'checkbox')
            value = (elem.checked ? 'checked' : '');
        else if (elem.value != undefined){
            value = elem.value;
            var re = new RegExp( "\\n", "g" );
            value = value.replace(re,'LINEBREAK');
        }
        if (postData != '')
            postData += '&';
        postData += inputs[i][0] + '=' + encodeURIComponent(value);
    }

	postData+='&resource_id='+resource_id;
	goog.net.XhrIo.send('/titlepagesave',
		function(e){
			goog.dom.getElement('saveButton').value='Saved'
		},
		'POST',
		postData
	);
    goog.dom.getElement('saveButton').disabled=true;
    goog.dom.getElement('saveButton').value="Saving..."
}


function update(){
    goog.dom.getElement('saveButton').value="Save";
    goog.dom.getElement('saveButton').disabled=false;
    goog.dom.getElement('title').innerHTML="";
    goog.dom.getElement('title').appendChild(document.createTextNode(goog.dom.getElement("title_input").value));
    goog.dom.getElement('authorOne').innerHTML="";
    goog.dom.getElement('authorOne').appendChild(document.createTextNode(goog.dom.getElement("authorOne_input").value));
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
                goog.dom.getElement(c[i].id.replace('_checkbox',"")).innerHTML=data;
            }
            else{
                goog.dom.getElement(c[i].id.replace('_checkbox',"")).innerHTML="";
                goog.dom.getElement(c[i].id.replace('_checkbox',"")).appendChild(document.createTextNode(data));
            }
            if(check){
                goog.dom.getElement(c[i].id.replace('_checkbox',"_input")).disabled=false;
                goog.dom.getElement(c[i].id.replace('_checkbox',"")).style.visibility='visible';
            }
            else{
                goog.dom.getElement(c[i].id.replace('_checkbox',"_input")).disabled=true;
                goog.dom.getElement(c[i].id.replace('_checkbox',"")).style.visibility='hidden';
            }
        }
    }
}

