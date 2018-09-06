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
    filteruser(), 
    // filterOngoinguser(), 
    // concatMsg(), 
	connector.listen()]);
	
const mongoOptions = config.stateConn;

var bot = new builder.UniversalBot(connector, {});

//Set State Data Storage to memory
bot.set('storage', memoryStorage);
var memoryStorage = new builder.MemoryBotStorage();

// Set State Data Storage to MongoDB
// var mongoStorage = botbuilder_mongo.GetMongoDBLayer(mongoOptions)
// bot.set('storage', mongoStorage);
bot.on(

);

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
		var msg = session.message;
		if (msg.attachments && msg.attachments.length > 0) {
		 // Echo back attachment
		 var attachment = msg.attachments[0];
			session.send({
				text: "You sent:",
				attachments: [
					{
						contentType: attachment.contentType,
						contentUrl: attachment.contentUrl,
						name: attachment.name
					}
				]
			});
		} 
		if (msg.text) {
			session.send("You said: %s", session.message.text);
		}
	}
]);


function filteruser () {
    return function (req, res, next) {
        if (req.body) {
            // botLogger.info('filterUser: found body', {body: req.body});
            next();
        }
        else {
            var requestData = '';
            req.on('data', function (chunk) {
                requestData += chunk;
            });
            req.on('end', function () {
				res.send(202);                
				req.body = JSON.parse(requestData);
				if (req.body.attachments && req.body.attachments.length > 0) {
					req.body.text = 'Default: Image Received';
				}
				console.log('=================')
				console.log('%j', req.body)
				console.log('=================')
				next();
            });
        }
    };
}

//no "text"; no "textFormat"; has "attachments"
//{}