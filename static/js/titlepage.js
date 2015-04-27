var resource_id = window.location.href.split('=')[1];
var fadeTimeout;

$( document ).ready(function() {
    $('#save').click(function(){save()});
    var $textarea = $("textarea");
    var originalStyles = {
        borderColor: $textarea.css('border-color')
    }
    $(document).mousemove(function(){restyleTextAreas(originalStyles)});
    fadeTimeout = setTimeout(fadeInputBorders(), 3000);
});

function save() {
    $('#save').prop("disabled", true).val("Saving...");
    var postData = {
        resource_id: resource_id,
        titleData: $("#title-input").val(),
        middleData: $("#middle-input").val(),
        leftData: $("#left-input").val(),
        rightData: $("#right-input").val()
    }
    $.post('/titlepagesave', postData, function(response){
        $('#save').val("Saved");
        console.log(response);
    });
};

function fadeInputBorders() {
    var div = $('textarea');
    $({alpha:1}).animate({alpha:0}, {
        duration: 3000,
        step: function(){
            div.css('border-color','rgba(204, 204, 204,'+this.alpha+')');
        }
    });

}

function restyleTextAreas(styles) {
    $('textarea').css(styles);
    clearTimeout(fadeTimeout);
    fadeTimeout = setTimeout(fadeInputBorders(), 3000);
}
