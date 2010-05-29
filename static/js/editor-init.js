// Onload - a big init file setting up jquery and everything
function editorinit(resource_id)
{	
	htmlTitleUpdate();
	notesIndex();
	$('.postit').focusin(function(e){document.getElementById('format').disabled=true});
	$('.postit').focusout(function(e){document.getElementById('format').disabled=false});
	$('.postit').click(function(e){scrollToNote(e.target)});
	$('.tabs').click(function(e){tabs(e.target)});
	$(".tabs").mouseover(function(){$(this).css("background-color", "#999ccc");});
	$(".tabs").mouseout(function(){$(this).css("background-color", "#90A6D8");});
	$('#renameField').keydown(function(e){if(e.which==13){e.preventDefault(); renameScript()}});
	$('#recipient').keydown(function(e){if(e.which==13){e.preventDefault();}});
	$('#subject').keydown(function(e){if(e.which==13){e.preventDefault()}});
	$('#newScript').keydown(function(e){if(e.which==13){e.preventDefault();createScript()}});
	$('#collaborator').keydown(function(e){if(e.which==13){e.preventDefault();}});
	document.getElementById('textEditor').focus();
	var sel = window.getSelection();
	sel.collapseToStart();
	var t;
	$('#recipient').keyup(function(event){if(event.which==188)tokenize('recipient')});
	$('#collaborator').keyup(function(event){if(event.which==188)tokenize('collaborator')});
	$('body').keypress(function(){clearTimeout(t);t = setTimeout('save()', 10000);var s = document.getElementById('save');if(s.value == 'Saved'){s.disabled=false; s.value = 'Save';}});
	$("#optionMenu").mouseover(function(){document.getElementById('hiddenMenu').style.display='block';});
	$("#optionMenu").mouseout(function(){document.getElementById('hiddenMenu').style.display='none';});
	$(".menuItem").mouseover(function(){$(this).css("background-color", "#bbb");});
	$(".menuItem").mouseout(function(){$(this).css("background-color", "#ddd");});
	$(".charSuggest").mouseover(function(event){
										 document.getElementById('focus').removeAttribute('id');
										 event.target.id = 'focus';});
	$("#textEditor").click(function(event) {
						if(event.target.className=='notes'){selectNote(event.target);return;}
						getFormat();
						var a = document.getElementById('suggest')
						if(a!=null) a.parentNode.removeChild(a);
						});  
	$("#textEditor").keydown(function(event) {
									  if(event.which==13 && document.getElementById('focus')!=null){event.preventDefault(); charSelect(event);document.getElementById('hidden').innerHTML='1';}
									  if(event.which==9) tabButton(event);
									  if(document.getElementById('suggest')!=null){
										  if(event.which==38 || event.which==40){
											  suggestNav(event);
											  }
									  }
									  });
	$("#textEditor").keyup(function(event) {
									
									  var node = window.getSelection().anchorNode;
									  var startNode = (node.nodeName == "#text" ? node.parentNode : node);
									  var c = startNode.nodeName;
									  
									  if (startNode.className=='notes'){
										  if(startNode.innerHTML!='' && startNode.innerHTML!='X'){
											  startNode.innerHTML ='X';
										  }
									  }
									  if(event.which==8){getFormat(); notesIndex();}
									  if(document.getElementById('suggest')!=null){
										  if(event.which==38 || event.which==40){
											  event.preventDefault();
											  return;
											  }
										  }
									  
									  if (c!='H3'){var e = document.getElementById('suggest'); if (e!=null){e.parentNode.removeChild(e);}}
									  if(event.which==13){
										if(document.getElementById('hidden').innerHTML=='1'){
											event.preventDefault();
											document.getElementById('hidden').innerHTML="0";
										}
										else{enterButton(event);}}
									  else if (c == "H1") {sceneIndex();if(event.which!=38 && event.which!=40 && event.which!=39 && event.which!=37 && event.which!=91 && event.which!=93 && event.which!=16 && event.which!=8 && event.which!=34 && event.which!=17)characterSuggest(startNode);}
									  else if (c == 'H3'){if(event.which!=38 && event.which!=40 && event.which!=39 && event.which!=37 && event.which!=91 && event.which!=93 && event.which!=16 && event.which!=8 && event.which!=34 && event.which!=17)characterSuggest(startNode);}
									  
									  
										  getFormat();
									  });
	/*
	// Saving Short Cut
	// get OS and set ctrl number
	var ctrlNum=17;
	if (navigator.appVersion.indexOf("Win")!=-1) ctrlNum=17;
	if (navigator.appVersion.indexOf("Mac")!=-1) ctrlNum=91;
	if (navigator.appVersion.indexOf("X11")!=-1) ctrlNum=17;
	if (navigator.appVersion.indexOf("Linux")!=-1) ctrlNum=17;
	
	var isCtrl = false;
	//Actually saving
	$(document).keyup(function (e) {
		if(e.which == ctrlNum) isCtrl=false;
		}).keydown(function (e) {
		if(e.which == ctrlNum) isCtrl=true;
		if(e.which == 83 && isCtrl == true) {
			save();
			return false;
		}
	});
	// Control key has differant numbers on mac, so doubleing up.
	if(ctrlNum==91){
		$(document).keyup(function (e) {
		if(e.which == 93) isCtrl=false;
		}).keydown(function (e) {
		if(e.which == 93) isCtrl=true;
		if(e.which == 83 && isCtrl == true) {
			save();
			return false;
		}
	});
		}
		
		//Printing to pdf
	$(document).keyup(function (e) {
		if(e.which == ctrlNum) isCtrl=false;
		}).keydown(function (e) {
		if(e.which == ctrlNum) isCtrl=true;
		if(e.which == 80 && isCtrl == true) {
			exportAs('pdf');
			return false;
		}
	});
	
	//Set Shortcuts in Options menu
	var controlkey = 'Ctrl+';
	if(ctrlNum == 91) controlkey = '⌘';
	document.getElementById('saveShortcut').innerHTML = controlkey + 'S';
	document.getElementById('printShortcut').innerHTML = controlkey + 'P';
	*/
	
	
	///// set notes to correct class name
	var span = document.getElementsByTagName('span');
	for (var z=0; z<span.length; z++){
		if (span[z].className=='notes'){
			span[z].innerHTML = 'X';
		}
	}
	
	
	var c = $(':header');
	if (c[0]!=null){
	for (var i = 0; i<c.length; i++)
	{c[i].innerHTML = c[i].innerHTML.replace(/^\s+|\s+$/g,"");}}
	characterIndex();
	pagination();
    var $button = $("#sidebarButton");
    var $sidebar = $("#effect");
    var $container = $("#container");
	var $info = $("#info");
    
    $sidebar.animate({marginRight:'+=360px'},600);
    $container.animate({right:'+=360px'},600);
	$info.animate({right:'+=360px'},600);
    $button.toggle(
                   function()
                   {
                      $sidebar.animate({marginRight:'-=360px'},600);
                      $container.animate({right:'-=360px'},600);
					  $info.animate({right:'-=360px'},600);
    
                   },
                   function()
                   {
                       $sidebar.animate({marginRight:'+=360px'},600);
                       $container.animate({right:'+=360px'},600);
					   $info.animate({right:'+=360px'},600);
                   });
	
	try{
        $('.sm').attr('id', 'sm');
        $('#container').scrollTo('#sm', 800);
        $('.sm').removeAttr('id').removeClass('sm');
        }
    catch(err){;}
	try{
		sceneIndex();
		getFormat();
	}
	catch(err){;}
	if(resource_id!='demo'){save();}
	else{document.getElementById('demo').appendChild(document.createTextNode('demo'));}
	document.getElementById('loading').style.visibility = 'hidden';
	
};
