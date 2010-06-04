// Onload - a big init file setting up jquery and everything
function editorinit(resource_id)
{	
	htmlTitleUpdate();
	infoSizes('init');
	console.log('after notes index');
	notesIndex();
	console.log('afternotes index');
	totalPages();
	$('#textEditor').click(function(){currentPage()});
	$('#textEditor').bind("contextmenu", function(e){insertNote(e); return false;});
	$('.infoHandle').mousedown(function(e){trackMouseDown(e)});
	$(window).mouseup(function(e){trackMouseUp(e)});
	$(window).mousemove(function(e){if(document.getElementById('mouseInfo').innerHTML.split('?')[0]=='down')infoResize(e);});
	$(window).resize(function(){infoSizes()});
	$('.postit').focusin(function(e){document.getElementById('format').disabled=true});
	$('.postit').focusout(function(e){document.getElementById('format').disabled=false});
	$('.postit').click(function(e){scrollToNote(e.target)});
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
	$("#optionMenu").mouseover(function(){document.getElementById('hiddenMenu').style.display='block';});
	$("#optionMenu").mouseout(function(){document.getElementById('hiddenMenu').style.display='none';});
	$(".menuItem").mouseover(function(){$(this).css("background-color", "#bbb");});
	$(".menuItem").mouseout(function(){$(this).css("background-color", "#ddd");});
	console.log('after jquery keydown functions');
	characterIndex();
	console.log('after cgaracter index');
	var $button = $("#sidebarButton");
    var $sidebar = $("#effect");
    var $container = $("#container");
	var $info = $("#info");
    console.log('right before animation');
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
	console.log('after animation');
	try{
		sceneIndex();
		getFormat();
	}
	catch(err){;}
	document.getElementById('loading').style.visibility = 'hidden';
	
	
};
