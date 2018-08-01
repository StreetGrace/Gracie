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
    // filteruser(), 
    // filterOngoinguser(), 
    // concatMsg(), 
	connector.listen()]);
	
const mongoOptions = config.stateConn;
// Set State Data Storage to MongoDB
var mongoStorage = botbuilder_mongo.GetMongoDBLayer(mongoOptions)

// var memoryStorage = new builder.MemoryBotStorage();
var bot = new builder.UniversalBot(connector, {});
// bot.set('storage', memoryStorage);
bot.set('storage', mongoStorage);

bot.use({
	botbuilder: function (session, next) {
		myMiddleware.logIncomingMessage(session, next);
	},
	send: function (event, next) {
		myMiddleware.logOutgoingMessage(event, next);
	}
});	

bot.dialog('/', [
	function (session, args, next){
		var test =  {
			default: {
				model: '',
				city: '',
				neighborhood: '',
				age: 16,
				gender: 'Female'
			},
			appointment: {
				'exact-time': [],
				'relative-time': [],
				service: [],
				price: [],
				location: [],	
				model: ''
			},
			demographic: {
				name: ''
			},
			confirmation: {
				time: {
					hour: null, minute: null, date: null, complete: 0
				},
				location: {
					neighborhood: '', site: '', address: '', complete: 0
				},
				service: {
					inout: 'incall', duration: '', addon: '', complete: 0
				},
				price: {
					priceListGiven: 0,
					priceGiven: {
						'30min': 0,
						'1 hour': 0,
						'15min': 0,
						'addon': 0,
						'2 hours': 0,
						'overnight': 0,
						'addon': 0,
						'inout': 0,
						'bare': 0
					}
				}
			}
		};
		session.send('%j', test);
		// utils.endConversation(session, 'complete',botLogger);
		
	}
]);


//When the server posts to /api/messages, make the connector listen to it.
// server.post('/api/messages', connector.listen())

// var inMemoryStorage = new builder.MemoryBotStorage();
// var bot = new builder.UniversalBot(connector, {});
// bot.set('storage', inMemoryStorage);
