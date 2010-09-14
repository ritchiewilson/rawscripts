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