// JavaScript Document


var databaseName = 'RawScripts';
var version = '1.0';
var displayName = 'RawScripts Local Storage';
var expectedSize = 1000000;
var username= "rawilson52";
var database = openDatabase(databaseName, version, displayName, expectedSize);
var db = null;
 
try {
    if (window.openDatabase) {
        db = openDatabase("NoteTest", "1.0", "HTML5 Database API example", 200000);
        if (!db)
            alert("Failed to open the database on disk.  This is probably because the version was bad or there is not enough space left in this domain's quota");
    } else
        alert("Couldn't open the database.  Please try with a WebKit nightly with this feature enabled");
} catch(err) {
    db = null;
    alert("Couldn't open the database.  Please try with a WebKit nightly with this feature enabled");
}


function loaded()
{
    db.transaction(function(tx) {
        tx.executeSql("SELECT COUNT(*) FROM WebkitStickyNotes", [], function(result) {
            loadNotes();
        }, function(tx, error) {
            tx.executeSql("CREATE TABLE WebKitStickyNotes (id REAL UNIQUE, note TEXT, timestamp REAL, left TEXT, top TEXT, zindex REAL)", [], function(result) { 
                alert(result); 
            });
        });
    });
}

db.transaction(function(tx) {
	tx.executeSql("INSERT INTO WebkitStickyNotes (id, note, timestamp, left, top, zindex) VALUES (?,?,?,?,?,?)",[2,"stuff","stuff","left", "top", "zindex and stuff "]);
});
