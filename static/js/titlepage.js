var resource_id = window.location.href.split('=')[1];
var styleTimer;
$( document ).ready(function() {
    $('#save').click(function(){save()});
    $("#page, textarea").hover(function(){restyleTextAreas()});
    styleTimer = setTimeout(removeBorders, 5000);
    $("textarea").on("change keypress keydown", function(){
        $("#save").prop("disabled", false).val("Save");
    })
});

function save() {
    $('#save').prop("disabled", true).val("Saving...");
    var postData = {
        resource_id: resource_id,
        title: $("#title-input").val(),
        written_by: $("#written-by-input").val(),
        contact: $("#contact-input").val(),
    }
    $.post('/titlepagesave', postData, function(response){
        $('#save').val("Saved");
    });
};

function removeBorders() {
    if ($("textarea").is(":focus"))
        return;
    $('textarea').addClass('simplebox');
}

function restyleTextAreas(styles) {
    $('textarea').removeClass('simplebox');
    clearTimeout(styleTimer);
    styleTimer = setTimeout(removeBorders, 5000);
}
