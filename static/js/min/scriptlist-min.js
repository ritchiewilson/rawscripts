function uploadWindow(a){if(a.data=="uploading"){document.getElementById("uploadFrame").height="0px";document.getElementById("uploadFrame").width="0px";document.getElementById("uploading").style.display="block"}else{document.getElementById("uploadFrame").style.height="210px";document.getElementById("uploadFrame").style.width="250px";document.getElementById("uploading").style.display="none";window.open("editor?resource_id="+a.data);refreshList()}}function tabs(a){var d=document.getElementsByTagName("input");for(var b=0;b<d.length;b++){if(d[b].type=="checkbox"){d[b].checked=false}}if(a=="myScripts"){document.getElementById("owned").style.display="block";document.getElementById("shared").style.display="none"}else{document.getElementById("owned").style.display="none";document.getElementById("shared").style.display="block"}}function refreshList(a){$.post("/list",function(u){console.log(u);document.getElementById("loading").style.display="none";var e=document.getElementById("content").childNodes;for(var q=0;q<e.length;q++){e[q].parentNode.removeChild(e[q]);q--}var l=document.getElementById("content").appendChild(document.createElement("div"));l.id="list";var k=JSON.parse(u);if(k.length==0){document.getElementById("noentries").style.display="block";return}for(var q=0;q<k.length;q++){var v=k[q][1];var d=k[q][0];var t=k[q][2];var g=l.appendChild(document.createElement("div"));g.id=d;g.className="entry";var r=g.appendChild(document.createElement("table"));r.width="100%";var p=r.appendChild(document.createElement("tr"));var b=p.appendChild(document.createElement("td"));b.className="checkboxCell";var n=b.appendChild(document.createElement("input"));n.type="checkbox";n.name="listItems";n.value=d;var c=p.appendChild(document.createElement("td"));var j=c.appendChild(document.createElement("a"));j.id="name"+d;var s='javascript:script("'+d+'")';j.href=s;j.appendChild(document.createTextNode(v));var f=p.appendChild(document.createElement("td"));f.className="sharedCell";f.align="right";var o=p.appendChild(document.createElement("td"));o.className="emailCell";o.align="center";var h=o.appendChild(document.createElement("a"));h.className="emailLink";s='javascript:emailPrompt("'+d+'")';h.href=s;h.appendChild(document.createTextNode("Email"));var m=p.appendChild(document.createElement("td"));m.className="updatedCell";m.align="center";m.appendChild(document.createTextNode(t))}if(a){sharePrompt(a)}})}function tokenize(f){var j=0;var u=document.getElementsByTagName("div");for(var q=0;q<u.length;q++){if(u[q].className=="token"){j++}}if(j>4){alert("You can only have 5 recipients at a time for now. Only the first five will be sent.");return}var a=document.getElementById(f);var v=a.value.replace(",","");var s=v.replace(/ /g,"");if(s==""){return}var b=v.split(" ");var o=b.pop();var w="";if(b.length==0){w=o}else{w=b.join(" ").replace(/"/g,"")}var d=document.createElement("div");var h=document.getElementById(f+"s").appendChild(d);h.className="token";h.id=o;var e=document.createElement("span");var t=h.appendChild(e);var n=document.createTextNode(w);t.appendChild(n);var e=document.createElement("span");var p=h.appendChild(e);var l=document.createTextNode(o);p.className="mailto";p.appendChild(l);var g=document.createElement("a");var k=h.appendChild(g);var r=document.createTextNode(" | X");k.appendChild(r);var m='javascript:removeToken("'+o+'")';k.setAttribute("href",m);a.value=""}function removeToken(a){var b=document.getElementById(a);b.parentNode.removeChild(b)}function selectAll(d,e){var c=document.getElementsByTagName("input");var a=d.checked;for(var b=0;b<c.length;b++){if(c[b].type=="checkbox"){if(c[b].name==e){c[b].checked=a}}}}function script(a){url="/editor?resource_id="+a;window.open(url)}function deleteScript(b){var a=document.getElementById(b);a.style.backgroundColor="#ccc";a.style.opacity="0.5";$.post("/delete",{resource_id:b},function(){a.parentNode.removeChild(a)})}function batchProcess(a){var c=document.getElementsByTagName("input");for(var b=0;b<c.length;b++){if(c[b].type=="checkbox"){if(c[b].checked==true){if(c[b].name=="listItems"||c[b].name=="sharedListItems"){if(a=="delete"){deleteScript(c[b].value)}}}}}}function emailComplete(a){document.getElementById("emailS").disabled=false;document.getElementById("emailS").value="Send";if(a=="sent"){alert("Email Sent");hideEmailPrompt()}else{alert("There was a problem sending your email. Please try again later.")}}function emailScript(){tokenize("recipient");var b=new Array();var g=document.getElementsByTagName("span");for(var e=0;e<g.length;e++){if(g[e].className=="mailto"){b.push(g[e].innerHTML)}}var a=b.join(",");var d=document.getElementById("subject").value;var f=document.getElementById("message").innerHTML;$.post("/emailscript",{resource_id:resource_id,recipients:a,subject:d,body_message:f,fromPage:"scriptlist"},function(c){emailComplete(c)});document.getElementById("emailS").disabled=true;document.getElementById("emailS").value="Sending..."}var resource_id="";function emailPrompt(a){resource_id=a;document.getElementById("emailpopup").style.visibility="visible"}function hideEmailPrompt(){document.getElementById("emailpopup").style.visibility="hidden";document.getElementById("recipient").value="";document.getElementById("subject").value="";document.getElementById("message").innerHTML="";document.getElementById("recipients").innerHTML=""}function renamePrompt(){var a=0;var c=document.getElementsByTagName("input");for(var b=0;b<c.length;b++){if(c[b].type=="checkbox"){if(c[b].checked==true){if(c[b].name=="listItems"){var d=c[b].value;a++}}}}if(a>1){alert("select one at a time")}else{if(a==1){var e="name"+d;document.getElementById("renameTitle").innerHTML="Rename "+document.getElementById(e).innerHTML;document.getElementById("renameField").value=document.getElementById(e).innerHTML;document.getElementById("renamepopup").style.visibility="visible";document.getElementById("resource_id").value=d}}}function hideRenamePrompt(){document.getElementById("renameField").value="";document.getElementById("renamepopup").style.visibility="hidden"}function renameScript(){var b=document.getElementById("resource_id").value;var a=document.getElementById("renameField").value;if(a==""){return}var c="name"+b;document.getElementById(c).innerHTML=a;$.post("/rename",{resource_id:b,rename:a,fromPage:"scriptlist"});hideRenamePrompt()}function uploadPrompt(){document.getElementById("uploadpopup").style.visibility="visible"}function hideUploadPrompt(){document.getElementById("uploadFrame").src="/convert";document.getElementById("uploadpopup").style.visibility="hidden"}function titleChange(){var a=document.getElementById("script").value;var b=a.replace(".celtx","");document.getElementById("hidden").value=b}function uploadScript(){var b=document.getElementById("script").files[0].getAsBinary();var a=document.getElementById("filename");$.post("/convertprocess",{script:b,filename:a})}function newScriptPrompt(){document.getElementById("newscriptpopup").style.visibility="visible"}function hideNewScriptPrompt(){document.getElementById("newScript").value="";document.getElementById("newscriptpopup").style.visibility="hidden"}function createScript(){var a=document.getElementById("newScript").value;if(a!=""){$.post("/newscript",{filename:a},function(b){window.open("editor?resource_id="+b)})}hideNewScriptPrompt();setTimeout("refreshList()",10000)}function recieveMessage(a){}function hideExportPrompt(){document.getElementById("exportpopup").style.visibility="hidden";document.getElementById("exportList").innerHTML=""}function exportPrompt(){var a=0;var b=document.getElementsByTagName("input");for(var d=0;d<b.length;d++){if(b[d].type=="checkbox"){if(b[d].checked==true){if(b[d].name=="listItems"||b[d].name=="sharedListItems"){var h=document.createElement("tr");var j=document.getElementById("exportList").appendChild(h);var k=j.appendChild(document.createElement("td"));var c=document.createTextNode(document.getElementById("name"+b[d].value).innerHTML);k.appendChild(c);k=j.appendChild(document.createElement("td"));var g=document.createElement("select");var f=k.appendChild(g);f.name=b[d].value;var e=f.appendChild(document.createElement("option"));e.appendChild(document.createTextNode("Adobe PDF"));e=f.appendChild(document.createElement("option"));e.appendChild(document.createTextNode(".txt (for Celtx or FD)"));a++}}}}if(a>0){document.getElementById("exportpopup").style.visibility="visible"}}function exportScripts(){var d;var c;var a=document.getElementsByTagName("select");for(var b=0;b<a.length;b++){d=a[b].name;if(a[b].selectedIndex==0){c="pdf"}else{c="txt"}url="/export?resource_id="+d+"&export_format="+c+"&fromPage=scriptlist";window.open(url)}hideExportPrompt()}function removeAccess(b){var a=confirm("Are you sure you want to take away access from "+b+"?");if(a==true){var c=document.getElementById("shareResource_id").value;$.post("/removeaccess",{resource_id:c,fromPage:"scriptlist",removePerson:b},function(d){removeShareUser(d)});document.getElementById("shared"+b.toLowerCase()).style.opacity="0.5";document.getElementById("shared"+b.toLowerCase()).style.backgroundColor="#ddd"}}function removeShareUser(a){document.getElementById("shared"+a).parentNode.removeChild(document.getElementById("shared"+a));refreshList()}function sharePrompt(h){document.getElementById("shareS").disabled=false;document.getElementById("shareS").value="Send Invitation";var c=document.getElementById("share"+h).title.split("&");var d=document.getElementById("hasAccess");document.getElementById("collaborator").value="";document.getElementById("collaborators").innerHTML="";d.innerHTML="";for(var f=0;f<c.length;f++){if(c[f]!="none"){var j=d.appendChild(document.createElement("tr"));j.id="shared"+c[f].toLowerCase();var e=j.appendChild(document.createElement("td"));e.appendChild(document.createTextNode(c[f]));var g=j.appendChild(document.createElement("td"));g.align="right";var a=g.appendChild(document.createElement("a"));a.appendChild(document.createTextNode("Remove Access"));var b="javascript:removeAccess('"+c[f]+"')";a.href=b}}document.getElementById("shareTitle").innerHTML=document.getElementById("name"+h).innerHTML;document.getElementById("sharepopup").style.visibility="visible";document.getElementById("shareResource_id").value=h}function hideSharePrompt(){document.getElementById("sharepopup").style.visibility="hidden";document.getElementById("collaborator").value="";document.getElementById("collaborators").innerHTML="";document.getElementById("hasAccess").innerHTML=""}function shareScript(){tokenize("collaborator");var a=new Array();var f=document.getElementsByTagName("span");for(var b=0;b<f.length;b++){if(f[b].className=="mailto"){a.push(f[b].innerHTML)}}var e=a.join(",");var d=document.getElementById("shareResource_id").value;$.post("/share",{resource_id:d,collaborators:e,fromPage:"scriptlist"},function(c){refreshList(d)});document.getElementById("shareS").disabled=true;document.getElementById("shareS").value="Sending Invites..."};