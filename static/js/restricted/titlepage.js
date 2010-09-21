goog.require('goog.events')
goog.require('goog.dom');
goog.require('goog.dom.DomHelper');
goog.require('goog.events.EventType');
goog.require('goog.style');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler');
goog.require('goog.ui.Menu');
goog.require('goog.ui.Container');
goog.require('goog.net.XhrIo');
goog.require('goog.array');


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
	var postData = 'title='+escape(i[0]);
	postData+='&authorOne='+escape(i[1]);
	postData+='&authorTwo='+escape(i[2]);
	postData+='&authorTwoChecked='+escape(i[3]);
	postData+='&authorThree='+escape(i[4]);
	postData+='&authorThreeChecked='+escape(i[5]);
	postData+='&based_onChecked='+escape(i[6]);
	postData+='&addressChecked='+escape(i[7]);
	postData+='&phone='+escape(i[8]);
	postData+='&phoneChecked='+escape(i[9]);
	postData+='&cell='+escape(i[10]);
	postData+='&cellChecked='+escape(i[11]);
	postData+='&email='+escape(i[12]);
	postData+='&emailChecked='+escape(i[13]);
	postData+='&registered='+escape(i[14]);
	postData+='&registeredChecked='+escape(i[15]);
	postData+='&other='+escape(i[16]);
	postData+='&otherChecked='+escape(i[17]);
	postData+='&based_on='+escape(i[18]);
	postData+='&address='+escape(i[19]);
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