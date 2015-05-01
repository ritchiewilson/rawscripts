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
    // first validate each field
    var all_valid = true;
    $('textarea').each(function(){
        var max_rows = $(this).prop('rows');
        var val = $(this).val();
        var linecount = (val.match(/\n/g) || []).length + 1;
        var this_valid = (linecount <= max_rows && val.length < 64 * max_rows);
        all_valid = (all_valid && this_valid)
    });
    if (!all_valid){
        alert('ERROR: There is too much text in one of the fields.');
        return;
    }
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
