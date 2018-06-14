var builder = require('botbuilder');
var apiai = require('./../utils_bot/ApiaiRecognizer');
var utils = require('./../utils_dialog/utils');
var utilsTime = require('./../utils_dialog/utils_Time');
var utilsService = require('./../utils_dialog/utils_Service');
var lib_router = require('./../utils_bot/IntentRouter');
var blacklist = require('./../utils_bot/Blacklist');
var resDB = require('./../utils_bot/QueryDB');

var botLog = require('./../utils_bot/BotLogger');
var botLogger = botLog.botLog;

var lib = new builder.Library('main');

/*
*	Route incoming message to sub-dialogs based on detected intent
*/
lib.dialog('/', [
	function (session, args, next){
		var sessionInfo = utils.getSessionInfo(session);
		botLogger.info('main:/, Start', Object.assign(sessionInfo));
		try {
			if (!args.complete_open) {
				session.beginDialog('opener:/');
			}
			else {
				// session.send(args.reply);
				var reply = args.reply || '';
				var priceGiven = session.userData.profile.confirmation.price.priceGiven;
				var duration = session.userData.profile.confirmation.service.duration;
				if (!priceGiven[duration]) {
					reply += ` donation is ${utils.priceTable[duration]}. `;
				}

				resDB.queryRes('main:/', 0, 0, function (err, result) {
					if (err) {
					  console.log(err);
					  console.log('error pulling data');
					}
					else {
					  var reply_new = result.message;
					  reply_new = decodeURIComponent(reply_new).replace(/\+/g, " ");
					  reply += eval('`'+ reply_new.replace(/`/g,'\\`') + '`');
	
					  builder.Prompts.text(session, reply);
					}
				  }
				);			
			}
		} 
		catch (err) {
			var errInfo = utils.getErrorInfo(err);
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
				// resDB.queryRes('global', 0, 0, function (err, result) {
				// 					if (err) {
				// 						console.log(err);
				// 						console.log('error pulling data');
				// 					}
				// 					else {
				// 						var reply = result.message;
				// 						reply = decodeURIComponent(reply).replace(/\+/g, " ");
				// 						reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');

				// 						blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
				// 						session.endConversation(reply);
				// 					}
				// 				}
				// 	);
				utils.endConversation(session, 'error');
		}
	},
	function (session, args, next) {
		try {
			var msg = args.response;
			apiai.recognizer.recognize({message:{text:msg}}, function(error, response) {
				var intent = response.intent;
				var entities = response.entities;
				var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
				var price = entities['price'] ? entities['price'] : null;
			
				var sessionInfo = utils.getSessionInfo(session);
				botLogger.info('main:/, Receive Response', utils.getSessionInfo({}, sessionInfo, {intent: intent}));

				if (intent == 'Intent.Confirmation_Yes') {
					// setTimeout(function(){
					// 	resDB.queryRes('global', 0, 0, function (err, result) {
					// 		if (err) {
					// 		  console.log(err);
					// 		  console.log('error pulling data');
					// 		}
					// 		else {
					// 		  var reply = result.message;
					// 		  reply = decodeURIComponent(reply).replace(/\+/g, " ");
					// 		  reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
			
					// 		  blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
					// 		  session.endConversation(reply);
					// 		}
					// 	  }
					// 	);
					// }, 5000)
					utils.endConversation(session, 'complete');
				}
				else if (intent == 'Intent.Location_Inquiry') {
					// setTimeout(function(){
					// 	resDB.queryRes('global', 0, 0, function (err, result) {
					// 		if (err) {
					// 		  console.log(err);
					// 		  console.log('error pulling data');
					// 		}
					// 		else {
					// 		  var reply = result.message;
					// 		  reply = decodeURIComponent(reply).replace(/\+/g, " ");
					// 		  reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
			
					// 		  blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
					// 		  session.endConversation(reply);
					// 		}
					// 	  }
					// 	);
					// }, 5000)
					utils.endConversation(session, 'complete');
				}
				else if (intent == 'Intent.confirmation_No') {
					// setTimeout(function(){
					// 	var reply = 'Well whatever bye';
					// 	blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
					// 	session.endConversation(reply);
					// }, 5000)					
					utils.endConversation(session, 'complete_n');
				}
				else {
					// setTimeout(function(){
					// 	resDB.queryRes('global', 0, 0, function (err, result) {
					// 		if (err) {
					// 		  console.log(err);
					// 		  console.log('error pulling data');
					// 		}
					// 		else {
					// 		  var reply = result.message;
					// 		  reply = decodeURIComponent(reply).replace(/\+/g, " ");
					// 		  reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
			
					// 		  blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
					// 		  session.endConversation(reply);
					// 		}
					// 	  }
					// 	);			
					// }, 5000)
					utils.endConversation(session, 'complete');
				}
			});  		
		}
		catch (err) {
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
			// resDB.queryRes('global', 0, 0, function (err, result) {
      //           if (err) {
      //             console.log(err);
      //             console.log('error pulling data');
      //           }
      //           else {
      //             var reply = result.message;
      //             reply = decodeURIComponent(reply).replace(/\+/g, " ");
      //             reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');

      //             blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
      //             session.endConversation(reply);
      //           }
      //         }
			//       );
			utils.endConversation(session, 'error');
		}
	}
]);

module.exports.createLibrary = function(){
    return lib.clone();
};
