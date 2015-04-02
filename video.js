var express = require( "express" );
var app = express();
var server = require( "http" ).Server( app );
var io = require( "socket.io" )( server );

server.listen( 1337 );
//console.log( "server started on port 1337" );

// Serve favicon with static
app.use( express.static( __dirname + "/static" ) );

// Show room select/create screen
app.get( "/", function ( req, res ) {
	var roomId = generateUniqueRoomId();
	if( roomId ) res.redirect( "/room/" + roomId );
	else res.status( 503 ).send( "Server might be full, please try again later :)" );
});

// Show public screen
app.get( "/room/:room([a-z0-9]{3})", function ( req, res ) {
		res.sendFile( __dirname + "/screen.html" );
});

// Show remote screen
app.get( "/add/:room([a-z0-9]{3})", function ( req, res ) {
	res.sendFile( __dirname + "/remote.html" );
});

// Communicate with clients 
io.on( "connection", function ( socket ) {
	socket.room = socket.request.headers.referer.replace( "http://"+socket.request.headers.host+"/", "" ).split("/")[1];
	socket.join( socket.room );
	//console.log( "a user connected to room "+socket.room );
	
	socket.on( "cueVideo", function ( id ) {
		socket.broadcast.to( socket.room ).emit( "cueVideo",  id );
		socket.emit( "addedVideo",  id );
		//console.log( "user added video "+id+" to room "+socket.room );
	});
});

// Tries 100 times to generate a unique room id of 3 characters
function generateUniqueRoomId() {
	var id = "";
	for(var i = 0; i < 100; i++) {
		var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
		for( var i=0; i < 3; i++ ) id += possible.charAt(Math.floor(Math.random() * possible.length));
		if( !io.sockets.adapter.rooms.hasOwnProperty( id ) ) return id;
	} 
	return false;
}