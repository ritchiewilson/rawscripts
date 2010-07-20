$(document).ready(function(){
    document.getElementById('script').style.height = $('#container').height()-65+'px';
    document.getElementById('script').style.width = $('#container').width()-300+'px';
    document.getElementById('sidebar').style.height = ($('#container').height()-65)+'px';
    //document.getElementById('sidebar').style.width = ($('#container').width()-855)+'px';
    $(':radio').click(function(){
        if(document.getElementById('sel').selectedIndex==0){
            var c = document.getElementsByTagName('input');
            for (i in c){
                if(c[i].type=='radio' && c[i].value.substr(0,1)==1)c[i].checked=false;
            }
            this.checked=true;
            changeVersion(this.value);
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
    });
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
    $.post('/revisionget', {resource_id:resource_id, version:'latest'}, function(data){
    if(data=='not found'){
    }
    document.getElementById('scriptcontent').innerHTML = data;
    });
}
function changeVersion(v){
    resource_id=window.location.href.split('=')[1];
    $.post('/revisionget', {resource_id:resource_id, version:String(v).substr(1)}, function(data){
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




function topMenuOut(v){
    if(document.getElementById(v+'Menu').style.display=='none'){
        document.getElementById(v).style.backgroundColor='#A2BAE9';
        document.getElementById(v).style.color='black';
    }
}

//menu options and stuff
// closing the window

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
    save(0);
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
