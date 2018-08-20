'use strict';
// let patch = require('./../utils_bot/patches');

var botbuilder_mongo=require('botbuilder-mongodb');
var db = require('./../utils_bot/QueryDB_1');
var utils = require('./../utils_dialog/utils');
var myMiddleware = require('./../utils_bot/MiddlewareLogging.js');
var db = require('./../utils_bot/QueryDB_1');

var botLog = require('./../utils_bot/BotLogger');
var botLogger = botLog.botLog;
var config = require('./../config').config;

var botLogger = botLog.botLog;

let restify = require('restify')
//Include the library botbuilder
let builder = require('botbuilder')

//Run the server continuously
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

server.post('/api/messages', [
	connector.listen()]);
	
const mongoOptions = config.stateConn;

var bot = new builder.UniversalBot(connector, {});

//Set State Data Storage to memory
// bot.set('storage', memoryStorage);
// var memoryStorage = new builder.MemoryBotStorage();

// Set State Data Storage to MongoDB
var mongoStorage = botbuilder_mongo.GetMongoDBLayer(mongoOptions)
bot.set('storage', mongoStorage);

bot.use({
	botbuilder: function (session, next) {
		myMiddleware.logIncomingMessage(session, next);
	},
	send: function (event, next) {
		myMiddleware.logOutgoingMessage(event, next);
	}
});	

bot.onDisambiguateRoute(function (session, routes) {
	// Route message as normal
	var route = builder.Library.bestRouteResult(routes, session.dialogStack(), bot.name);
	// *** log route
	console.log('%j', route);
	if (route) {
		bot.library(route.libraryName).selectRoute(session, route);
	} else {
		// Just let the active dialog process the message
		session.routeToActiveDialog();
	}
}
);

bot.dialog('/', [
	function (session, args, next){
		var msg = session.message;
		session.send('dialog /')

		next()
	},
	function (session, args, next) {
		session.send('dialog /, 1')
		session.beginDialog('test');
	}
]);

bot.dialog('test', [
    function (session, args, next) {
		session.send('dialog test')
		var s_keys = Object.keys(session);
		var i = 0;
	
    }
])


// apiai.recognize({message: {text: msg}})
//     .then( res => {
//         var intent = res.intent;
//         var entities = res.entities;
//     }) 