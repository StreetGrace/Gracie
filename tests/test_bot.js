'use strict';
let patch = require('./../utils_bot/patches');
// var resDB = require('./../utils_bot/QueryDB');
var queryDB = require('./../utils_bot/QueryDB_1');
var utils = require('./../utils_dialog/utils');

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
		queryDB.query

		next();
	}
]);

