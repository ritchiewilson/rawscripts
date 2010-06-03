// Functions Called Upon by user

function nope(){
alert("Sorry, you're going to have to login to use these functions.");
}

function infoSizes(){
	var total = $('#scriptInfo').height() - 50;
	var oneBox = (total/3) - $('#sceneBoxHandle').height();
	$('#sceneindex').height(oneBox)
	$('#noteindex').height(oneBox)
	$('#characterindex').height(oneBox);
}
function infoResize(e){
	var raw = document.getElementById('mouseInfo').innerHTML.split('?');
	var header = raw[1];
	var difference = raw[2] - e.clientY;
	if (header=='noteBoxHandle'){
		if ($('#sceneindex').height()-difference>=0){
			if($('#noteindex').height()+difference>=0){
				$('#sceneindex').height($('#sceneindex').height()-difference);
				$('#noteindex').height($('#noteindex').height()+difference);
			}
		}
	}
	else if (header=='characterBoxHandle'){
		if($('#noteindex').height()-difference>=0){
			if($('#characterindex').height()+difference>=0){
				$('#noteindex').height($('#noteindex').height()-difference);
				$('#characterindex').height($('#characterindex').height()+difference);
			}
		}
	}
	raw[2] = e.clientY;
	document.getElementById('mouseInfo').innerHTML = raw.join('?');
}
function trackMouseDown(event){
	if(event.target.id!='sceneBoxHandle'){
		var init = event.clientY;
		document.getElementById('mouseInfo').innerHTML = 'down?'+ event.target.id + '?' + init;
	}
}
function trackMouseUp(event){
	document.getElementById('mouseInfo').innerHTML = 'up?0?0';
}
function tokenize(kind){
	var counter = 0;
	var c = document.getElementsByTagName('div');
		for(var i=0;i<c.length;i++){
			if(c[i].className=='token'){
				counter++;
				}
			}
	if (counter>4){alert('You can only have 5 recipients at a time for now. Only the first five will be sent.');return;}
	var txtbox = document.getElementById(kind);
	var data = txtbox.value.replace(',','');
	var whitespace = data.replace(/ /g, "");
	if (whitespace==""){return;}
	var arr = data.split(' ');
	var email = arr.pop();
	var name = "";
	if(arr.length == 0){name = email;}
	else{name = arr.join(' ').replace(/"/g, '');}
	// Create Token div
	var newToken = document.createElement('div');
	var insertedToken = document.getElementById(kind+'s').appendChild(newToken);
	insertedToken.className='token';
	insertedToken.id = email;
	// Create Name Area
	var newSpan = document.createElement('span');
	var nameSpan = insertedToken.appendChild(newSpan);
	var nameText = document.createTextNode(name);
	nameSpan.appendChild(nameText);
	//Create Mailto area
	var newSpan = document.createElement('span');
	var emailSpan = insertedToken.appendChild(newSpan);
	var emailText = document.createTextNode(email);
	emailSpan.className = 'mailto';
	emailSpan.appendChild(emailText);
	// create X button
	var newA = document.createElement('a');
	var xA = insertedToken.appendChild(newA);
	var xText = document.createTextNode(" | X");
	xA.appendChild(xText);
	var js = 'javascript:removeToken("'+email+'")'
	xA.setAttribute('href', js);
	txtbox.value='';
	
}
function removeToken(v){
	var token = document.getElementById(v);
	token.parentNode.removeChild(token);	
	}

function suggestNav(e){
	e.preventDefault()
	var c = document.getElementsByTagName('div');
	var arr = new Array();
	for(var i=0; i<c.length; i++){
		if(c[i].className == 'charSuggest'){
			arr.push(c[i]);
			}
		}
	if(document.getElementById('focus')==null){
		arr[0].id = 'focus';
		}
	else{
		var charSuggest = document.getElementById('focus')
		charSuggest.removeAttribute('id');
		var next 
		if (e.which==40){
			if (next = charSuggest.nextSibling){
				if(next.nodeName == '#text'){next = next.nextSibling}
				next.setAttribute('id', 'focus')
				}
			}
		if (e.which==38){
			if (next = charSuggest.previousSibling){
				if(next.nodeName == '#text'){next = next.nextSibling}
				next.setAttribute('id', 'focus')
				}
			}
		}
	}

function characterSuggest(obj){
	
	var prev = document.getElementById('suggest');
	if (prev!=null){
		prev.parentNode.removeChild(prev);
	}
	if(obj.innerHTML=="")return;
	if(obj.innerHTML=="<br>")return;
	
	obj.id='charFocus';
	var offset = $('#charFocus').offset();
	var height = window.innerHeight-offset.top;
	if (height<100){
		var a = 100-height;
		var b = '+=' + a;
		$('#container').scrollTo( b, 10 );
		offset.top=offset.top-a;
		}
	var ypx = offset.top+16+'px';
	var xpx = offset.left+'px';
	obj.removeAttribute('id');
	
	var newDiv = document.createElement('div');
	var suggestBox = document.body.appendChild(newDiv);
	suggestBox.id = 'suggest';
	suggestBox.style.position = 'fixed';
	suggestBox.style.top = ypx;
	suggestBox.style.left = xpx;
	suggestBox.style.zIndex = '100';
	suggestBox.className='suggestBox';
	var nodeType = '';
	if (obj.nodeName=='H3') nodeType = 'character';
	else nodeType = 'scene';
	var ifNone =0;
	var l = obj.firstChild.nodeValue.length;
	var c = document.getElementsByTagName('p');
	for (var i=0; i<c.length; i++){
		if (c[i].className == nodeType){
			if(nodeType=='scene'){
				var arr = c[i].innerHTML.split(')', 2);
				s = arr[1];
				s =s.substr(1);
				s=s.substring(0,l);
			}
			else{
				var s=c[i].innerHTML.substring(0,l);
			}
			if (obj.firstChild.nodeValue.toLowerCase()==s.toLowerCase()){
				/// Figure out exactly what should go in
				var menuOption;
				if(nodeType=='scene'){
					var arr = c[i].innerHTML.split(')', 2);
					menuOption = arr[1].substr(1).toUpperCase();
				}
				else menuOption = c[i].innerHTML;
				
				//-------Make sure we're not doubling up
				//--------
				var dontPut = 0;
				var others = document.getElementsByTagName('a')
				for(var counter = 0; counter<others.length; counter++){
					if(others[counter].parentNode.className=='charSuggest' && others[counter].innerHTML==menuOption){
						dontPut =1
					}
					// make sure scene thing does show up in suggest as wer're typing uncompleted slugline
					if(menuOption.toUpperCase()==obj.firstChild.nodeValue.toUpperCase()){
						dontPut = 1;
					}
				}
				if(dontPut==0){
					var newDiv = document.createElement('div');
					var newChar = suggestBox.appendChild(newDiv);
					newChar.className = 'charSuggest';
					var newA = document.createElement('a');
					var insertedA = newChar.appendChild(newA);
					insertedA.innerHTML = menuOption;
					if(nodeType=='character')insertedA.innerHTML=insertedA.innerHTML.replace(/^\s+|\s+$/g,"");
					var href = 'javascript:selectCharacter("'+menuOption+'")';
					insertedA.href = href;
					ifNone=1;
				}
			}
		}
	}
	if (ifNone==0){suggestBox.parentNode.removeChild(suggestBox);}
	else{
		suggestBox.firstChild.id = 'focus';
		$(".charSuggest").mouseover(function(){
											   var c = document.getElementById('focus');
											   if(c!=null){c.removeAttribute('id');}
											   this.id = 'focus'
											   }); 
	};
	}
	
	//// This function picks the chracter onclick
function selectCharacter(txt){
	var suggest = document.getElementById('suggest');
	if (suggest!=null){
		suggest.parentNode.removeChild(suggest);
	}
	var node = window.getSelection().anchorNode;
	var startNode = (node.nodeName == "#text" ? node.parentNode : node);
	startNode.innerHTML = txt;
	var chara = window.getSelection();
	chara.extend(startNode, 1);
	chara.collapseToEnd();
	sceneIndex();
}
function charSelect(e){
var anchor = document.getElementById('focus').firstChild;
//while(anchor.nodeName!='a'){anchor=anchor.nextSibling;}
var txt = anchor.innerHTML;
selectCharacter(txt);
}
function bottomScroll(){
	var node = window.getSelection().anchorNode;
	var startNode = (node.nodeName == "#text" ? node.parentNode : node);
	
	startNode.id='scrollFocus';
	var offset = $('#scrollFocus').offset();
	var height = window.innerHeight-offset.top;
	if (height<100){
		$('#container').scrollTo( '+=100', 0 );
		}
	startNode.removeAttribute('id');
	
	}

function tabButton(event) {
 event.preventDefault();
var i = document.getElementById("format").selectedIndex;
if (i==4) {i=0;}
else if (i==3) {i=5;}
else if (i==2) {i=1;}
else if (i==5) {i=3;}
else if (i==1) {i=0;}
else {i=2;}
document.getElementById("format").selectedIndex = i;
i=i+1;
fontEdit('formatBlock', 'h' + i);
}


//--------------------
//-----------------------------------
//-----------------------------------
//-------------- Handling Notes ands stuff------
//--------------next five or six fucntions------
function updateNote(obj){
	var id = obj.id;
	if (id==''){id=obj.parentNode.id;}
	var spans = document.getElementsByTagName('span');
	for(var i=0; i<spans.length; i++){
		if(spans[i].title.split('?comment=')[0] == id){
			var d = new Date();
			var newId = d.getTime();
			var reone = new RegExp('<br>', 'ig');
			var retwo = new RegExp('<div>', 'ig');
			var rethree = new RegExp('</div>', 'ig');
			if ($.browser.mozilla){
				var data = obj.innerHTML.replace(reone, 'HTMLLINEBREAK')
			}
			else{var data = obj.innerHTML.replace(reone, '').replace(rethree, '').replace(retwo, 'HTMLLINEBREAK');}
			spans[i].title = newId + '?comment=' + data;
			obj.id = newId;
		}
	}
}
function insertNote(){
	fontEdit('insertHTML', 'a');
	var selection = window.getSelection().getRangeAt(0);
	var container = selection.startContainer;
	var offset = selection.startOffset - 1;
	window.getSelection().extend(container, offset);
	var span = "<span class='notes' title='new'>X</span>";
	fontEdit('insertHTML', span);
	var obj;
	var marker = 0;
	var c = document.getElementsByTagName('span')
	for(var i=0; i<c.length; i++){
		if (c[i].title=='new'){
			c[i].className = 'notes';
			var obj = c[i];
			marker = 1;
		}
	}
	if (marker == 0){
		for (var i=0; i<c.length; i++){
			if (c[i].className=='Apple-style-span' && c[i].innerHTML =='X'){
				c[i].className = 'notes';
				var obj = c[i];
			}
		}
	}
	var d = new Date();
	var id = d.getTime();
	obj.title = id + '?comment=';
	notesIndex();
	document.getElementById(id).focus();
	
	
	
}
function selectNote(obj){
	var prev = obj.title;
	var arr = prev.split('?comment=');
	var id = arr[0];
	document.getElementById(id).focus();
}
function notesIndex(){
	// Romove old notes
	var c = document.getElementById('noteindex').childNodes;
	for(var j=0; j<c.length; j++){
		document.getElementById('noteindex').removeChild(c[j]);
		j--;
	}
	var noteCounter = 0;
	var spans = document.getElementsByTagName('span');
	for (var i=0; i<spans.length; i++){
		if(spans[i].className == 'notes' || spans[i].className == 'sharedNotes'){
			spans[i].innerHTML ='X';
			var arr = spans[i].title.split('?comment=');
			var data = (arr.length>1 ? arr[1] : spans[i].title);
			if ($.browser.mozilla){
				var pattern = new RegExp('HTMLLINEBREAK', 'gi');
				var noteHTML = data.replace(pattern,'<br>');
			}
			else{
				var lines = data.split('HTMLLINEBREAK');
				var noteHTML = lines[0];
				for (var j=1; j<lines.length; j++){
					noteHTML = noteHTML+'<div>';
					if(lines[j]=='') noteHTML = noteHTML+'<br>';
					else noteHTML = noteHTML + lines[j];
					noteHTML = noteHTML+'</div>';
				}
			}
			var note = document.getElementById('noteindex').appendChild(document.createElement('div'));
			note.innerHTML=noteHTML;
			if (spans[i].className == 'notes'){
				note.className = 'postit';
			}
			if (spans[i].className == 'sharedNotes'){
				note.className = 'sharedPostit';
			}
			note.contentEditable = 'true';
			note.id = arr[0];
			noteCounter++;
			
			
		}
	}
	$('.postit').blur(function(e){updateNote(e.target)});
	$('.sharedPostit').click(function(e){scrollToNote(e.target)});
	return noteCounter
}

function scrollToNote(obj){
	
	var id = obj.id;
	if (id==''){id=obj.parentNode.id;}
	var c = document.getElementsByTagName('span');
	var i =0;
	var marker=0;
	while (marker == 0){
		if (c[i].title.split('?comment=')[0]==id){
			marker = 1;
			c[i].id = 'note'
			c[i].innerHTML = 'X';
			$('#container').scrollTo('#note',500, {onAfter:function(){c[i].removeAttribute('id');}});
		}
		else i++;
		if(i>c.length) marker = 1;
	}
}
 
 
 
 
//---------------------------------- End of notes fucntions
//----------------------------------
//----------------------------------
//----------------------------------
//----------------------------------
function fontEdit(x,y) {
	try{
		var node = window.getSelection().anchorNode;
		var startNode = (node.nodeName == "#text" ? node.parentNode : node);
		if(startNode.className=='notes' || startNode.className=='sharedNotes')return;
	}
	catch(err){;}
	document.execCommand(x,"",y);
	bottomScroll();
	onTabOrEnter();
}
 
function enterButton(e) {
	var marker = 0;
	var d = document.getElementsByTagName('span');
	for(var i=0; i<d.length; i++){
		var ifNote =0;
		if (d[i].className=='notes' || d[i].className=='sharedNotes') ifNotes =1;
		if (ifNotes==1 && d[i].parentNode.nodeName=='DIV'){
			var c = d[i].parentNode.previousSibling.nodeName;
			var headerType;
			if (c == "H1") {headerType='h2';}
			else if (c == "H2") {headerType='h3';}
			else if (c == "H3") {headerType='h4';}
			else if (c == "H4") {headerType='h3';}
			else if (c == "H5") {headerType='h1';}
			else {headerType='h4';}
			var newHeader = document.getElementById('textEditor').insertBefore(document.createElement(headerType), d[i].parentNode);
			
			d[i].parentNode.parentNode.removeChild(d[i].parentNode);
			newHeader.innerHTML = 's';
			var range = document.createRange();
			range.selectNode(newHeader);
			range.collapse(false);
			
			newHeader.firstChild.select();
			marker = 1;
		}
	}
	if (marker == 0) lineFormat();
	var node = window.getSelection().anchorNode;
	var startNode = (node.nodeName == "#text" ? node.parentNode : node);
	var c = startNode.nodeName;
	if (c == "H4") {characterIndex();}
	else if (c == "H2") {sceneIndex();}
}
 
function lineFormat() {
var j = document.getElementById("format").selectedIndex;
if (j==0) {j=1;}
else if (j==1) {j=2;}
else if (j==2) {j=3;}
else if (j==3) {j=2;}
else if (j==5) {j=3;}
else {j=0;}
document.getElementById("format").selectedIndex = j;
j=j+1;
fontEdit('formatBlock', 'h' + j);
}

 
function getFormat(){
	try{
		var node = window.getSelection().anchorNode;
		var startNode = (node.nodeName == "#text" ? node.parentNode : node);
		if (startNode.nodeName =='SPAN')startNode = startNode.parentNode;
		var c = startNode.nodeName;
		if (c == "H1") {c=0;}
		else if (c == "H2") {c=1;}
		else if (c == "H3") {c=2;}
		else if (c == "H4") {c=3;}
		else if (c == "H5") {c=4;}
		else {c=5;}
		document.getElementById('format').selectedIndex = c;
		currentPage();
		onTabOrEnter();
	}
	catch(err){console.log(err);}
}

function onTabOrEnter(){
	var node = window.getSelection().anchorNode;
    var startNode = (node.nodeName == "#text" ? node.parentNode : node);
	var c= startNode.nodeName;
	var d = document.getElementById('onTabOrEnter');
	if (c == "H1") {d.innerHTML = "Tab : Character -- Enter : Action";}
	else if (c == "H2") {d.innerHTML = "Tab : Slugline -- Enter : Character";}
	else if (c == "H3") {d.innerHTML = "Tab : Action -- Enter : Dialouge";}
	else if (c == "H4") {d.innerHTML = "Tab : Parenthetical -- Enter : Character";}
	else if (c == "H5") {d.innerHTML = "Tab : Slugline -- Enter : Slugline";}
	else {d.innerHTML = "Tab : Dialouge -- Enter : Dialouge";}
	}
	
function sceneIndex () {
var p = document.getElementById('textEditor').getElementsByTagName( "h1" ); 
	var k = 0;
var s = document.getElementById('sceneindex');
//remove previous nodes
var prev = s.childNodes;
for (var i=0; i<prev.length; i=0){
	prev[0].parentNode.removeChild(prev[0]);
	}
while (k<p.length){
	var newP = document.createElement('p');
	var newScene = s.appendChild(newP);
	var l = k +1;
	var slug = "";
	var parts = p[k].childNodes;
	//--
	//--TOTO fix try, make it work when one of the sluglines is blank
	//--
	try{
	for(var i=0; i<parts.length; i++){
		var ifNotes = 0;
		if (parts[i].className=='notes' || parts[i].className=='sharedNotes') ifNotes = 1;
		if (parts[i].nodeName=='undefined'){;}
		else if (parts[i].nodeName=='#text') slug = slug+parts[i].nodeValue;
		else if (parts[i].nodeName=='SPAN'&& ifNotes == 0) {
			var spanTxt = parts[i].firstChild.nodeValue;
			slug = slug +spanTxt;
			parts[i].parentNode.removeChild(parts[i]);
			p[k].lastChild.nodeValue = p[k].firstChild.nodeValue + spanTxt;
		}
		else if (ifNotes==1) {;}
		else slug = slug+parts[i].firstChild.nodeValue;
		}
	}
	catch(err){;}
	var newText = l +") "+ slug;
	newText = newText.replace(/<BR>/i, "");
	var newNode = document.createTextNode(newText);
	newScene.appendChild(newNode);
	newScene.className = 'scene';
	newScene.id = 'p'+ l;
	newScene.style.cursor = "pointer";
	p[k].setAttribute('id', l);
	k++;
	}
	$(".scene").mouseover(function(){$(this).css("background-color", "#ccccff");});
	$(".scene").mouseout(function(){$(this).css("background-color", "white");});
	$(".scene").click(function(){$(this).css("background-color", "#999ccc");sceneSelect(this.id);});
}
 
function sceneSelect(p) {
var id = "p" + p;
var v = "#" + p.replace(/p/,"");
$('#container').scrollTo(v,500);
}
 
function characterIndex() {
var c = document.getElementsByTagName('h3');
if (c[0]==null){return;}
var e = new Array();
for (var x = 0;x<c.length;x++){
	e[x] = String(c[x].firstChild.nodeValue).toUpperCase().replace(" (CONT'D)", "").replace(/&nbsp;/gi,"").replace(/\s+$/,"").replace(" (O.S.)", "").replace(" (O.C.)", "").replace(" (V.O.)", "");
	}
e.sort();
var a = 0;
var b = 1;
while (a<e.length-1){
	if (e[a] == e[b])
		{e.splice(b,1)}
	else {a++; b++}
	}
var cI = document.getElementById('characterindex');
// remove previous nodes
var prevChar = cI.childNodes;
for (var i=0; i<prevChar.length; i=0){
	prevChar[0].parentNode.removeChild(prevChar[0]);
	}
var k = 0;
while (k<e.length){
	if(e[k]!='(MORE)'){
		var newP = document.createElement('p');
		var newChar = cI.appendChild(newP);
		newChar.innerHTML = e[k];
		newChar.className = "character";
		}
	k++;
	}
continued();
}

function pasteEdit(){
	if ($.browser.webkit){
		setTimeout(function(){
		var node = window.getSelection().anchorNode;
		var startNode = (node.nodeName == "#text" ? node.parentNode : node);
		removeAttribute();
		var d = document.getElementById("textEditor");
		var c = d.childNodes;
		for (var i = 0; i<c.length; i++) {
			var f = c[i].firstChild;
			if (f == "[object HTMLMetaElement]") {c[i].removeChild(f);}
			else if (f == "[object Text]"){;}
			else if (f == null) {;}
			else {document.getElementById('textEditor').insertBefore(f, c[i]); i--;}
			}
		sceneIndex();
		var chara = window.getSelection();
	  	chara.extend(startNode, 1);
	  	chara.collapseToEnd();
		bottomScroll();
		}, 0);
	}
sceneIndex();
}

function removeAttribute () {
var m = document.getElementById('textEditor').getElementsByTagName("meta");
for (var k = 0; k<m.length; k++) {
	var p = m[k].parentNode;
	p.removeChild(m[k]);
	k--;
	}
var m = document.getElementById('textEditor').getElementsByTagName('h1');
for (var i = 0; i<m.length; i++){
	m[i].removeAttribute("style");
	}
var m = document.getElementById('textEditor').getElementsByTagName('h2');
for (var i = 0; i<m.length; i++){
	m[i].removeAttribute("style");
	}
var m = document.getElementById('textEditor').getElementsByTagName('h3');
for (var i = 0; i<m.length; i++){
	m[i].removeAttribute("style");
	}
var m = document.getElementById('textEditor').getElementsByTagName('h4');
for (var i = 0; i<m.length; i++){
	m[i].removeAttribute("style");
	}
var m = document.getElementById('textEditor').getElementsByTagName('h5');
for (var i = 0; i<m.length; i++){
	m[i].removeAttribute("style");
	}
var m = document.getElementById('textEditor').getElementsByTagName('h6');
for (var i = 0; i<m.length; i++){
	m[i].removeAttribute("style");
	}
}
function pagination(){
	// trying to fix jumping problem when looking at end of script--- 
	// - - - - - -just reverse this process at the end
	document.getElementById('textEditor').style.marginTop='10000px';
	
	
	
	//DELETE OLD PAGEBREAKS
	var m = document.getElementsByTagName("hr");
	for (var k = 0; k<m.length; k++) {
		var p = m[k].parentNode;
		p.removeChild(m[k]);
		k--;
		}
	// DELETE OLD (MORE)S
	var h = document.getElementsByTagName('h3');
	for(var q=0; q<h.length; q++){
		if(h[q].className == "more"){
			// Get the text of the first half of the dialouge
			var dialouge = h[q].previousSibling;
			if (dialouge.nodeName == '#text'){
				dialouge = dialouge.previousSibling;
				}
			var partOne = dialouge.innerHTML;
			
			// delete next character holder
			var charHolder = h[q].nextSibling;
			while(charHolder.nodeName!='H3'){charHolder = charHolder.nextSibling;}
			var p = charHolder.parentNode;
			p.removeChild(charHolder);
			// get next dialouge block then delete it
			var nextDialouge = h[q].nextSibling;
			while(nextDialouge.nodeName!='H4'){nextDialouge = nextDialouge.nextSibling;}
			partOne = partOne+' '+nextDialouge.innerHTML;
			var p = nextDialouge.parentNode;
			p.removeChild(nextDialouge);
			// stick text back in
			dialouge.innerHTML = partOne;
			//delete MORE
			p.removeChild(h[q]);
			}
		
		}
	// DELETE OLD PAGE NUMBERS
	var op = document.getElementsByTagName('h5');
	for (var r=0;r<op.length;r++){
		if (op[r].className=='pn'){
			op[r].parentNode.removeChild(op[r]);
			r--;
			}
		}
	
	// START COUNTING OUT lines
	var c = document.getElementById('textEditor').childNodes;
	var lines = 0;
	var list = [];
	var wraps = 1;
	for (var i = 0; i<c.length; i++){
		if (c[i].nodeName == "#text") {;}
		else {
			var length = 0;
			if (c[i].nodeName == "H1") {lines=lines+2;}
			else if (c[i].nodeName == "H3") {lines=lines+2; var name = c[i].innerHTML;}
			else if (c[i].nodeName == "H5") {lines=lines+2;}
			else if (c[i].nodeName == "H2") {
				// add oneline for blank space
				lines++;
				var txtData = '';
				var pieces = c[i].childNodes;
				for (var iterant=0; iterant<pieces.length; iterant++){
					if (pieces[iterant].nodeName!='SPAN') txtData = txtData + pieces[iterant].nodeValue;
					
				}
				var words = txtData.split(' ');
				for (var j=0; j<words.length; j++){
					length = length+words[j].length+1;
					if (length>62){
						lines++;
						length=0;
						j--;
						wraps++;
						}
					}
				//add one line for remainder, or one if it's the only line of dialouge
				lines++
				}
			else if (c[i].nodeName == "H4") {
				// DON"T add oneline for blank space
				var txtData = '';
				var pieces = c[i].childNodes;
				for (var iterant=0; iterant<pieces.length; iterant++){
					if (pieces[iterant].nodeName!='SPAN') txtData = txtData + pieces[iterant].nodeValue;
					
				}
				var words = txtData.split(' ');
				for (var j=0; j<words.length; j++){
					length = length+words[j].length+1;
					if (length>35){
						lines++;
						length=0;
						j--;
						wraps++;
						}
					}
				//add one line for remainder, or one if it's the only line of dialouge
				lines++
				}
			else if (c[i].nodeName == "H6") {
				// DON"T add oneline for blank space
				var txtData = '';
				var pieces = c[i].childNodes;
				for (var iterant=0; iterant<pieces.length; iterant++){
					if (pieces[iterant].nodeName!='SPAN') txtData = txtData + pieces[iterant].nodeValue;
					
				}
				var words = txtData.split(' ');
				for (var j=0; j<words.length; j++){
					length = length+words[j].length+1;
					if (length>26){
						lines++;
						length=0;
						j--;
						}
					}
				}
				
			if (lines>56){
				if (c[i].nodeName == 'H2'){;}
				if (c[i].nodeName == 'H5'){i--; if (c[i].nodeName == "#text") {i--;}}
				if (c[i].nodeName == 'H1'){i--; if (c[i].nodeName == "#text") {i--;}}
				if (c[i].nodeName == 'H4'){
					if(wraps>3){
							if(lines-wraps<55){
								var second = c[i].cloneNode(true);
								var secondPage = document.getElementById('textEditor').insertBefore(second, c[i+1]);
								
								var firstPage = 56-lines+wraps;
								var words = c[i].innerHTML.split(' ');
								var firstPageLines = 0;
								var n = 0;
								var sliceCount = 0
								var lineLength = 0;
								var firstPageContent='';
								while (firstPageLines<firstPage){
									if (words[n].length+lineLength<35){
										firstPageContent = firstPageContent + String(words[n]) + ' ';
										lineLength = lineLength + words[n].length+1;
										sliceCount = sliceCount+words[n].length+1;
										n++;
										}
									else {
										lineLength = 0;
										firstPageLines++;
										}
									}
								
								var secondPageContent = secondPage.innerHTML;
								secondPageContent = secondPageContent.replace(firstPageContent, "");
								// don't allow one line on the second page
								if (secondPageContent.length<35){
									var wordArray = firstPageContent.split(" ");
									lineLength = 0;
									while(lineLength<35){
										lineLength = lineLength + wordArray[wordArray.length-1] + 1;
										secondPageContent = wordArray.pop() + " " + secondPageContent;
										}
									firstPageContent = wordArray.join(" ");
									}
								//insert dialouge text
								c[i].innerHTML = firstPageContent;
								secondPage.innerHTML = secondPageContent;
								var newBr = document.createElement('h3');
								var more = document.getElementById('textEditor').insertBefore(newBr, secondPage);
								more.innerHTML = '(MORE)';
								more.className = 'more';
								var newHeader = document.createElement('h3');
								var character = document.getElementById('textEditor').insertBefore(newHeader, secondPage);
								character.innerHTML = name;
								i++;
								i++;
								}
							else{i--;if (c[i].nodeName == "#text") {i--;}}
							}
					else {i--; if (c[i].nodeName == "#text") {i--;}}
					}
				if (c[i].nodeName == 'H6'){i--; if (c[i].nodeName == "#text") {i--;}}
				var pb = i+list.length;
				list.push(pb);
				lines=0;
				i--;
				}
			wraps=1;
			}
	}
	for (var n=0; n<list.length; n++){
		var newHr = document.createElement('hr');
		insertedElement = document.getElementById('textEditor').insertBefore(newHr, c[list[n]]);
		insertedElement.className='pb';
	}
	var pb = document.getElementsByTagName('hr')
	for(var p=0; p<pb.length; p++){
		var pageHolder = document.getElementById('textEditor').insertBefore(document.createElement('h5'), pb[p].nextSibling);
		pageHolder.appendChild(document.createTextNode((p+2)+'.'));
		pageHolder.className = 'pn';
		
		}
	
	document.getElementById('totalPages').innerHTML= ' of  '+(list.length+1);
	/// reversing the margin jump to keep the page in the same place
	// basicaly reversing the first line of this function
	document.getElementById('textEditor').style.marginTop = '10px';
	continued();
}
function currentPage(){
	var node = window.getSelection().anchorNode;
    var startNode = (node.nodeName == "#text" ? node.parentNode : node);
    var c = document.getElementById('textEditor').childNodes;
	var i = 0;
	var count = 1;
	while(c[i]!=startNode){
			if(c[i].nodeName=='HR'){
				count++;
				}
		
		i++;
		if(i>c.length) return;
		}
	document.getElementById('currentPage').innerHTML = count;
	}
	
 
 function htmlTitleUpdate(){
	if (document.getElementById('title') == "") {document.title = "Script Editor";}
	else {document.title = document.getElementById('title').innerHTML;}

}

function continued() {
	var c = document.getElementsByTagName('h3');
	for (var i = 0; i<c.length; i++){
		c[i].innerHTML = c[i].innerHTML.replace(/\s+$/,"");
		try{c[i].firstChild.nodeValue = c[i].firstChild.nodeValue.replace(/\s+$/,"");}
		catch(err){;}
		}
	// Delete old Mores
	for (var b=0; b<c.length-1; b++){
		c[b].firstChild.nodeValue = c[b].firstChild.nodeValue.replace(" (CONT'D)", "");
	}
	// insert new ones
	var c = document.getElementById('textEditor').childNodes;
	var prev = null;
	var arr = [];
	var current;
	for (var i=0; i<c.length; i++){
		current='';
		// check current and see what to do
		if (c[i].nodeName=='H1') prev = null;
		if (c[i].nodeName=='H3'){
			arr = c[i].childNodes
			for (var j=0; j<arr.length; j++){
				if (arr[j].nodeName=='#text') current = current+arr[j].nodeValue;
			}
			current = current.toUpperCase();
			current = current.replace(" (O.S.)", '').replace(" (V.O.)", '').replace(" (O.C.)", '').toUpperCase();

			if(prev=='&more&'){
				c[i].innerHTML = c[i].innerHTML +" (CONT'D)";
				prev = current;
			}
			else if(c[i].className == 'more'){
				prev = '&more&';
			}
			else if (current==prev){
				c[i].innerHTML = c[i].innerHTML +" (CONT'D)";
				prev = current;
			}
			else prev = current;
			
		}
	}
}

 

function printPrompt(){
	var notesCounter = notesIndex();
	if (notesCounter==0) printScript(0);
	else document.getElementById('printpopup').style.visibility = 'visible';
	}
function hidePrintPrompt(){
	document.getElementById('printpopup').style.visibility = 'hidden';
	}
//---- HTML style printing with and without notes----
//----- Done Local so doenst need server connection----
function printScript(bool){
	pagination();
	document.getElementById('wholeShebang').style.display = 'none';
	var printDiv = document.body.appendChild(document.createElement('div'));
	printDiv.id = 'printDiv';
	printDiv.style.width = '600px';
	printDiv.style.margin = 'auto';
	var content = '<div>';
	var script = document.getElementById('textEditor').innerHTML;
	script = script.replace(/<hr class="pb">/gi, '<p style="display:none"></p>');
	script = script.replace(/class="pn"/gi, 'class="printPageBreak"');
	script = script.replace(/<h3 class="more">/gi, '<h3 class="printMore">');
	script = script.replace(/<span class="notes"/gi, '<span class="printNotes"');
	script = script.replace(/<span class="sharedNotes"/gi, '<span class="printNotes"');
	printDiv.innerHTML = script;
	var c = printDiv.childNodes;
	for (var i=0; i<c.length; i++){
		if(c[i].className!='printPageBreak' && c[i].className!='printMore' && c[i].className!='printPageBreak')c[i].className = 'print';
	}
	// Printing Notes
	if(bool==1){
		var notesHeader = printDiv.appendChild(document.createElement('p'));
		notesHeader.appendChild(document.createTextNode('Notes for '+ document.getElementById('title').firstChild.nodeValue.toUpperCase() +':'));
		notesHeader.style.pageBreakBefore = 'always';
		var orderedList = printDiv.appendChild(document.createElement('ol'));
		var notesCounter = 1;
		var notes = document.getElementsByTagName('span');
		for(var i=0; i<notes.length;i++){
			if (notes[i].className=='printNotes'){
				notes[i].removeAttribute('style');
				notes[i].innerHTML = notesCounter;
				// figure out what page it's on
				var prevSib = notes[i].parentNode;
				var findPage = 0;
				while(findPage==0){
					if(prevSib = prevSib.previousSibling){
						if(prevSib.className=='printPageBreak'){
							var pageSpan = prevSib.nextSibling;
							pageSpan = (pageSpan.nodeName=='#text' ? pageSpan.nextSibling : pageSpan);
							var pageNumber = prevSib.innerHTML.replace('.','');
							findPage=1;
						}
					}
					else{
						var pageNumber = 1;
						findPage=1;
					}
				}
				var noteText = 'Page ' + pageNumber + ' -- ' + notes[i].title.split('?comment=')[1].replace(/HTMLLINEBREAK/g, '<br>');
				var footnote = orderedList.appendChild(document.createElement('li'));
				footnote.className = 'footnote';
				footnote.innerHTML = noteText;
				notesCounter++;
			}
		}
	}
	// end routine for printing notes
	else $('.printNotes').css('display', 'none');
	$('.printPageBreak').css('page-break-before', 'always');
	window.print() ;
	hidePrintPrompt();
	document.getElementById('wholeShebang').style.display = 'block'; 
	printDiv.parentNode.removeChild(printDiv);
	
}

//
//----------------------------------------------
//---------Backend Processes-------------------
//
//
//
///// Rename functions
function renamePrompt(){
	document.getElementById('renamepopup').style.visibility = 'visible';
	}
function hideRenamePrompt(){
	document.getElementById('renameField').value = "";
	document.getElementById('renamepopup').style.visibility = 'hidden';
	}
function renameScript(){
	if(document.getElementById('demo').innerHTML=='demo'){
		nope();
		return;
	}
	var url = window.location.href;
	var resource_id = url.split('=')[1];
	var rename = document.getElementById('renameField').value;
	if (rename==""){return;}
	document.getElementById('title').innerHTML = rename;
	$.post("/rename", {resource_id : resource_id, rename : rename, fromPage : 'editor'});
	hideRenamePrompt()
	}
	
	
	
//// export functions
function hideExportPrompt(){
	document.getElementById('exportpopup').style.visibility = 'hidden';
	}
function exportPrompt(){
	save();
	document.getElementById('exportpopup').style.visibility = 'visible';
	}
function exportScripts(){
	if(document.getElementById('demo').innerHTML=='demo'){
		nope();
		return;
	}
	var url = window.location.href;
	var resource_id = url.split('=')[1];
	var format;
	var exports = document.getElementsByTagName('input');
	for (var i=0; i<exports.length; i++){
		if (exports[i].checked==true){
			if (exports[i].className=='exportList'){
				format = exports[i].name;
				url = '/export?resource_id=' + resource_id + '&export_format=' + format + '&fromPage=editor';
				window.open(url);
				}
			}
	}
	hideExportPrompt();
}
//------------- Sharing fucntions
function sharePrompt(){
	$.post('/contactlist', {fromPage : 'editorShare'}, function(data){var contacts = data.split(';');$("input#collaborator").autocomplete({source: contacts});});
	document.getElementById('sharepopup').style.visibility = 'visible';
	}
function hideSharePrompt(){
document.getElementById('sharepopup').style.visibility = 'hidden';
document.getElementById('collaborator').value = "";
document.getElementById('collaborators').innerHTML = "";
}
function shareScript(){
	if(document.getElementById('demo').innerHTML=='demo'){
		nope();
		return;
	}
	tokenize('collaborator');
	var arr = new Array();
	var c = document.getElementsByTagName('span');
	for(var i=0;i<c.length; i++){
		if (c[i].className=='mailto'){
			arr.push(c[i].innerHTML);
			}
		}
	var collaborators = arr.join(',');
	var url = window.location.href;
	var resource_id = url.split('=')[1];
	$.post("/share", {resource_id : resource_id, collaborators : collaborators, fromPage : 'editor'});
	hideSharePrompt();
}

	
//------------Emailing fucntions
	
function emailScript(){
	if(document.getElementById('demo').innerHTML=='demo'){
		nope();
		return;
	}
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
	var url = window.location.href;
	var resource_id = url.split('=')[1];
	$.post("/emailscript", {resource_id : resource_id, recipients : recipients, subject :subject, body_message:body_message, fromPage : 'editor'});
	hideDiv();
}
function emailPrompt(v){
	
	$.post('/contactlist', {fromPage : 'editorEmail'}, function(data){var contacts = data.split(';');$("input#recipient").autocomplete({source: contacts});});
	save();
	document.getElementById('hideshow').style.visibility = 'visible';
}
function hideDiv(){
document.getElementById('hideshow').style.visibility = 'hidden';
document.getElementById('recipient').value = "";
document.getElementById('subject').value = "";
document.getElementById('message').innerHTML = "";
document.getElementById('recipients').innerHTML = "";
}

//----------Saving---------//
function save() {
	if(document.getElementById('demo').innerHTML=='demo'){
		nope();
		return;
	}
	try{
		$('.sm').removeClass('sm');
		var node = window.getSelection().anchorNode;
		var startNode = (node.nodeName == "#text" ? node.parentNode : node);
		if (startNode.parentNode.id=='textEditor') startNode.className = 'sm';
	}
	catch(err){;}
	if(document.getElementById('suggest')!=null){return;}
	var s = document.getElementById('save');
	var ex = document.getElementById('exportS');
	var em = document.getElementById('emailS');
	if (s.value != "Saved"){
	  s.disabled = true;
	  em.disabled = true;
	  ex.disabled = true;
	  s.value = 'Remove Attributes...';
	  removeAttribute ();
	  em.value = 'Setting pages...';
	  ex.value = 'Setting pages...';
	  s.value = 'Setting pages...';
	  pagination();
	  em.value = "Saving...";
	  ex.value = "Saving...";
	  s.value = "Saving...";
	  var url = window.location.href;
	  var resourceId = url.split('=')[1];
	  var content = document.getElementById('textEditor').innerHTML;
	  $.post("/save", {resource_id : resourceId, content : content, fromPage : 'editor'}, function(){s.value='Saved';em.disabled=false; ex.disabled=false; em.value='Send'; ex.value='Export'});
	  //var chara = window.getSelection();
	  //try{
		//chara.extend(startNode, 1);
		//chara.collapseToEnd();
		//}
	  //catch(err){;}
	  sceneIndex();
	}
}
function saveClose(){
	if(document.getElementById('demo').innerHTML=='demo'){
		nope();
		return;
	}
	removeAttribute ();
	var save = document.getElementById('save');
	save.disabled = true;
	save.value = 'Setting pages...';
	pasteEdit();
	pagination();
	save.value = "Saving...";
	var url = window.location.href;
	var resourceId = url.split('=')[1];
	var content = document.getElementById('textEditor').innerHTML;
	$.post("/save", {resource_id : resourceId, content : content}, function(){window.close();});
	
	
	}