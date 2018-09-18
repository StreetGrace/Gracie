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

// Set State Data Storage to MongoDB
var mongoStorage = botbuilder_mongo.GetMongoDBLayer(mongoOptions)
bot.set('storage', mongoStorage);

// bot.on('routing', function (session) {
// 	console.log('=============================')
// 	console.log('On Routing: Dialog Data %j', session.dialogData);
// 	console.log('On Routing: State Data %j', session.sessionState);
// 	console.log('=============================')
// });

bot.use({
	botbuilder: function (session, next) {
		myMiddleware.logIncomingMessage(session, next);
	},
	send: function (event, next) {
		myMiddleware.logOutgoingMessage(event, next);
	}
});	

// bot.recognizer(apiai.recognizer);

//topIntent = intent_result
// var intent_result = {
//     score: 1,
//     intent: res.metadata.intentName,
//     entities: res.parameters                    
// }

bot.onFindRoutes(function (context, callback) {
    var results = builder.Library.addRouteResult({ score: 0.0, libraryName: bot.name });
    var stack = context.dialogStack();
    var parentDialog = getParentDialog(stack, true);
    console.log('==========================');
    console.log('dialog stack %j', stack);
    console.log('Parent Stack %j', parentDialog);
    console.log('==========================');    
    bot.recognize(context, (err, topIntent) => {
        if (!err) {
            context.topIntent = topIntent && topIntent.score > 0 ? topIntent : null;
            context.libraryName = bot.name;
            async.parallel([
                // (cb) => {
                //     var msg = context.message.text;
                //     apiai.recognize({message: {text: msg}})
                //         .then(res => {
                //             var intent = res.intent;
                //             var entities = res.entities;
                //             console.log('==========================');
                //             console.log('recognized intent %j', intent);
                //             console.log('==========================');                                                                
                //             if (intent == 'General.Police') {
                //                 results = builder.Library.addRouteResult({
                //                     score: 1.0,
                //                     libraryName: bot.name,
                //                     routeType: 'General: Police',
                //                     routeData: {}
                //                 }, results);        
                //             }

                //             cb(null);
                //         })
                // },
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
    console.log('*********************');
    console.log('Route: %j', route);
    console.log('*********************');
    // session.send('********************');
    // session.send('Route: %j', route);
    // var ctx = session.toRecognizeContext();
    // session.send('Context: %j', ctx);
    // session.send('********************');
    switch (route.routeType || '') {
        // >>>> BEGIN CUSTOM ROUTE
        // case 'General: Police':
        //     var frmDialog = getParentDialog(session);
        //     session.send('Route Custom');
        //     session.send('current lib: %j', Object.keys(session.library));
        //     session.send('current dialog: %j', session.curDialog());
        //     session.send('parent dialog %j', frmDialog);
        //     if (isPrompt(session)) {
        //         session.sessionState.callstack.push({'id':'BotBuilder:Interruption'})
        //         session.dialogData = {'BotBuilder.Data.WaterfallStep':0};
        //         session.send('Call Stack: %j', session.sessionState.callstack);
        //     }
        //     session.beginDialog('generalTopic:/police', {denied: false, reprompt: 0});
        //     if (frmDialog && frmDialog.id && frmDialog.id.indexOf('important') >= 0) {
        //         session.beginDialog('*:continue_topic');
        //     }
        //     else {
        //         session.beginDialog('*:chichat');
        //     }

        //     break;
        // <<<< END CUSTOME ROUTE
        case builder.Library.RouteTypes.ActiveDialog:
            // session.send('Route Active');
            // session.send('current lib: %j', Object.keys(session.library));
            // session.send('current dialog: %j', session.curDialog());
            // session.send('route: %j', route);
            bot.selectActiveDialogRoute(session, route);
            break;
        case builder.Library.RouteTypes.StackAction:
            // session.send('Route Stack');
            // session.send('current lib: %j', Object.keys(session.library));
            // session.send('current dialog: %j', session.curDialog());
            // session.send('route: %j', route);
            bot.selectStackActionRoute(session, route);
            break;
        case builder.Library.RouteTypes.GlobalAction:
            // session.send('Route Global');
            // session.send('current lib: %j', Object.keys(session.library));
            // session.send('current dialog: %j', session.curDialog());
            // session.send('route: %j', route);
            bot.selectGlobalActionRoute(session, route);
            break;
        default:
            throw new Error('Invalid route type passed to Library.selectRoute().');
    }
});

bot.library(require('./../dialogs/generalTopic').createLibrary());

bot.dialog('/', [
	function (session, args, next){
        var msg = session.message;
        session.userData.profile = {
            topics: {
                police: {complete: false, count: 0}
            }
        };
		// session.dialogData = {"BotBuilder.Data.WaterfallStep": 1};
		// session.dialogData.memory = 'mmm';
		// session.userData.isPolice = false;
        session.send('dialog /, 0');
        if (args) {
            session.send('args %j', args.response);
        }
        // var context = session.toRecognizeContext();
        // session.send('context : %j', context);
		// session.send('%j', session.conversationData);
		// session.send('Dialog Data: %j', session.dialogData);
		// session.send('Session State: %j', session.sessionState);
		// var stack = session.dialogStack();
		// session.send('Stack: %j', stack);
	},

	function (session, args, next) {
        session.send('dialog /, 1');
        // var context = session.toRecognizeContext();
        // session.send('context : %j', context);
		// builder.Prompts.text(session, 'dialog /, 1, Prompt');
		// session.send('Dialog Data: %j', session.dialogData);
		// session.send('Session State: %j', session.sessionState);
		builder.Prompts.text(session, "dialog /, 1, prompt: what is current topic");
	},

	function (session, args, next) {
        session.send('dialog /, 2')
        // var context = session.toRecognizeContext();
        // session.send('context : %j', context);
		// session.send('Dialog Data: %j', session.dialogData);
		// session.send('Session State: %j', session.sessionState);
	}
])
.beginDialogAction('testAction:casual', 'casual', {matches: /casual/i})
.beginDialogAction('testAction:important', 'important', {matches: /important/i})
;

bot.dialog('important', [
	function (session, args, next) {
        session.send('dialog important 0');
        session.send('args %j', args);
        // var context = session.toRecognizeContext();
        // session.send('context : %j', context);
		// session.send('Dialog Data: %j', session.dialogData);
		// session.send('Session State: %j', session.sessionState);
        builder.Prompts.text(session, 'dialog /important, 0, prompt');
	},

	function (session, args, next) {
        session.send('dialog important 1');
        // var context = session.toRecognizeContext();
        // session.send('context : %j', context);
        // session.send('Dialog Data: %j', session.dialogData);
		// session.send('Session State: %j', session.sessionState);
        session.endDialog();
	}
])

bot.dialog('casual', [
	function (session, args, next) {
        session.send('dialog casual 0');
        session.send('args %j', args);
        // var context = session.toRecognizeContext();
        // session.send('context : %j', context);
		// session.send('Dialog Data: %j', session.dialogData);
        // session.send('Session State: %j', session.sessionState);
        // session.endDialog();
        // builder.Prompts.text(session, 'dialog /casual, 0, prompt');
        // session.endDialog();
        next();
	},

	function (session, args, next) {
        session.send('dialog casual 1');
        var dData = session.dialogData;
        var ss = session.sessionState;
        console.log('XDXDXXDXDXDXDXDXD')
        console.log('dialog casual state: %j', ss);
        console.log('XDXDXXDXDXDXDXDXD')
        
    //     // var context = session.toRecognizeContext();
    //     // session.send('context : %j', context);
    //     // session.send('Dialog Data: %j', session.dialogData);
    //     // session.send('Session State: %j', session.sessionState);
    //     session.cancelDialog('*:casual');
    // },
    // function (session, args, next) {
        session.endDialogWithResult({dd: dData});
    }
])



function getParentDialog (session, isStack=false) {
    if (!isStack) {
        var ss = session.sessionState;
    }
    else {
        var ss = {callstack: session};
    }
    var cur;
    if (ss && ss.callstack && ss.callstack.length > 0) {
        cur = ss.callstack[ss.callstack.length - 1];
        console.log('finding parent %j', cur);
        if (cur.id.indexOf('BotBuilder:prompt') >= 0 && ss.callstack.length > 1) {
            cur = ss.callstack[ss.callstack.length - 2];
        }
    }
    return cur;
}

function isPrompt (session) {
    var ss = session.sessionState;
    if (ss && ss.callstack && ss.callstack.length > 0) {
        var cur = ss.callstack[ss.callstack.length - 1];
        if (cur.id.indexOf('BotBuilder:prompt') >= 0) {
            return true;
        }
    }
    return false;
}


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