var restify = require('restify');
var builder = require('botbuilder');
var apiai = require('./utils_bot/ApiaiRecognizer');
var utils = require('./utils_dialog/utils');
var botbuilder_mongo=require('botbuilder-mongodb')

// Setup Restify Server
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

// Listen for messages from users 

const mongoOptions = {
    ip: '18.234.8.122',
    port: '27017',
    database: 'gracie',
    collection: 'state_data',
    username: 'adclaimsuser@bbdo.com',
    password: 'Bbdoatl1',
    queryString: 'gracie'
}

mongoStorage=botbuilder_mongo.GetMongoDBLayer(mongoOptions)

// var memoryStorage = new builder.MemoryBotStorage();

var bot = new builder.UniversalBot(connector, {});
// bot.set('storage', memoryStorage);
bot.set('storage', mongoStorage);


bot.dialog('/', [
	function (session, args, next){
		session.send('[Start Root Dialog]');
		session.userData.profile = session.userData.profile || initialProfile;
	
		session.beginDialog('main:/', {complete_open: 0});
	}
]);

bot.library(require('./dialogs/main').createLibrary());
bot.library(require('./dialogs/opener').createLibrary());
bot.library(require('./dialogs/confirmService').createLibrary());
bot.library(require('./dialogs/confirmTime').createLibrary());

const initialProfile = {
	default: {
		model: 'Gina',
		neighborhood: 'Rome'
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
				'inout': 0
			}
		}
	},
	
};
