/*
	Node server for the videoapp.
	The server generates a unique room id when a user connects and allows the remotes to send data to the screen(s).
*/

var express = require( "express" ),
	app = express(),
	server = require( "http" ).Server( app ),
	io = require( "socket.io" )( server ),
	roomIdLength = 3,
	roomIdRegex = "[a-z0-9]{"+roomIdLength+"}";

server.listen( 1337 );
console.log( "server started on port 1337" );

// Serve static files
app.use( express.static( __dirname + "/static" ) );

// Show room select/create screen
app.get( "/", function ( req, res ) {
	var roomId = generateUniqueRoomId();
	if( roomId ) res.redirect( "/room/" + roomId );
	else res.status( 503 ).send( "Server is crowded, please try again later :)" );
});

// Show about page
app.get( "/about", function ( req, res ) {
	res.sendFile( __dirname + "/about.html" );
});

// Show public screen
app.get( "/room/:room("+roomIdRegex+")", function ( req, res ) {
		res.sendFile( __dirname + "/screen.html" );
});

// Show remote screen
app.get( "/add/:room("+roomIdRegex+")", function ( req, res ) {
	res.sendFile( __dirname + "/remote.html" );
});

// Communicate with clients
io.on( "connection", function ( socket ) {
	socket.room = socket.request.headers.referer.replace( "http://"+socket.request.headers.host+"/", "" ).split("/")[1];
	socket.join( socket.room );
	console.log( "A user connected to room "+socket.room );
	
	socket.on( "cueVideo", function ( id ) {
		socket.broadcast.to( socket.room ).emit( "cueVideo",  id );
		socket.emit( "addedVideo",  id );
		console.log( "User added video "+id+" to room "+socket.room );
	});
});

// Tries 10 times to generate a unique (not currently in use) room id of a length specified by roomIdLength
function generateUniqueRoomId() {
	var id = "";
	for(var i = 0; i < 10; i++) {
		var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
		for( var i=0; i < roomIdLength; i++ ) id += possible.charAt(Math.floor(Math.random() * possible.length));
		if( !io.sockets.adapter.rooms.hasOwnProperty( id ) ) return id;
	} 
	return false;
}