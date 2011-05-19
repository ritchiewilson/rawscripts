/**
 * Sets the size of elements based
 * on browser size. Does it on load
 * and more on resize.
 * @param {string} v 
 * "r" indicates window resize
 * "i" indicates initial setup
 */
function setElementSizes(v){
	var s = goog.dom.getViewportSize();
	goog.style.setSize(goog.dom.getElement('container'), s);
	var c=goog.dom.getElementsByClass('canvas');
	for(i in c){
		c[i].height = s.height - 60-38;
		c[i].width = s.width-320;
	}
	editorWidth=s.width-323;
	editorHeight=s.height;
	goog.dom.getElement('insertNewNote').style.marginLeft=editorWidth-630*1+"px";
	goog.dom.getElement('sidebar').style.height = (s.height-70)+'px';
	goog.dom.getElement('info').style.width = (editorWidth-6)+'px';
	if(v=="r"){
		scroll(0);
	}
}

function fillInfoBar(){
	var cell = goog.dom.getElement('info').getElementsByTagName('table')[0].getElementsByTagName('tr')[0].getElementsByTagName('td')[0];
	
	//first cell
	if(EOV=='editor'){
		var wordArr=["Enter : Action  --  Tab : Character", "Enter : Character  --  Tab : Slugline", "Enter : Dialog  --  Tab : Action", "Enter : Character  --  Tab : Parenthetical", "Enter : Dialog  --  Tab : Dialog", "Enter : Slugline  --  Tab : Slugline"];
		goog.dom.setTextContent(cell, wordArr[lines[pos.row].format]);
	}
	else{goog.dom.setTextContent(cell, '');}
	
	//second cell
	cell = goog.dom.getNextElementSibling(cell);
	var ts=0; //total scenes
	var cs=0; // current scene
	for(i in lines){
		if(lines[i].format==0)ts++;
		if(i==pos.row)cs=ts;
	}
	goog.dom.setTextContent(cell, "Scene "+cs+" of "+ts);
	
	// third cell
	cell = goog.dom.getNextElementSibling(cell);
	//figure out what page the caret is on
	var page = 0;
	for(i in pageBreaks){
		if(pos.row<pageBreaks[i][0])break
		page++;
	}
	//handle if caret is in text with page break
	if(page!=0 && pageBreaks[page-1][0]==pos.row){
		var j=0;
		var tc=0;
		while(j<pageBreaks[page-1][2]){
			tc+=linesNLB[pos.row][j].length+1;
			j++;
		}
		if(pos.col<tc)page--;
	}
	goog.dom.setTextContent(cell, "Page "+(page+1)+" of "+(pageBreaks.length+1));
	
}

/**
 * In the right column, there's a scene
 * tab and notes tab. Switch between them
 * Awe shit. Why is there stying in this function
 * make it calss based or something
 *
 * @param {number} v ; a zero indexed tab thingy
 * only two tabs, so v is 0 or 1
 */
function tabs(v){
	var t = ["sceneTab","noteTab"]
	for(i in t){
		var c = goog.dom.getElement(t[i]);
		if(i==v){
			c.style.backgroundColor="#3F5EA6";
			c.style.color='white';
			goog.dom.getElement(t[i].replace("Tab","s")).style.display="block";
		}
		else{
			c.style.backgroundColor="#6C8CD5";
			c.style.color='black';
			goog.dom.getElement(t[i].replace("Tab","s")).style.display="none";
		}
	}
}

/**
 * Creates a menu of character or scene
 * names the user might by typing. Uses
 * goog.UI.Menu()
 * @param { string } d denotes character "c"
 * or scene "s"
 */
function createSuggestBox(d){
	if(EOV=='viewer')return;
	// remove old box if applicable
	if(goog.dom.getElement('suggestBox')!=null){
		goog.dom.removeNode(goog.dom.getElement('suggestBox'));
	}
	// get correct list of characters or scenes (v)
	// and the position of the left edge of the proposed
	// suggest box
	if(d=='c'){
        var v=characters;
    }
    else{
        var v=[];
        for(i in scenes){
            v.push([scenes[i][0].split(') ').splice(1).join(') ')]);
        }
    }
	var l=lines[pos.row].text.length;
	var part=lines[pos.row].text.toUpperCase();
	for (x in v){
		var s = v[x][0].substr(0,l).toUpperCase();
		if (part==s){
			//create box now if doens't exist
			if(goog.dom.getElement('suggestBox')==null){
				var pageStartX = Math.round((editorWidth-fontWidth*87-24)/2);
				var box = document.body.appendChild(document.createElement('div'));
				box.id='suggestBox';
				box.style.position='fixed';
				box.style.top=canvasPosition(pos.row,0,pageStartX).canvasY+headerHeight+9+lineheight+"px";
				box.style.left=WrapVariableArray[lines[pos.row].format][1]+pageStartX+'px';
				box.className = 'goog-menu'
			}
			// Scene list could double up
			// Check here to make sure it's
			// unique
            var found=false;
            if(d=='s'){
                var c = box.childNodes;
                for (i in c){
                    if(v[x][0]==c[i].value)found=true;
                }
				c=null;
            }
			// if it isn't found in suggest box
			// already (i.e. "unique"), then put
			// put it in
            if(!found){
                var item = box.appendChild(document.createElement('div'));
                item.className="goog-menuitem";
                item.appendChild(document.createTextNode(v[x][0]))
                item.value=v[x][0];
				item=null;
            }
			found=null;
		}
	}
	// If there is only one item in the suggest box
	// and the user has typed it in full, remove the
	// suggest box
	if(goog.dom.getElement('suggestBox')!=null){
		if (goog.dom.getElement('suggestBox').childNodes.length==1){
			if(goog.dom.getElement('suggestBox').firstChild.value.toUpperCase()==lines[pos.row].text.toUpperCase())goog.dom.removeNode(goog.dom.getElement('suggestBox'))
		}
	}
	// Finally, if there is still a suggest box with
	// options in it, decorate it as a menu with
	// goog.ui.Menu()
	if(goog.dom.getElement('suggestBox')!=null){
		var menuDiv = goog.dom.getElement('suggestBox');
		googSuggestMenu = new goog.ui.Menu();
		googSuggestMenu.decorate(menuDiv)
		googSuggestMenu.setAllowAutoFocus(true);
		googSuggestMenu.setHighlightedIndex(0);
		// set up event for when option is selected
		// i.e. put correct text in, move fake caret
		// add to undoQue, remove suggest box
		goog.events.listen(googSuggestMenu, 'action', function(e) {
			var txt = e.target.getCaption();
			var len = lines[pos.row].text.length;
			lines[pos.row].text=txt;
		    undoQue.push(['paste', pos.row, pos.col, lines[pos.row].text.substr(len)]);
			pos.col=anch.col=lines[pos.row].text.length;
			goog.dom.removeNode(goog.dom.getElement('suggestBox'))
	    });
	}
}