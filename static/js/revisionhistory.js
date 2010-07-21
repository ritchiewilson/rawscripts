$(document).ready(function(){
    document.getElementById('script').style.height = $('#container').height()-65+'px';
    document.getElementById('script').style.width = $('#container').width()-300+'px';
    document.getElementById('sidebar').style.height = ($('#container').height()-65)+'px';
    //document.getElementById('sidebar').style.width = ($('#container').width()-855)+'px';
    $(':radio').click(function(){radioClick(this)});
    var c = document.getElementsByTagName('input');
    var found = false;
    for(i in c){
        if(!found){
            if(c[i].type=='radio'){
                c[i].checked=true;
                found=true;
            }
        }
    }
  });
  $(window).resize(function(){
    document.getElementById('script').style.height = $('#container').height()-65+'px';
    document.getElementById('script').style.width = $('#container').width()-300+'px';
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
    $.post('/revisionget', {resource_id:resource_id, version:'latest'}, function(data){
    if(data=='not found'){
    }
    document.getElementById('scriptcontent').innerHTML = data;
    });
}

function radioClick(obj){
    if(document.getElementById('sel').selectedIndex==0){
        var c = document.getElementsByTagName('input');
        for (i in c){
            if(c[i].type=='radio' && c[i].parentNode.className=='viewScript')c[i].checked=false;
        }
        obj.checked=true;
        c=obj;
        while(c.nodeName!='TR'){
            c=c.parentNode;
        }
        console.log(c.id);
        changeVersion(obj.value, c.id);
    }
    else{
        var col = this.value.substr(0,1);
        var c = document.getElementsByTagName('input');
        for (i in c){
            if(c[i].type=='radio' && c[i].value.substr(0,1)==col)c[i].checked=false;
            if(c[i].type=='radio' && c[i].value.substr(0,1)!=col && c[i].checked)var vers=c[i].value;
        }
        this.checked=true;
        compareVersions(this.value, vers);
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
        //version
        cell=TR.appendChild(document.createElement('td'));
        cell.align='center';
        cell.appendChild(document.createTextNode(data[i][2]));
        //timestamp
        cell=TR.appendChild(document.createElement('td'));
        cell.align='center';
        cell.appendChild(document.createTextNode(data[i][1]));
        
    }
    $(':radio').click(function(){radioClick(this)});
}
function changeVersion(v, r){
    console.log(v,r)
    $.post('/revisionget', {resource_id:r, version:String(v).substr(1)}, function(data){
    if(data=='not found'){
    }
    document.getElementById('scriptcontent').innerHTML = data;
    });
}
function compareVersions(one, two){
    var arr = [one, two].sort();
    version_one=arr[0].substr(1),
    version_two=arr[1].substr(1)
    resource_id=window.location.href.split('=')[1];
    $.post('/revisioncompare', {resource_id:resource_id, version_one:version_one, version_two:version_two}, function(data){
    if(data=='not found'){
    }
    document.getElementById('scriptcontent').innerHTML = data;
    });
}

function compareToggle(v){
    console.log(v);
    if(v==1){
        $('.compare').css('display' , 'block');
        /*var c = document.getElementsByTagName('input');
        var arr=[];
        for (i in c){
            if(c[i].type=='radio' && c[i].checked)arr.push(c[i].value);
        }
        compareVersions(arr[0],arr[1])*/
    }
    if(v==0){
        $('.compare').css('display' , 'none');
        var c = document.getElementsByTagName('input');
        var arr=[];
        for (i in c){
            if(c[i].type=='radio' && c[i].checked)arr.push(c[i].value);
        }
        arr = arr.sort();
        changeVersion(arr[0])
    }
}

function copyThisVersion(){
    var c = document.getElementsByTagName('input')
    for (i in c){
        if(c[i].type=='radio' && c[i].value.substr(0,1)==1 && c[i].checked){
            var w=c[i].value;
            var d=c[i];
            while(d.nodeName!="TR"){d=d.parentNode}
        }
    }
    $.post('/revisionduplicate', {resource_id:d.id, version:w.substr(1)}, function(d){
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
