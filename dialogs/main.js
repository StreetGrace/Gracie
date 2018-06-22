var builder = require('botbuilder');
var apiai = require('./../utils_bot/ApiaiRecognizer');
var utils = require('./../utils_dialog/utils');
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
					  reply += ' ' + eval('`'+ reply_new.replace(/`/g,'\\`') + '`');
	
					  builder.Prompts.text(session, reply);
					}
				  }
				);			
			}
		} 
		catch (err) {
			var errInfo = utils.getErrorInfo(err);
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
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
				botLogger.info('main:/, Receive Response', Object.assign({}, sessionInfo, {intent: intent}));

				if (intent == 'Intent.Confirmation_Yes') {
					utils.endConversation(session, 'complete');
				}
				else if (intent == 'Intent.Location_Inquiry') {
					utils.endConversation(session, 'complete');
				}
				else if (intent == 'Intent.confirmation_No') {				
					utils.endConversation(session, 'complete_n');
				}
				else {
					utils.endConversation(session, 'complete');
				}
			});  		
		}
		catch (err) {
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
			utils.endConversation(session, 'error');
		}
	}
]);

module.exports.createLibrary = function(){
    return lib.clone();
};
