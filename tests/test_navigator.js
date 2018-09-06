'use strict';
// let patch = require('./../utils_bot/patches');
var async = require('async');
var botbuilder_mongo=require('botbuilder-mongodb');

var db = require('./../utils_bot/QueryDB_1');
var utils = require('./../utils_dialog/utils');
var myMiddleware = require('./../utils_bot/MiddlewareLogging.js');
var db = require('./../utils_bot/QueryDB_1');
var apiai = require('./../utils_bot/ApiaiRecognizer');

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

// bot.recognizer(apiai.recognizer);

bot.on('routing', function (session) {
	console.log('=============================')
	console.log('On Routing: Dialog Data %j', session.dialogData);
	console.log('On Routing: State Data %j', session.sessionState);
	console.log('=============================')
});


bot.use({
	botbuilder: function (session, next) {
		myMiddleware.logIncomingMessage(session, next);
	},
	send: function (event, next) {
		myMiddleware.logOutgoingMessage(event, next);
	}
});	

var stopWords = ['police', 'law enforcement'];
bot.onFindRoutes(function (context, callback) {
	var results = builder.Library.addRouteResult({ score: 0.0, libraryName: bot.name });
    bot.recognize(context, (err, topIntent) => {
        if (!err) {
            context.topIntent = topIntent && topIntent.score > 0 ? topIntent : null;
            context.libraryName = bot.name;
            async.parallel([
                // >>>> BEGIN CUSTOM ROUTE
                (cb) => {
                    // Check users utterance for bad words
                    var utterance = context.message.text.toLowerCase();
                    for (var i = 0; i < stopWords.length; i++) {
                        if (utterance.indexOf(stopWords[i]) >= 0) {
                            // Route triggered
                            results = builder.Library.addRouteResult({
                                score: 1.0,
                                libraryName: bot.name,
                                routeType: 'LanguageFilter',
                                routeData: {
                                    badWord: stopWords[i]
                                }
                            }, results);
                            break;
                        }
                    }
                    cb(null);
                },
                // <<<< END CUSTOM ROUTE
                (cb) => {
                    // Check the active dialogs score
                    bot.findActiveDialogRoutes(context, (err, routes) => {
                        if (!err && routes) {
                            routes.forEach((r) => results = builder.Library.addRouteResult(r, results));
                        }
                        cb(err);
                    });
                },
                (cb) => {
                    // Search for triggered stack actions.
                    bot.findStackActionRoutes(context, (err, routes) => {
                        if (!err && routes) {
                            routes.forEach((r) => results = builder.Library.addRouteResult(r, results));
                        }
                        cb(err);
                    });
                },
                (cb) => {
                    // Search for global actions.
                    bot.findGlobalActionRoutes(context, (err, routes) => {
                        if (!err && routes) {
                            routes.forEach((r) => results = builder.Library.addRouteResult(r, results));
                        }
                        cb(err);
                    });
                }
            ], (err) => {
                if (!err) {
                    callback(null, results);
                } else {
                    callback(err, null);
                }
            });
        } else {
            callback(err, null);
        }
    });
});


bot.onSelectRoute(function (session, route) {
    switch (route.routeType || '') {
        // >>>> BEGIN CUSTOM ROUTE
        case 'LanguageFilter':
            session.send("You really shouldn't say words like '%s'...", route.routeData.badWord);
            break;
        // <<<< END CUSTOME ROUTE
        case builder.Library.RouteTypes.ActiveDialog:
            bot.selectActiveDialogRoute(session, route);
            break;
        case builder.Library.RouteTypes.StackAction:
            bot.selectStackActionRoute(session, route);
            break;
        case builder.Library.RouteTypes.GlobalAction:
            bot.selectGlobalActionRoute(session, route);
            break;
        default:
            throw new Error('Invalid route type passed to Library.selectRoute().');
    }
});


bot.dialog('/', [
	function (session, args, next){
		var msg = session.message;
		// session.dialogData = {"BotBuilder.Data.WaterfallStep": 1};
		session.dialogData.memory = 'mmm';
		session.userData.isPolice = false;
		session.send('dialog /, 0');
		// session.send('%j', session.conversationData);
		session.send('%j', session.dialogData);
		session.send('%j', session.sessionState);
		var stack = session.dialogStack();
		session.send('%j', stack);
		// var context = session.toRecognizeContext();
		// session.send('context 2: %j', context);

		session.beginDialog('test');
		// builder.Prompts.text(session, 'dialog /, 0, Prompt');
		// next();
	},

	function (session, args, next) {
		session.send('dialog /, 1');
		// builder.Prompts.text(session, 'dialog /, 1, Prompt');
		session.send('%j', session.dialogData);
		session.send('%j', session.sessionState);
		builder.Prompts.text(session, 'dialog /, 1, prompt');
	},

	function (session, args, next) {
		session.send('dialog /, 2')
		session.send('%j', session.dialogData);
		session.send('%j', session.sessionState);
	}
])
.beginDialogAction('testAction:solo', 'solo', {matches: /solo/i});

bot.dialog('test', [
    function (session, args, next) {
		session.send('dialog test');	
		session.send('%j', session.dialogData);
		session.send('%j', session.sessionState);

		var cstack = session.sessionState.callstack;
		// cstack[cstack.length-2].id = ':virus';
		// cstack[cstack.length-2].state = {"BotBuilder.Data.WaterfallStep": 0};
		// session.cancelDialog('*:/');
		// session.send('After Cancel: %j', session.sessionState);
		session.endDialog('test end');
    }
])

bot.dialog('virus', [
	function (session, args, next) {
		session.send('dialog virus 0');
		session.send('%j', session.dialogData);
		session.send('%j', session.sessionState);
	},

	function (session, args, next) {
		session.send('dialog virus 1');
	}
])

bot.dialog('solo', [
	function (session, args, next) {
		session.send('dialog solo 0');
		session.send('%j', session.dialogData);
		session.send('%j', session.sessionState);

		builder.Prompts.text(session, 'dialog /solo, 0, prompt');
	},

	function (session, args, next) {
		session.send('dialog solo 1');
	}
])

bot.dialog('police', [
	function (seesion, args, next) {
		session.send('')
	}
]);

// function activeDialogStackEntry (stack) {
// 	return stack && stack.length > 0 ? stack[stack.length - 1] : null;
// };

// bot.onDisambiguateRoute(function (session, routes) {
// 	// Route message as normal
// 	var route = builder.Library.bestRouteResult(routes, session.dialogStack(), bot.name);
// 	// *** log route
// 	if (route) {
// 		console.log('=============')
// 		console.log('%j', route);
// 		console.log('=============')
// 	}
// 	else {
// 		console.log('=============')
// 		var dialogStack = session.dialogStack();
// 		var active = activeDialogStackEntry(dialogStack);
// 		var keys = Object.keys(session.options);
// 		console.log('%j', dialogStack);
// 		console.log('%j', active);
// 		console.log('%j', session.options.dialogId);
// 		console.log('%j', session.options.dialogArgs);
// 		console.log('=============')		
// 	}
// 	if (route) {
// 		bot.library(route.libraryName).selectRoute(session, route);
// 	} else {
// 		// Just let the active dialog process the message
// 		session.routeToActiveDialog();
// 	}
// }
// );

    // Session.prototype.toRecognizeContext = function () {
    //     var _this = this;
    //     return {
    //         message: this.message,
    //         userData: this.userData,
    //         conversationData: this.conversationData,
    //         privateConversationData: this.privateConversationData,
    //         dialogData: this.dialogData,
    //         localizer: this.localizer,
    //         logger: this.logger,
    //         dialogStack: function () { return _this.dialogStack(); },
    //         preferredLocale: function () { return _this.preferredLocale(); },
    //         gettext: function () {
    //             var args = [];
    //             for (var _i = 0; _i < arguments.length; _i++) {
    //                 args[_i] = arguments[_i];
    //             }
    //             return Session.prototype.gettext.call(_this, args);
    //         },
    //         ngettext: function () {
    //             var args = [];
    //             for (var _i = 0; _i < arguments.length; _i++) {
    //                 args[_i] = arguments[_i];
    //             }
    //             return Session.prototype.ngettext.call(_this, args);
    //         },
    //         locale: this.preferredLocale()
    //     };
    // };