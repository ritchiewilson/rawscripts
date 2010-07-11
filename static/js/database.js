// JavaScript Document


var databaseName = 'RawScripts';
var version = '1.0';
var displayName = 'RawScripts Local Storage';
var expectedSize = 1000000;

var database = openDatabase(databaseName, version, displayName, expectedSize);

database.transaction(newUserTable);



function newUserTable(tx){
	var SQL = 'CREATE Table '+username+' (id integer, resouce_id TEXT, server_status TEXT, server_timestamp DATETIME, local_timestamp';
	tx.executeSql(SQL);
}


function updateUserTable(tx){
	var SQL = "INSERT INTO "+username
}