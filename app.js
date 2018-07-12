
let patch = require('./utils_bot/patches');

var restify = require('restify');
var builder = require('botbuilder');

var utils = require('./utils_dialog/utils');
var myMiddleware = require('./utils_bot/MiddlewareLogging.js');
var botbuilder_mongo=require('botbuilder-mongodb');
var buffer = require('./utils_bot/MessageBuffer');
var blacklist = require('./utils_bot/Blacklist');
var profileDB = require('./utils_bot/QueryProfile.js')

var botLog = require('./utils_bot/BotLogger');

//Setup Logger
var botLogger = botLog.botLog;
botLogger.info('Gracie Online');

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
server.post('/api/messages', [
    filteruser(), 
    concatMsg(), 
    connector.listen()]);

const mongoOptions = {
    ip: '18.234.8.122',
    port: '27017',
    database: 'test',
    collection: 'state_data',
    username: 'adclaimsuser@bbdo.com',
    password: 'Bbdoatl1',
    queryString: 'test'
}

// Set State Data Storage to MongoDB
mongoStorage=botbuilder_mongo.GetMongoDBLayer(mongoOptions)

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
        try {
            var sessionInfo = utils.getSessionInfo(session);
            botLogger.info(':/, Start', sessionInfo);
            
            session.userData.profile = session.userData.profile || initialProfile;
    
            profileDB.getProfile(session.message.address.bot.id)
                .then( res => {
                    session.userData.profile.default = res;
                    session.beginDialog('main:/', {complete_open: 0});
                })
                .catch( err => {
                    var errInfo = utils.getErrorInfo(err);          
                    botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                    utils.endConversation(session, 'error')                
                });
        }
		catch (err) {
            var errInfo = utils.getErrorInfo(err);          
            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
            utils.endConversation(session, 'error')
		}
	}
]);

bot.library(require('./dialogs/main').createLibrary());
bot.library(require('./dialogs/opener').createLibrary());
bot.library(require('./dialogs/confirmService').createLibrary());
bot.library(require('./dialogs/confirmTime').createLibrary());

const initialProfile = {
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
	},
	
};

function concatMsg () {
    // now = new Date();
    return function (req, res, next) {
        try {
            if (req.body.type != 'message') {
                next();
            }
            else {
                var time_stored;
                var time_received = new Date().getTime();    
                buffer.find(req.body.conversation.id, function (result) {
                    if (result) {
                        req.body.text = result.msg + ' ' + req.body.text;
                    }
                    // console.log('Text: %j', req.body);
                    data = {
                        conversation_id: req.body.conversation.id,
                        msg: req.body.text,
                        timestamp: time_received
                    };
                    buffer.insert(data);
                });     
                // res.status(202);
                setTimeout(function () {
                    var now = new Date().getTime();
                    buffer.find(req.body.conversation.id, function (result) {
                        if (result && result.timestamp) {
                            time_stored = result.timestamp;
                        }
                        else {
                            time_stored = time_received;
                        }
                        if (now - time_stored > 15000) {
                            buffer.del_msg(req.body.conversation.id);                              
                            next();
                        }
                        else {
                            res.status(202);
                            res.end();
                        }
                    });
                }, 15000);

            }              
        }
        catch (err) {
            console.error('Custom Handler: receive - invalid request data received.');
            res.send(400);
            res.end();
            return;
        }
    }
}

// const utl = require('util');
function filteruser () {
    // now = new Date();
    return function (req, res, next) {
        if (req.body) {
            next();
        }
        else {
            var requestData = '';
            req.on('data', function (chunk) {
                requestData += chunk;
            });
            req.on('end', function () {
                try {
                    req.body = JSON.parse(requestData);
                    blacklist.find(req.body.from.id, function (result) {
                        if (result) {
                            res.status(202);
                            myMiddleware.logBlackListedMessage(req, res);                      
                        }
                        else {
                            next();
                        }
                    })         
                }
                catch (err) {
                    console.error('Custom Handler: receive - invalid request data received.');
                    res.send(400);
                    res.end();
                    return;
                }
            });
        }
    };
}