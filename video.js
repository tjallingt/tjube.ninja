/*
	Node server for Tjube.Ninja.
	The server generates a unique room id when a user connects and allows the remotes to send data to the screen(s).
*/
var PORT = 1337;
var express = require( "express" );
var bodyParser = require( "body-parser" );
var mustache = require( "mustache-express" );
var app = express();
var server = require( "http" ).Server( app );
var io = require( "socket.io" )( server );
var roomIdLength = 3;
var roomIdRegex = "[a-z0-9]{"+roomIdLength+"}";

server.listen( PORT );
console.log( "server started on port " + PORT );

// Serve static files
app.use( express.static( __dirname + "/views" ) );
app.use( express.static( __dirname + "/static" ) );

// Use mustache to render html 
app.engine( "html", mustache() );

// parse body as json
app.use( bodyParser.json() );

// Show room select/create screen
app.get( "/", function ( req, res ) {
	var roomId = generateUniqueRoomId();
	if( roomId ) res.redirect( "/room/" + roomId );
	else res.status( 503 ).send( "Server is crowded, please try again later :)" );
});

// Show about page
app.get( "/about", function ( req, res ) {
	res.render( "about.html", {} );
});

// Show public screen
app.get( "/room/:room("+roomIdRegex+")", function ( req, res ) {
	res.render( "screen.html", {room: req.params.room} );
});

// Show remote screen
app.get( "/add/:room("+roomIdRegex+")", function ( req, res ) {
	res.render( "remote.html", {room: req.params.room} );
});

// Add video api
app.post( "/add/:room("+roomIdRegex+")", function ( req, res ) {
	if( req.body ) {
		io.to( req.params.room ).emit( "cueVideo", req.body.id );
		res.json({status:"ok"});
	} 
});

// Communicate with clients
io.on( "connection", function ( socket ) {
	
	socket.emit( "requestRegisterRoom" );
	
	socket.on( "registerRoom", function( room ) {
		socket.room = room;
		socket.join( socket.room );
	});
	
	socket.on( "cueVideo", function ( id ) {
		socket.broadcast.to( socket.room ).emit( "cueVideo", id );
		socket.emit( "addedVideo",  id );
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
