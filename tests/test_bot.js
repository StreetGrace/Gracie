'use strict';

let restify = require('restify')
//Include the library botbuilder
let builder = require('botbuilder')

//Create the server
let server = restify.createServer()

//Run the server continuously
server.listen(3978, function(){
	console.log('The server is running on ', server.name, server.url)
})

// Create chat connector with the default id and password
let connector = new builder.ChatConnector({
	appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
})

//When the server posts to /api/messages, make the connector listen to it.
server.post('/api/messages', connector.listen())

var inMemoryStorage = new builder.MemoryBotStorage();
var bot = new builder.UniversalBot(connector, {});
bot.set('storage', inMemoryStorage);

bot.dialog('/', [
	function (session, args, next) {
		let name = session.message.user.name
		let message = session.message.text
		session.send('1' + name + " said "  + message);
		session.send('2' + name + " said "  + message)
		session.send('3' + name + " said "  + message)
		session.send('4' + name + " said "  + message)
		// next();
	},
	// function (session, args, next) {
	// 	let name = session.message.user.name
	// 	let message = session.message.text
	// 	session.send('2' + name + " said "  + message)
	// 	// next();
	// },
	// function (session, args, next) {
	// 	let name = session.message.user.name
	// 	let message = session.message.text
	// 	session.send('3' + name + " said "  + message)
	// 	// next();
	// },
	// function (session, args, next) {
	// 	let name = session.message.user.name
	// 	let message = session.message.text
	// 	session.send('4' + name + " said "  + message)
	// 	// next();
	// },
	// function (session) {
	// 	let name = session.message.user.name
	// 	let message = session.message.text
	// 	session.send('5' + name + " said "  + message)		
	// }
]);


builder.Session.prototype._send = builder.Session.prototype.send;

builder.Session.prototype.send = function (message) {
	var _this = this;
	setTimeout(function () {
		return _this._send(message);
	}, getRandomInt(3)*1000); 
};

function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
  }