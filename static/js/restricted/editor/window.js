/* Closure Compiler for JS changes all function
 * names. To have human readable function names
 * in the html, need to attach those functions
 * to the window object; as done here.
 */
window['markAsRead'] = markAsRead;
window['newMessage'] = newMessage;
window['deleteMessage'] = deleteMessage;
window['deleteThread'] = deleteThread;
window['EOV'] = EOV;
window['changeFormat'] = changeFormat;
window['deleteThread'] = deleteThread;
window['newThread'] = newThread;
window['tabs'] = tabs;
window['exportScripts'] = exportScripts;
window['hideExportPrompt'] = hideExportPrompt;
window['renameScript'] = renameScript;
window['hideRenamePrompt'] = hideRenamePrompt;
window['renamePrompt'] = renamePrompt;
window['hideNewScriptPrompt'] = hideNewScriptPrompt;
window['createScript'] = createScript;
window['hideSpellCheck'] = hideSpellCheck;
window['s_change'] = s_change;
window['s_ignore'] = s_ignore;
window['s_ignore_all'] = s_ignore_all;
window['replaceAndFind'] = replaceAndFind;
window['replaceText'] = replaceText;
window['hideFindReplacePrompt'] = hideFindReplacePrompt;
window['hideFindPrompt'] = hideFindPrompt;
window['findUp'] = findUp;
window['findDown'] = findDown;
window['shareScript'] = shareScript;
window['hideSharePrompt'] = hideSharePrompt;
window['hideEmailPrompt'] = hideEmailPrompt;
window['emailScript'] = emailScript;
window['save'] = save;
window['setJustPasted'] = setJustPasted;
window['paint'] = paint;
window['init'] = init;
window['paste'] = paste;
window['cut'] = cut;
window['emailNotifyShare'] = emailNotifyShare;
window['emailNotifyMsg'] = emailNotifyMsg;
window['removeAccess'] = removeAccess;
window['selection'] = selection;
window['requestAnimFrame'] = requestAnimFrame;

// shim layer with setTimeout fallback
var requestAnimFrame = (function(){
	return  window['requestAnimationFrame']       || 
			window['webkitRequestAnimationFrame'] || 
			window['mozRequestAnimationFrame']    || 
			window['oRequestAnimationFrame']      || 
			window['msRequestAnimationFrame']     || 
			function(/* function */ callback, /* DOMElement */ element){
				window.setTimeout(callback, 1000 / 60);
			};
	})();