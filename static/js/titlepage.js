var resource_id = window.location.href.split('=')[1];

$( document ).ready(function() {
    $('#save').click(function(){save()});
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
