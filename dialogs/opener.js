var builder = require('botbuilder');
var apiai = require('./../utils_bot/ApiaiRecognizer');
var utils = require('./../utils_dialog/utils');
var utilsTime = require('./../utils_dialog/utils_Time');
var utilsService = require('./../utils_dialog/utils_Service');
var lib_router = require('./../utils_bot/IntentRouter');
var db = require('./../utils_bot/QueryDB_1');

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
		utils.endConversation(session, 'error', botLogger);
	}
})
.beginDialogAction('openGreetingAction', '/intent.greeting', {matches: 'General.Greeting'})
.beginDialogAction('openGreetingAction_givename', '/intent.greeting', {matches: 'General.GiveName'})
.beginDialogAction('openGreetingAction_flattery', '/intent.greeting', {matches: 'General.Flattery'})
.beginDialogAction('openGreetingAction_getpic', '/intent.greeting', {matches: 'General.Get_Pic'})

.beginDialogAction('openAvailAction', '/intent.availability', {matches: 'General.Availability'})
.beginDialogAction('openAvailAction_time', '/intent.availability', {matches: 'General.Give_TimeSlot'})
.beginDialogAction('openLocationAction', '/intent.location_inquiry', {matches: 'General.Location_Inquiry'})
.beginDialogAction('openPriceAction', '/intent.price_inquiry', {matches: 'General.Price_Inquiry'})
.beginDialogAction('openServiceAction', '/intent.service_inquiry', {matches: 'General.Service_Inquiry'})
.beginDialogAction('openServiceAction_giveloc', '/intent.service_inquiry', {matches: 'General.Give_Location'})

.beginDialogAction('openUnhandled', '/intent.unhandled', {matches: 'Default Fallback Intent'})
.beginDialogAction('openUnhandled_any', '/intent.unhandled', {matches: utils.IntentList_nonOpen})
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
			
			var modelName = session.userData.profile.default.model;
			var jonName = demo.name || '';
			if (jonName.toLowerCase() == modelName.toLowerCase()) {
				jonName = '';
			}
		
			var neighborhood = session.userData.profile.default.neighborhood;
			
			var data = null;
			data = utilsService.fillService(data);
			
			var reply = '';
			db.queryDB('opener:/intent.greeting', 0, 0)
				.then( res => {
					reply += eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');
					session.send(reply);	 
					reply = '';

				  	return db.queryDB('opener:/intent.greeting', 1, 0);	  
				},	err => {
					utils.throwErr(err);
				})
				.then ( res => {
					reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');
					session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});					
				}, err => {
					utils.throwErr(err);
				})
				.catch (err => {
					var errInfo = utils.getErrorInfo(err);
					botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
					utils.endConversation(session, 'error', botLogger);
				})
		}
		catch (err) {
            var errInfo = utils.getErrorInfo(err);
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
			utils.endConversation(session, 'error', botLogger);
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
			var sessionInfo = utils.getSessionInfo(session);
			botLogger.info('Start opener:/intent.availability', Object.assign({}, sessionInfo, {appt: appt, demo: demo}));	

			var entities = args.intent.entities;
			utils.fillProfile(session, 'Availability', entities);
			
			var appt = session.userData.profile.appointment;
			var demo = session.userData.profile.demographic;
			var givenTime = utilsTime.fillTime(appt['exact-time'], appt['relative-time']);

			if (appt.location) {
				var apptLocation = utils.getEntity('location', appt.location);
			}
	
			if (appt.service) {
				var apptService = utils.getEntity('service', appt.service);
				var data = utilsService.fillService(apptService);
			}
			else {
				var data = null;
				data = utilsService.fillService(data);				
				}

			var modelName = session.userData.profile.default.model;
			var jonName = demo.name || '';
			if (jonName.toLowerCase() == modelName.toLowerCase()) {
				jonName = '';
			}
			
			var neighborhood = session.userData.profile.default.neighborhood;

			var reply = '';
			db.queryDB('opener:/availability', 0, 0)
				.then( res => {
					reply += eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');
					
					if (givenTime.complete || givenTime.partial) {
						if (givenTime.time == 'now') {
							return db.queryDB('opener:/availability', 0, 4);
						}
						else {
							return db.queryDB('opener:/availability', 0, 1);
						}
					}
					return '';	
				}, err => {
					utils.throwErr(err);
				})
				.then( res => {
					if (res) {
						reply += (reply ? '. ' : '') + eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');
					}
					
					if (!givenTime.complete && !givenTime.partial && session.message.text.toLowerCase().indexOf('when') > -1) {
						return db.queryDB('opener:/availability', 0, 4);
					}			
					
					return ''		
				}, err => {
					utils.throwErr(err);
				})
				.then ( res => {
					if (res) {
						reply += (reply ? '. ' : '') + eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');;
					}					
					session.send(reply);
					reply = '';

					if (appt.location) {
						var key = session.userData.profile.default.city.toLowerCase();
						if (apptLocation[key+'-neighborhood']) {
							if (apptLocation[key+'-neighborhood'].toLowerCase() == neighborhood.toLowerCase()) {
								return db.queryDB('opener:/availability', 0, 2);
							}
							else {
								return db.queryDB('opener:/availability', 0, 3);
							}				
						}	
						return '';
					}
				}, err => {
					utils.throwErr(err);
				})
				.then( res=> {
					if (res) {
						reply = (reply ? '. ' : '') + eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');;
					}
					
					if (!appt.location.length && data.inout != 'incall') {
						return db.queryDB('opener:/availability', 0, 5);
					}
					return '';
				}, err => {
					utils.throwErr(err);
				})
				.then( res=> {
					if (res) {
						reply += (reply ? '. ' : '') + eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');;
					}
					session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});
				}, err => {
					utils.throwErr(err);
				})
				.catch( err => {
					var errInfo = utils.getErrorInfo(err);
					botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
					
					utils.endConversation(session, 'error', botLogger);						
				})
		}
		catch (err) {
			var errInfo = utils.getErrorInfo(err);
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
			
			utils.endConversation(session, 'error', botLogger);			
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

			var apptService = utils.getEntity('service', appt.service);
			var data = utilsService.fillService(apptService);

<<<<<<< HEAD
			var jonName = demo.name || '';
=======
>>>>>>> develop
			var modelName = session.userData.profile.default.model;
			var jonName = demo.name || '';
			if (jonName.toLowerCase() == modelName.toLowerCase()) {
				jonName = '';
			}
			var neighborhood = session.userData.profile.default.neighborhood;

			var reply = '';

			db.queryDB('opener:/service_inquiry', 0, 0)
				.then( res=> {
					reply += eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');
					session.send(reply);
					reply = '';

					if (!('inout' in apptService && apptService.inout == 'incall')) {
						return db.queryDB('opener:/service_inquiry', 0, 1);
					}
					return '';
				}, err => {
					utils.throwErr(err);
				})
				.then( res=> {
					if (res) {
						reply = (reply ? '. ' : '') + eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');;
					}
					session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});	
				}, err => {
					utils.throwErr(err);
				})
				.catch( err => {
					var errInfo = utils.getErrorInfo(err);
					botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
					
					utils.endConversation(session, 'error', botLogger);						
				})		
		}	
		catch (err) {
            var errInfo = utils.getErrorInfo(err);
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
								
			utils.endConversation(session, 'error', botLogger);
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

			var apptService = utils.getEntity('service', appt.service);
			var data = utilsService.fillService(apptService);

			var sessionInfo = utils.getSessionInfo(session);
			botLogger.info('Start opener:/intent.price_inquiry', Object.assign({}, sessionInfo, {appt: appt, demo: demo}));	

			var modelName = session.userData.profile.default.model;
			var jonName = demo.name || '';
			if (jonName.toLowerCase() == modelName.toLowerCase()) {
				jonName = '';
			}
			
			var neighborhood = session.userData.profile.default.neighborhood;

			var reply = '';

			db.queryDB('opener:/price_inquiry', 0, 0)
				.then( res=> {
					reply += eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');
					session.send(reply);
					reply = '';
	
					if (data) {
						if (!session.userData.profile.confirmation.price.priceListGiven) {
							reply += ' donations are 80 for HH, 120 for H. ';
							session.userData.profile.confirmation.price.priceListGiven = 1;
							session.userData.profile.confirmation.price.priceGiven['30min'] = 1;
							session.userData.profile.confirmation.price.priceGiven['1 hour'] = 1;
						}
						if (data.has_duration && data.duration != '30min' && data.duration != '1 hour') {
							reply += utils.priceTable[data.duration] + ' for ' + data.duration + '.';
							session.userData.profile.confirmation.price.priceGiven[data.duration] = 1;
						}
						if (data.has_inout && data.inout == 'outcall') {
							reply += " i dont have license soo you'll need to buy me uber or lyft.";
							session.userData.profile.confirmation.price.priceGiven.inout = 1;
							data.flag_rejectOut = 0;
						}
						if (data.has_addon) {
							reply += ' any fetish thing is 50 extra..';
							session.userData.profile.confirmation.price.priceGiven.addon = 1;
						}
					}	

					if (!(data.has_inout && data.inout == 'incall') && data.flag_rejectOut) {
						return db.queryDB('opener:/price_inquiry', 0, 4);
					}
					return '';
				}, err => {
					utils.throwErr(err);
				})
				.then( res=> {
					if (res) {
						reply += (reply ? '. ' : '') + eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');;
					}				
					session.beginDialog('confirmService:/', {data: data, reprompt: 0, reply: reply});	
				}, err => {
					utils.throwErr(err);
				})
				.catch( err => {
					var errInfo = utils.getErrorInfo(err);
					botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
					
					utils.endConversation(session, 'error', botLogger);						
				})		
		}
		catch (err) {
			var errInfo = utils.getErrorInfo(err);
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
			
			utils.endConversation(session, 'error', botLogger);
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

			var apptLocation = utils.getEntity('location', appt.location);
			var apptService = utils.getEntity('service', appt.service);
			var data = utilsService.fillService(apptService);
			var neighborhood = session.userData.profile.default.neighborhood;

			var sessionInfo = utils.getSessionInfo(session);
			botLogger.info('Start opener:/intent.location_inquiry', Object.assign({}, sessionInfo, {appt: appt, demo: demo}));

			var modelName = session.userData.profile.default.model;
			var jonName = demo.name || '';
			if (jonName.toLowerCase() == modelName.toLowerCase()) {
				jonName = '';
			}
			
			var reply = '';

			db.queryDB('opener:/location_inquiry', 0, 0)
				.then( res=> {
					reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');
					session.send(reply);								
					reply = '';

					return db.queryDB('opener:/location_inquiry', 0, 1);
				}, err => {
					utils.throwErr(err);
				})
				.then( res=> {
					if (res) {
						reply += (reply ? '. ' : '') + eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');;
					}		
					session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});
				}, err => {
					utils.throwErr(err);
				})
				.catch( err => {
					var errInfo = utils.getErrorInfo(err);
					botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
					
					utils.endConversation(session, 'error', botLogger);						
				})				
		}
		catch (err) {
			var errInfo = utils.getErrorInfo(err);
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
			
			utils.endConversation(session, 'error', botLogger);
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

			var reply = '';

			db.queryDB('opener:/unhandled', 0, 0)
			.then( res=> {
				reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');
				session.send(reply);								
				reply = '';

				return db.queryDB('opener:/location_inquiry', 0, 1);
			}, err => {
				utils.throwErr(err);
			})
			.then( res=> {
				if (res) {
					reply += (reply ? '. ' : '') + eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');;
				}		
				session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});
			}, err => {
				utils.throwErr(err);
			})
			.catch( err => {
				var errInfo = utils.getErrorInfo(err);
				botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
				
				utils.endConversation(session, 'error', botLogger);						
			})				
		}
		catch (err) {
			var errInfo = utils.getErrorInfo(err);
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
			
			utils.endConversation(session, 'error', botLogger);
		}
	}
]);

module.exports.createLibrary = function(){
    return lib.clone();
};
