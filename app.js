
let patch = require('./utils_bot/patches');

var restify = require('restify');
var builder = require('botbuilder');

var utils = require('./utils_dialog/utils');
var myMiddleware = require('./utils_bot/MiddlewareLogging.js');
var botbuilder_mongo=require('botbuilder-mongodb');
var buffer = require('./utils_bot/MessageBuffer');
var blacklist = require('./utils_bot/Blacklist');
var ongoingList = require('./utils_bot/OngoingList');
var profileDB = require('./utils_bot/QueryProfile.js')

var botLog = require('./utils_bot/BotLogger');
var config = require('./config').config;

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
    filterOngoinguser(), 
    concatMsg(), 
    connector.listen()]);

const mongoOptions = config.stateConn;
// Set State Data Storage to MongoDB
var mongoStorage = botbuilder_mongo.GetMongoDBLayer(mongoOptions);

// var memoryStorage = new builder.MemoryBotStorage();
var bot = new builder.UniversalBot(connector, {});
// bot.set('storage', memoryStorage);
bot.set('storage', mongoStorage);
// bot.set(`persistUserData`, false);

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
         
            session.userData.profile = config.initialProfile;
            session.save();
            botLogger.info(':/, initialProfile', session.userData)

            profileDB.getProfile(session.message.address.bot.id)
                .then( res => {
                    session.userData.profile.default = res;
                    session.beginDialog('main:/', {complete_open: 0});
                })
                .catch( err => {
                    var errInfo = utils.getErrorInfo(err);          
                    botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                    utils.endConversation(session, 'error', botLogger)                
                });
        }
		catch (err) {
            var errInfo = utils.getErrorInfo(err);          
            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
            utils.endConversation(session, 'error', botLogger)
		}
	}
]);

bot.library(require('./dialogs/main').createLibrary());
bot.library(require('./dialogs/opener').createLibrary());
bot.library(require('./dialogs/confirmService').createLibrary());
bot.library(require('./dialogs/confirmTime').createLibrary());

function concatMsg () {
    const bufferTime = 18000;
    return function (req, res, next) {
        try {
            if (req.body.type != 'message') {
                // botLogger.info('concatMsg: not message', {body: req.body});
                next();
                
            }
            else {
                var time_stored;
                var time_received = new Date().getTime();    
                // botLogger.info('concatMsg: message', {req: req, time_received: time_received});
                buffer.find(req.body.conversation.id, function (result) {
                    if (result) {
                        req.body.text = result.msg + ' ' + req.body.text;
                    }
                    data = {
                        conversation_id: req.body.conversation.id,
                        msg: req.body.text,
                        timestamp: time_received
                    };
                    buffer.insert(data);
                });     
                setTimeout(function () {
                    var now = new Date().getTime();
                    // botLogger.info('concatmsg: Timeout', {now: now, time_received: time_received, req:req});
                    buffer.find(req.body.conversation.id, function (result) {
                        if (result && result.timestamp) {
                            time_stored = result.timestamp;
                        }
                        else {
                            time_stored = time_received;
                        }
                        if (now - time_stored > bufferTime) {
                            buffer.del_msg(req.body.conversation.id);                              
                            next();
                        }
                        else {
                            res.status(202);
                            res.end();
                        }
                    });
                }, bufferTime);

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
                setTimeout(function() {
                    req.body = JSON.parse(requestData);
                    blacklist.find(req.body.from.id)
                    .then( result => {
                        if (result) {
                            myMiddleware.logBlackListedMessage(req, res);                      
                        }
                        else {
                            next()
                        }
                    })
                    .catch( err => {
                        var errInfo = util.getErrorInfo(err);
                        botLogger.error("Exception Caught", errInfo);
                        res.send(400);
                        res.end();
                        return;
                    })    
                }, 100);
            });
        }
    };
}

function filterOngoinguser () {
    return function (req, res, next) {
        if (req.body.type != 'message') {
            next();           
        }
        else {
            ongoingList.find(req.body.from.id)
            .then(result => {
                if (result) {
                    if (result.bot_id == req.body.recipient.id) { 
                        next(); 
                    }
                    else { 
                        myMiddleware.logBlackListedMessage(req, res); 
                    }
                }
                else {
                    return ongoingList.insert({user_id: req.body.from.id, bot_id: req.body.recipient.id})
                        .then( () => {
                            next();
                        });
                }
            })   
            .catch( err => {
                var errInfo = util.getErrorInfo(err);
                botLogger.error("Exception Caught", errInfo);
                res.send(400);
                res.end();
                return;
            })    
        }
    }
};
