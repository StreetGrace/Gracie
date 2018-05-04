var restify = require('restify');
var builder = require('botbuilder');
var apiai = require('./apiai_recognizer');
var utils = require('./utils');
var utils_time = require('./utils_time');
var index = require('./node_modules/botbuilder-mongodb/index.js');
var myMiddleware = require('./middlewareLogging.js');
var msgBuffer = require('./messageBuffer.js');
//create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassWord: process.env.MICROSOFT_APP_PASSWORD
});

const mongoOptions = {
    ip: 'ds161713.mlab.com',
    port: '61713',
    database: 'sg_state',
    collection: 'test',
    username: 'ray',
    password: 'Bbdoatl1',
    queryString: 'sg_state'
}

const mongoOptions
var mongo=index.GetMongoDBLayer(mongoOptions)
console.log("result===>>",mongo);

//create memory storage
// var Storage = new builder.MemoryBotStorage();

//receive messages from the user and respond
const bot = new builder.UniversalBot(connector,{
	// persistConversationData: true
})
	.set('storage', mongo);;

// Middleware for logging
bot.use({
	botbuilder: function (session, next) {
		myMiddleware.logIncomingMessage(session, next);
	},
	send: function (event, next) {
		myMiddleware.logOutgoingMessage(event, next);
	}
});


//setup restify server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function(){
	console.log('%s listening to %s', server.name, server.url);
});

//listen for message from users
server.post('/api/messages', connector.listen());

bot.dialog('/', [
	function (session, args, next){
        session.send('[Test ConfirmTime Dialog]');
		session.userData.profile = session.userData.profile || initialProfile;
		var exactTime = initialProfile.appointment['exact-Time'];
		var relativeTime = initialProfile.appointment['relative-time'];
		var givenTime = utils_time.fillTime(exactTime, relativeTime);
		session.send('%j', givenTime);
		session.beginDialog('confirmTime:/', {data: givenTime, reprompt: 0});
	},
	function (session, args, next){
		// session.beginDialog('main:/');
		session.userData.profile = initialProfile;
		if (args.reply) {
			session.send(args.reply);
		}
		session.send('[Test End]');
	}
]);

bot.library(require('./confirmTime').createLibrary());

var givenTime_default = {
    complete: 0,
    date: 'today',
    time: null,
    exactTime: {},
    relativeTime: {'time-relative': 'after', time: '03:00:00'}
};

const initialProfile = {
	default: {
		model: 'Gina',
		neighborhood: 'Rome'
	},
	appointment: {
		'exact-time': [],
		'relative-time': [{'time-relative': 'after', time:'03:00:00'}],
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
			hour: null, minute: null, date: null
		},
		location: {
			neighborhood: '', site: '', address: ''
		},
		service: {
			inout: null, duration: null, addon: null
		}
	}
};