var restify = require('restify');
var builder = require('botbuilder');

var apiai = require('./utils_bot/ApiaiRecognizer');
var utils = require('./utils_dialog/utils');
var myMiddleware = require('./utils_bot/MiddlewareLogging.js');
var botbuilder_mongo=require('botbuilder-mongodb');
var buffer = require('./utils_bot/MessageBuffer');
var blacklist = require('./utils_bot/Blacklist');
// var resDB = require('./utils_bot/QueryDB');
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
    // concatMsg(), 
    connector.listen()]);

const mongoOptions = {
    ip: '18.234.8.122',
    port: '27017',
    database: 'gracie',
    collection: 'state_data',
    username: 'adclaimsuser@bbdo.com',
    password: 'Bbdoatl1',
    queryString: 'gracie'
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
        console.log('%j', session.message);
        var sessionInfo = utils.getSessionInfo(session);
        botLogger.info(':/, Start', sessionInfo);
		session.userData.profile = session.userData.profile || initialProfile;
		try {
			session.beginDialog('main:/', {complete_open: 0});
		}
		catch (err) {
            var errInfo = utils.getErrorInfo(err);          
            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
            // resDB.queryRes('global', 0, 0, function (err, result) {
            //     if (err) {
            //       console.log(err);
            //       console.log('error pulling data');
            //     }
            //     else {
            //       var reply = result.message;
            //       reply = decodeURIComponent(reply).replace(/\+/g, " ");
            //       reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');

            //       blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
            //       session.endConversation(reply);
            //     }
            //   }
            // );
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
		model: 'Gina',
		neighborhood: 'buckhead'
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
                        // console.log(result);
                        req.body.text = result.msg + ' ' + req.body.text;
                    }
                    console.log('Text: %j', req.body);
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
                            // console.log('Complete Msg: ' + req.body.text)
                            // console.log('Complete Now: ' + now);
                            // console.log('Complete time_stored: ' + time_stored);
                            // console.log('Complete Diff: ' + (now - time_stored));                                
                            next();
                        }
                        else {
                            // console.log('Msg: ' + req.body.text)
                            // console.log('Now: ' + now);
                            // console.log('time_stored: ' + time_stored);
                            // console.log('Diff: ' + (now - time_stored));  
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
                    // if (!log_label) {
                    //     botLog.initial_logger(req.body.from.id);
                    //     log_label = 1;
                    // }
                    blacklist.find(req.body.from.id, function (result) {
                        if (result) {
                            res.status(202);
                            res.end();                           
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