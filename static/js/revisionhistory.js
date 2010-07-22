$(document).ready(function(){
    document.getElementById('script').style.height = $('#container').height()-65+'px';
    document.getElementById('script').style.width = $('#container').width()-350+'px';
    document.getElementById('sidebar').style.height = ($('#container').height()-65)+'px';
    //document.getElementById('sidebar').style.width = ($('#container').width()-855)+'px';
    $(':radio').click(function(){radioClick(this)});
  });
  $(window).resize(function(){
    document.getElementById('script').style.height = $('#container').height()-65+'px';
    document.getElementById('script').style.width = $('#container').width()-350+'px';
    document.getElementById('sidebar').style.height = ($('#container').height()-65)+'px';
    //document.getElementById('sidebar').style.width = ($('#container').width()-855)+'px';
  });
  

function setup(){
    resource_id=window.location.href.split('=')[1];
    var c= document.getElementsByTagName('input');
    var v=c[c.length-1].value.substr(1);
    if(v!='1'){
        $.post('/revisionlist', {resource_id:resource_id, version:v}, function(data){buildTable(data)});
    }
    var c = document.getElementsByTagName('input');
    var found1 = 0;
    var found2 = false;
    for(i in c){
        if(c[i].type=='radio' && c[i].value.substr(0,1)==2){
            if(!found2){
                c[i].checked=true;
                found2=true;
                var v_o=c[i].value;
                var d=c[i];
                while(d.nodeName!="TR")d=d.parentNode;
                var r_o = d.id;
            }
            else{
                c[i].disabled=true;
                c[i].style.visibility='hidden';
            }
        }
        else if(c[i].type=='radio' && c[i].value.substr(0,1)==1){
            if(found1==0){
                c[i].disabled=true;
                c[i].style.visibility='hidden';
                found1++
            }
            else if(found1==1){
                c[i].checked=true;
                found1++;
                var v_t=c[i].value;
                var d=c[i];
                while(d.nodeName!="TR")d=d.parentNode;
                var r_t = d.id;
            }
        }
    }
    compareVersions(v_o, r_o, v_t, r_t);
}
function radioSetup(){
    var c= document.getElementsByTagName('input');
    var one_checked=false;
    var two_checked=false;
    var one=false;
    for(i in c){
        if(c[i].type=='radio'){
            if(c[i].checked && c[i].value.substr(0,1)==1)one_checked=true;
            if(c[i].checked && c[i].value.substr(0,1)==2)two_checked=true;
            if(!one){
                c[i].disabled=true;
                c[i].style.visibility='hidden';
                one=true
            }
            else if((!one_checked && c[i].value.substr(0,1)==2)){
                c[i].disabled=false;
                c[i].style.visibility='visible';
                
            }
            else if(two_checked && c[i].value.substr(0,1)==1){
                c[i].disabled=false;
                c[i].style.visibility='visible';
                
            }
            else{
                c[i].disabled=true;
                c[i].style.visibility='hidden';
            }
        }
    }
}
function radioClick(obj){
    if(document.getElementById('sel').selectedIndex==1){
        var c = document.getElementsByTagName('input');
        for (i in c){
            if(c[i].type=='radio'){
                if(c[i].parentNode.className=='viewScript')c[i].checked=false;
            }
        }
        obj.checked=true;
        c=obj;
        while(c.nodeName!='TR'){
            c=c.parentNode;
        }
        changeVersion(obj.value, c.id);
    }
    else{
        var col = obj.value.substr(0,1);
        var c = document.getElementsByTagName('input');
        for (i in c){
            if(c[i].type=='radio' && c[i].value.substr(0,1)==col)c[i].checked=false;
            if(c[i].type=='radio' && c[i].value.substr(0,1)!=col && c[i].checked){
                var version_two=c[i].value;
                var tmp=c[i];
                while(tmp.nodeName!="TR")tmp=tmp.parentNode;
                version_two_id=tmp.id;
            }
        }
        obj.checked=true;
        tmp=obj
        while(tmp.nodeName!="TR")tmp=tmp.parentNode;
        version_one_id=tmp.id;
        compareVersions(obj.value,version_one_id, version_two, version_two_id);
        radioSetup()
    }
}
function buildTable(d){
    var tb= document.getElementById('tb');
    var data = JSON.parse(d);
    for(i in data){
        var TR = tb.appendChild(document.createElement('tr'));
        TR.id=data[i][0];
        TR.className = (data[i][3]==0 ? 'manualsave' : 'autosave')
        //first radio
        var cell=TR.appendChild(document.createElement('td'));
        cell.align='center';
        cell.className='viewScript';
        var rad = cell.appendChild(document.createElement('input'));
        rad.type='radio';
        rad.value='1'+data[i][2];
        //second radio
        cell=TR.appendChild(document.createElement('td'));
        cell.align='center';
        cell.className='compare';
        rad = cell.appendChild(document.createElement('input'));
        rad.type='radio';
        rad.value='2'+data[i][2];
        rad.disabled=true;
        rad.style.visibility='hidden';
        //version
        cell=TR.appendChild(document.createElement('td'));
        cell.align='center';
        cell.appendChild(document.createTextNode(data[i][2]));
        //timestamp
        cell=TR.appendChild(document.createElement('td'));
        cell.align='center';
        cell.appendChild(document.createTextNode(data[i][1]));
        //copy
        cell=TR.appendChild(document.createElement('td'));
        cell.align='center';
        var a=cell.appendChild(document.createElement('a'));
        a.appendChild(document.createTextNode('Copy to new script'));
        a.href="javascript:copyThisVersion("+data[i][2]+")";
        a.id = data[i][2];
        
    }
    $(':radio').unbind('click');
    $(':radio').click(function(){radioClick(this)});
}
function changeVersion(v, r){
    $.post('/revisionget', {resource_id:r, version:String(v).substr(1)}, function(data){
    if(data=='not found'){
    }
    document.getElementById('scriptcontent').innerHTML = data;
    });
}

function compareVersions(v_one, v_one_id, v_two, v_two_id){
    var v_o = (v_one>v_two ? v_two : v_one);
    var v_t = (v_one<v_two ? v_two : v_one);
    var v_o_id = (v_one>v_two ? v_two_id : v_one_id);
    var v_t_id = (v_one<v_two ? v_two_id : v_one_id);
    $.post('/revisioncompare', {v_o:v_o.substr(1), v_o_id:v_o_id, v_t:v_t.substr(1), v_t_id:v_t_id}, function(data){
    if(data=='not found'){
    }
    document.getElementById('scriptcontent').innerHTML = data;
    context();
    });
}

function context(){
    var c = document.getElementById('scriptcontent').childNodes;
    if(document.getElementById('con').selectedIndex==1){
        var block=false;
        for (i in c){
            if (c[i].nodeName=="DEL" || c[i].nodeName=="INS"){
                if(c[i].innerHTML=="")c[i].parentNode.removeChild(c[i])
                else{block=12;}
            }
            else if (c[i].nodeName=="P"){
                var d = c[i].childNodes;
                for (j in d){
                    if(d[j].nodeName=="DEL" || d[j].nodeName=="INS"){
                        if(d[j].innerHTML=="")d[j].parentNode.removeChild(d[j])
                        else{block=12;}
                    }
                }
            }
            if(!block && c[i].nodeName!="#text" && c[i].style!=undefined){
                c[i].style.display="none";
            }
            if(block==12 && c[i].nodeName!="#text"){
                var t = i-1;
                var count = 0;
                while(count<12){
                    while(c[t]!=undefined && c[t].nodeName=="#text")t--;
                    if(c[t]==undefined){
                        count=13;
                    }
                    else{
                        c[t].style.display='block';
                        t--;
                        count++;
                    }
                }
            }
            if(block!=false && block<13){
                if(c[i].style!=undefined){
                    c[i].style.display="block";
                    block--;
                }
                if (block<0)block=false;
            }
        }
        block='none';
        for (i in c){
            if(c[i].style!=undefined){
                if(block=='block' && c[i].style.display=='none'){
                    block='none';
                    document.getElementById('scriptcontent').insertBefore(document.createElement('hr'),c[i])
                }
                if (c[i].style.display=='block')block='block';
            }
        }
    }
    else{
        for (i in c){
            if(c[i].nodeName=="HR"){
                c[i].parentNode.removeChild(c[i]);
            }
            else if(c[i].style!=undefined){
                c[i].style.display='block';
            }
        }
    }
}

function compareToggle(v){
    if(v==0){
        $('.compare').css('display' , 'block');
        radioSetup();
        var c = document.getElementsByTagName('input');
        for (i in c){
            if(c[i].type=='radio'){
                if(c[i].type=='radio' && c[i].checked){
                    if(c[i].value.substr(0,1)==1){
                        var v_o=c[i].value;
                        var d= c[i];
                        while(d.nodeName!="TR")d=d.parentNode;
                        var r_o=d.id;
                    }
                    if(c[i].value.substr(0,1)==2){
                        var v_t=c[i].value;
                        var d= c[i];
                        while(d.nodeName!="TR")d=d.parentNode;
                        var r_t=d.id;
                    }
                }
            }
        }
        compareVersions(v_o, r_o, v_t, r_t);
        document.getElementById('key').style.display='block';
    }
    if(v==1){
        $('.compare').css('display' , 'none');
        var c = document.getElementsByTagName('input');
        for (i in c){
            if(c[i].type=='radio'){
                c[i].disabled=false;
                c[i].style.visibility='visible';
                if(c[i].type=='radio' && c[i].checked && c[i].value.substr(0,1)==1){
                    var v=c[i].value;
                    var d= c[i];
                    while(d.nodeName!="TR")d=d.parentNode;
                    var r=d.id;
                }
            }
        }
        changeVersion(v,r)
        document.getElementById('key').style.display='none';
    }
}

function copyThisVersion(v){
    console.log(v)
    var d = document.getElementById(v);
    while (d.nodeName!='TR')d=d.parentNode;
    console.log(d.id);
    $.post('/revisionduplicate', {resource_id:d.id, version:v}, function(d){
        window.open(d);
    });
}



function toggleAutosave(v){
    var c = document.getElementsByTagName('tr');
    if(v){
        for (i in c){
            if (c[i].className=='autosave')c[i].style.display='none';
        }
    }
    else{
        for (i in c){
            if (c[i].className=='autosave'){
                c[i].style.display='table-row';
            }
        }
    }
}

// duplicate
function duplicate(){
    $.post('/duplicate',
     {resource_id : resource_id, fromPage : 'editor'}, 
     function(d){
        if (d=='fail')return;
        else{window.open(d)}
     });
}

//exporting
function exportPrompt(){
    document.getElementById("exportpopup").style.visibility="visible"
}
function hideExportPrompt(){
    typeToScript=true;
    document.getElementById("exportpopup").style.visibility="hidden";
}
function exportScripts(){
    var b=window.location.href;
    var resource_id=b.split("=")[1];
    if (resource_id=='demo'){
        nope();
        return;
    }
    else{
        var d;
        var title="&title_page="+document.getElementById('et').selectedIndex;
        var a=document.getElementsByTagName("input");
        for(var c=0;c<a.length;c++){
            if(a[c].checked==true){
                if(a[c].className=="exportList"){
                    d=a[c].name;
                    b="/export?resource_id="+resource_id+"&export_format="+d+"&fromPage=editor"+title;
                    window.open(b)
                }
            }
        }
    }
}
