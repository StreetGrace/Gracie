var builder = require('botbuilder');
var apiai = require('./../utils_bot/ApiaiRecognizer');
var utils = require('./../utils_dialog/utils');
var utilsTime = require('./../utils_dialog/utils_Time');
var utilsService = require('./../utils_dialog/utils_Service');
var lib_router = require('./../utils_bot/IntentRouter');

var lib = new builder.Library('main');

/*
*	Route incoming message to sub-dialogs based on detected intent
*/
lib.dialog('/', [
	function (session, args, next){
		session.send('[Start Main Dialog]');   
		if (!args.complete_open) {
			session.beginDialog('opener:/');
		}
		else {
			session.send(args.reply);
			var reply = 'Soooo your coming?';
			builder.Prompts.text(reply);
		}
	},
	function (session, args, next) {
		var msg = args.response;
        apiai.recognizer.recognize({message:{text:msg}}, function(error, response) {
            var intent = response.intent;
            var entities = response.entities;
            var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
            var price = entities['price'] ? entities['price'] : null;
    
            if (intent == 'Intent.Confirmation_Yes') {
				var reply = 'Errr sry something just happened cant do it today....text u later';
				session.endConversation(reply);
            }
            else if (intent == 'Intent.Location_Inquiry') {
				var reply = 'Errr sry something just happened cant do it today....text u later';
				session.endConversation(reply);
            }
            else if (intent == 'Intent.confirmation_No') {
				var reply = 'Well whatever';s
				session.endConversation(reply);
			}
			else {
				var reply = 'Errr sry something just happened cant do it today....text u later';
				session.endConversation(reply);				
			}
        });  		
	}
])

// bot.library(require('./dialogs/main').createLibrary());
// bot.library(require('./dialogs/opener').createLibrary());
// bot.library(require('./dialogs/confirmService').createLibrary());
// bot.library(require('./dialogs/confirmTime').createLibrary());

module.exports.createLibrary = function(){
    return lib.clone();
};