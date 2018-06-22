var builder = require('botbuilder');
var apiai = require('./../utils_bot/ApiaiRecognizer');
var utils = require('./../utils_dialog/utils');
var utilsTime = require('./../utils_dialog/utils_Time');
var utilsService = require('./../utils_dialog/utils_Service');
var lib_router = require('./../utils_bot/IntentRouter');
var resDB = require('./../utils_bot/QueryDB');

var botLog = require('./../utils_bot/BotLogger');
var botLogger = botLog.botLog;

var lib = new builder.Library('opener');
lib.recognizer(apiai.recognizer);

/*
*	Route incoming message to sub-dialogs based on detected intent
*/
lib.dialog('/', function(session, args, next){	
	var sessionInfo = utils.getSessionInfo(session);
	botLogger.info('opener:/, Start', sessionInfo);	
	try {
		lib_router.routeMessage(lib, session);	
	}
	catch (err) {
		var errInfo = utils.getErrorInfo(err);
		botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
		utils.endConversation(session, 'error');
	}
})
.beginDialogAction('openGreetingAction', '/intent.greeting', {matches: 'Intent.Greeting'})
.beginDialogAction('openGreetingAction_givename', '/intent.greeting', {matches: 'Intent.GiveName'})
.beginDialogAction('openGreetingAction_flattery', '/intent.greeting', {matches: 'Intent.Flattery'})
.beginDialogAction('openGreetingAction_getpic', '/intent.greeting', {matches: 'Intent.Get_Pic'})

.beginDialogAction('openAvailAction', '/intent.availability', {matches: 'Intent.Availability'})
.beginDialogAction('openAvailAction_time', '/intent.availability', {matches: 'Intent.Give_TimeSlot'})
.beginDialogAction('openLocationAction', '/intent.location_inquiry', {matches: 'Intent.Location_Inquiry'})
.beginDialogAction('openPriceAction', '/intent.price_inquiry', {matches: 'Intent.Price_Inquiry'})
.beginDialogAction('openServiceAction', '/intent.service_inquiry', {matches: 'Intent.Service_Inquiry'})
.beginDialogAction('openServiceAction_giveloc', '/intent.service_inquiry', {matches: 'Intent.Give_Location'})

.beginDialogAction('openUnhandled', '/intent.unhandled', {matches: 'Default Fallback Intent'})
.beginDialogAction('openUnhandled_any', '/intent.unhandled', {matches: utils.intentList_nonOpen})
;

/*
*	1. Refer user by name if name is provided.
*	2. Ask if user want to meet and end dialog. (maybe jump to service dialog, maybe to main dialog with another navigator.)
*/
lib.dialog('/intent.greeting', [
	function(session, args, next ){
		try {	
			var entities = args.intent.entities;
			utils.fillProfile(session, 'Greeting', entities);
			
			var appt = session.userData.profile.appointment; 
			var demo = session.userData.profile.demographic;

			var sessionInfo = utils.getSessionInfo(session);
			botLogger.info('Start opener:/intent.greeting', Object.assign({}, sessionInfo, {appt: appt, demo: demo}));	

			var jonName = demo.name || '';
			var modelName = session.userData.profile.default.model;

			var reply = '';

			resDB.queryRes('opener:/intent.greeting', 0, 0, function (err, result) {
				if (err) {
					console.log(err);
					console.log('error pulling data');
				}
				else {
					var reply_new = result.message;
					reply_new = decodeURIComponent(reply_new).replace(/\+/g, " ");
					reply += eval('`'+ reply_new.replace(/`/g,'\\`') + '`');

				  session.send(reply);
				  
				  var neighborhood = session.userData.profile.default.neighborhood;
				  var data = null;
				  data = utilsService.fillService(data);
				  reply = `incall only in ${neighborhood} cuz i dont have license..`

				  session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});
        		}
      		});
		}
		catch (err) {
            var errInfo = utils.getErrorInfo(err);
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
			utils.endConversation(session, 'error');
		}
	}
]);

/*
*	1. Comfirm availability.
*	2. if location is metioned and is different from default location, tell them default location and incall only.
*	3. if asked 'when' but no time mentioned, suggest 'tonight' and begin confirmTime (can stop when any time is given or user ask about location)
*	4. if service entities are mentioned: outcall --> incall only, not old enough to drive; bare -- don't like it don't want to be 14 and pregnant.
*	5. Begin dialog confirmSerivce.
*/
lib.dialog('/intent.availability', [
	function(session, args, next){
		try {
			var entities = args.intent.entities;
			utils.fillProfile(session, 'Availability', entities);
			
			var appt = session.userData.profile.appointment;
			var demo = session.userData.profile.demographic;
	
			var sessionInfo = utils.getSessionInfo(session);
			botLogger.info('Start opener:/intent.availability', Object.assign({}, sessionInfo, {appt: appt, demo: demo}));	

			var jonName = demo.name || '';
			var modelName = session.userData.profile.default.model;

			resDB.queryRes('opener:/availability', 0, 0, function (err, result) {
				if (err) {
					console.log(err);
					console.log('error pulling data');
				}
				else {
					var reply = result.message;
					reply = decodeURIComponent(reply).replace(/\+/g, " ").replace('there', 'here');
					reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
				  
					var givenTime = utilsTime.fillTime(appt['exact-time'], appt['relative-time']);
					if (givenTime.complete || givenTime.partial) {
						if (givenTime.time == 'now') {
							reply += " and i have time now. first cum first serve. "
						}
						else {
							reply += " and i'm free at that time ";
						}						
					}
					session.send(reply);			
					reply = '';
	
					if (appt.location) {
						var apptLocation = utils.getEntity('location', appt.location);
						var neighborhood = session.userData.profile.default.neighborhood;
						if (apptLocation['atlanta-neighborhood']) {
							if (apptLocation['atlanta-neighborhood'] == neighborhood) {
								reply += ` incall only cuz im not having license ...`
							}
							else {
								reply += ` buuut incall only in ${neighborhood}, dont have license.`;
							}				
						}	
					}
			
					if (!givenTime.complete && !givenTime.partial && session.message.text.toLowerCase().indexOf('when') > -1) {
						reply += 'i am available today lol....'
					}
					
					if (appt.service) {
						var apptService = utils.getEntity('service', appt.service);
						var data = utilsService.fillService(apptService);
						var neighborhood = session.userData.profile.default.neighborhood;
						
						if (!appt.location.length && data.inout != 'incall') {
							var neighborhood = session.userData.profile.default.neighborhood;
							reply += `i only do incall in ${neighborhood}. dont have license.`
						}
						
						session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});	
					}	
					else {
						var data = null;
						data = utilsService.fillService(data);				
						if (!appt.location.length) {
							var neighborhood = session.userData.profile.default.neighborhood;
							reply += `i only do incall in ${neighborhood}. dont have license.`
						}

						session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});
					}
        }
      });
		}
		catch (err) {
			var errInfo = utils.getErrorInfo(err);
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
			
			utils.endConversation(session, 'error');			
		}
	}
]);


/*
*	1. Greet user.
*	2. dialog confirmService.
*/
lib.dialog('/intent.service_inquiry', [
	function (session, args, next){	
		try {
			var entities = args.intent.entities;
			utils.fillProfile(session, 'Service', entities);
			
			var appt = session.userData.profile.appointment;
			var demo = session.userData.profile.demographic;

			var sessionInfo = utils.getSessionInfo(session);
			botLogger.info('Start opener:/intent.service_inquiry', Object.assign({}, sessionInfo, {appt: appt, demo: demo}));				

			var name = demo.name || '';
			var modelName = session.userData.profile.default.model;

			var reply = `hey ${name}.....`;

			session.send(reply);
			reply = '';

			var apptService = utils.getEntity('service', appt.service);
			var data = utilsService.fillService(apptService);

			var neighborhood = session.userData.profile.default.neighborhood;
			if ('inout' in apptService && apptService.inout == 'outcall') {
				reply += `i only do incall in ${neighborhood}. dont have license.`
			}		

			session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});	
		}	
		catch (err) {
            var errInfo = utils.getErrorInfo(err);
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
								
			utils.endConversation(session, 'error');
		}
	}
]);

/*
*	1. Greet user.
*	2. dialog confirmService.
*/
lib.dialog('/intent.price_inquiry', [
	function(session, args, next){
		try {
			var entities = args.intent.entities;
			utils.fillProfile(session, 'Price', entities);

			var appt = session.userData.profile.appointment;
			var demo = session.userData.profile.demographic;	

			var sessionInfo = utils.getSessionInfo(session);
			botLogger.info('Start opener:/intent.price_inquiry', Object.assign({}, sessionInfo, {appt: appt, demo: demo}));	

			var jonName = demo.name || '';
			var modelName = session.userData.profile.default.model;

			resDB.queryRes('opener:/price_inquiry', 0, 0, function (err, result) {
				if (err) {
					console.log(err);
					console.log('error pulling data');
				}
				else {
					var reply = result.message;
					reply = decodeURIComponent(reply).replace(/\+/g, " ");
					reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');

					session.send(reply);
					reply = '';
		
					var apptService = utils.getEntity('service', appt.service);
					var data = utilsService.fillService(apptService);
		
					if (data) {
						if (!session.userData.profile.confirmation.price.priceListGiven) {
							reply += ' donations are 100 for HH, 150 for H. ';
							session.userData.profile.confirmation.price.priceListGiven = 1;
							session.userData.profile.confirmation.price.priceGiven['30min'] = 1;
							session.userData.profile.confirmation.price.priceGiven['1 hour'] = 1;
						}
						if (data.has_duration && data.duration != '30min' && data.duration != '1 hour') {
							reply += utils.priceTable[data.duration] + ' for ' + data.duration + '.';
							session.userData.profile.confirmation.price.priceGiven[data.duration] = 1;
						}
						if (data.has_inout && data.inout == 'outcall') {
							reply += " i dont have license soo you'll need to call uber or lyft to pick me. ";
							session.userData.profile.confirmation.price.priceGiven.inout = 1;
							session.dialogData.givenService.flag_rejectOut = 0;
						}
						if (data.has_addon) {
							reply += ' any fetish thing is 50 extra..';
							session.userData.profile.confirmation.price.priceGiven.addon = 1;
						}
					}		
					if (!(data.has_inout && data.inout == 'incall')) {
						var neighborhood = session.userData.profile.default.neighborhood;
						reply += ` i only do incall in ${neighborhood}. dont have license.`
					}

					session.beginDialog('confirmService:/', {data: data, reprompt: 0, reply: reply});	
				}
			});
		}
		catch (err) {
			var errInfo = utils.getErrorInfo(err);
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
			
			utils.endConversation(session, 'error');
		}
	}
]);

/*
*	1. Greet user.
*	2. Give neighbourhood and switch to Service.
*/
lib.dialog('/intent.location_inquiry', [
	function(session, args, next){
		try {
			var entities = args.intent.entities;
			utils.fillProfile(session, 'Location', entities);
			
			var appt = session.userData.profile.appointment;
			var demo = session.userData.profile.demographic;	

			var sessionInfo = utils.getSessionInfo(session);
			botLogger.info('Start opener:/intent.location_inquiry', Object.assign({}, sessionInfo, {appt: appt, demo: demo}));

			var jonName = demo.name || '';
			var modelName = session.userData.profile.default.model;

			resDB.queryRes('opener:/location_inquiry', 0, 0, function (err, result) {
				if (err) {
					console.log(err);
					console.log('error pulling data');
				}
				else {
					var reply = result.message;
					reply = decodeURIComponent(reply).replace(/\+/g, " ");
					reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');

					session.send(reply);
								
					reply = '';

					var apptLocation = utils.getEntity('location', appt.location);
					var apptService = utils.getEntity('service', appt.service);
					var data = utilsService.fillService(apptService);
					var neighborhood = session.userData.profile.default.neighborhood;

					reply += ` im in ${neighborhood}, incall only cuz im not having license lol.`;

					session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});
				}
			});
			
		}
		catch (err) {
			var errInfo = utils.getErrorInfo(err);
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
			
			utils.endConversation(session, 'error');
		}
	}
]);


/*
*	1. Try to start conversation
*/
lib.dialog('/intent.unhandled', [
	function (session, args, next) {
		try {
			var neighborhood = session.userData.profile.default.neighborhood;
			var data = utilsService.fillService(null);

			var sessionInfo = utils.getSessionInfo(session);
			botLogger.info('Start opener:/intent.greeting', sessionInfo);	

			resDB.queryRes('opener:/unhandled', 0, 0, function (err, result) {
				if (err) {
					console.log(err);
					console.log('error pulling data');
				}
				else {
					var reply = result.message;
					reply = decodeURIComponent(reply).replace(/\+/g, " ");
					reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
					session.send(reply);
					reply = `incall only in ${neighborhood}, dont have license lol` ;

					session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});
				}
			});				
		}
		catch (err) {
			var errInfo = utils.getErrorInfo(err);
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
			
			utils.endConversation(session, 'error');
		}
	}
]);

module.exports.createLibrary = function(){
    return lib.clone();
};
