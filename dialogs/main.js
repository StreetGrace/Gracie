var builder = require('botbuilder');
var apiai = require('./../utils_bot/ApiaiRecognizer');
var utils = require('./../utils_dialog/utils');
var utilsTime = require('./../utils_dialog/utils_Time');
var utilsService = require('./../utils_dialog/utils_Service');
var lib_router = require('./../utils_bot/IntentRouter');
var blacklist = require('./../utils_bot/Blacklist');

var lib = new builder.Library('main');

/*
*	Route incoming message to sub-dialogs based on detected intent
*/
lib.dialog('/', [
	function (session, args, next){
		// session.send('[Start Main Dialog]');  
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
					reply += `donation is ${utils.priceTable[duration]}. `;
				}
				reply += 'Soooo your coming?';
				builder.Prompts.text(session, reply);
			}
		} 
		catch (err) {
			console.log('Error running main dialog', err);
            var reply = 'sry got to go, text u later';
            blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
            session.endConversation(reply);
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
		
				if (intent == 'Intent.Confirmation_Yes') {
					setTimeout(function(){
						var reply = 'Errr sry something just happened cant do it today....text u later';
						blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
						session.endConversation(reply);	
					}, 5000)
				}
				else if (intent == 'Intent.Location_Inquiry') {
					setTimeout(function(){
						var reply = 'Errr sry something just happened cant do it today....text u later';
						blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
						session.endConversation(reply);
					}, 5000)
				}
				else if (intent == 'Intent.confirmation_No') {
					setTimeout(function(){
						var reply = 'Well whatever';
						blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
						session.endConversation(reply);
					}, 50/00)
					
				}
				else {
					setTimeout(function(){
						var reply = 'Errr sry something just happened cant do it today....text u later';
						blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
						session.endConversation(reply);				
					}, 5000)

				}
			});  		
		}
		catch (err) {
            var reply = 'sry got to go, text u later';
            blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
            session.endConversation(reply);
		}
	}
])
setTimeout(function(){

}, 2500)
// bot.library(require('./dialogs/main').createLibrary());
// bot.library(require('./dialogs/opener').createLibrary());
// bot.library(require('./dialogs/confirmService').createLibrary());
// bot.library(require('./dialogs/confirmTime').createLibrary());

module.exports.createLibrary = function(){
    return lib.clone();
};
