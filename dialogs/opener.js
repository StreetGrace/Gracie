var builder = require('botbuilder');
var apiai = require('./../utils_bot/ApiaiRecognizer');
var utils = require('./../utils_dialog/utils');
var utilsTime = require('./../utils_dialog/utils_Time');
var utilsService = require('./../utils_dialog/utils_Service');
var lib_router = require('./../utils_bot/IntentRouter');

var lib = new builder.Library('opener');
lib.recognizer(apiai.recognizer);

/*
*	Route incoming message to sub-dialogs based on detected intent
*/
lib.dialog('/', function(session, args, next){	
	session.send('[Start Opener Dialog]');   
	lib_router.routeMessage(lib, session);	
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
		session.send('[Start Greeting Dialog]');
		
		var entities = args.intent.entities;
		utils.fillProfile(session, 'Greeting', entities);
		
		var appt = session.userData.profile.appointment; 
		var demo = session.userData.profile.demographic;

		var name = demo.name || '';
		var modelName = session.userData.profile.default.model;
		var reply = `hey ${name}.....`;

		reply += 'so are you looking 4 a good time?'
		session.send(reply);

		var neighborhood = session.userData.profile.default.neighborhood;
		var data = null;
		data = utilsService.fillService(data);
		reply = `incall only in ${neighborhood}, not old enough to drive..`
		session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});	
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
		session.send('[Start Availability Dialog]');
		console.log(session.message.text);
		var entities = args.intent.entities;
		utils.fillProfile(session, 'Availability', entities);
		session.send('Updated Profile: %j', session.userData.profile);		
		var appt = session.userData.profile.appointment;
		var demo = session.userData.profile.demographic;

		var name = demo.name || '';
		var modelName = session.userData.profile.default.model;
		var reply = `hey ${name}..ready for fun...`;		

		var givenTime = utilsTime.fillTime(appt['exact-time'], appt['relative-time']);
		if (givenTime.complete || givenTime.partial) {
			reply += " and i'm free at that time.";
		}

		session.send(reply);
		reply = '';

		if (appt.location) {
			session.send('%j', appt.location);
			var apptLocation = utils.getEntity('location', appt.location);
			var neighborhood = session.userData.profile.default.neighborhood;
			if (apptLocation['atlanta-neighborhood']) {
				if (apptLocation['atlanta-neighborhood'] == neighborhood) {
					reply += ` incall only cuz im not old enough to drive lol.`
				}
				else {
					reply += ` buuut incall only in ${neighborhood}, not old enough to drive.`;
				}				
			}	
		}

		if (!givenTime.complete && !givenTime.partial && 'when' in session.message.text) {
			reply += 'i am available today lol....'
		}
		
		if (appt.service) {
			var apptService = utils.getEntity('service', appt.service);
			var data = utilsService.fillService(apptService);
			var neighborhood = session.userData.profile.default.neighborhood;
			
			if (!appt.location.length && data.inout != 'incall') {
				var neighborhood = session.userData.profile.default.neighborhood;
				reply += `i only do incall in ${neighborhood}. not old enough to drive.`
			}
			
			session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});					
		}	
		else {
			var data = null;
			data = utilsService.fillService(data);				
			if (!appt.location.length) {
				var neighborhood = session.userData.profile.default.neighborhood;
				reply += `i only do incall in ${neighborhood}. not old enough to drive.`
			}
			session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});
		}
	}
]);

/*
*	1. Greet user.
*	2. dialog confirmService.
*/
lib.dialog('/intent.service_inquiry', [
	function (session, args, next){		
		session.send('[Start Service Inquiry Dialog]');
		var entities = args.intent.entities;
		utils.fillProfile(session, 'Service', entities);
		session.send('%j', session.userData.profile);		
		var appt = session.userData.profile.appointment;
		var demo = session.userData.profile.demographic;
		
		var name = demo.name || '';
		var modelName = session.userData.profile.default.model;
		var reply = `hey ${name}.....`;

		session.send(reply);
		reply = '';

		var apptService = utils.getEntity('service', appt.service);
		var data = utilsService.fillService(apptService);

		var neighborhood = session.userData.profile.default.neighborhood;
		if ('inout' in apptService && apptService.inout == 'outcall') {
			reply += `i only do incall in ${neighborhood}. not old enough to drive.`
		}		
	
		session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});	
	}
]);

/*
*	1. Greet user.
*	2. dialog confirmPrice.
*/
lib.dialog('/intent.price_inquiry', [
	function(session, args, next){
		session.send('[Start Price Inquiry Dialog]');
		var entities = args.intent.entities;
		utils.fillProfile(session, 'Price', entities);
		session.send('%j', session.userData.profile);			

		var appt = session.userData.profile.appointment;
		var demo = session.userData.profile.demographic;	
		
		var name = demo.name || '';
		var modelName = session.userData.profile.default.model;
		var reply = `hey ${name}.....`;

		session.send(reply);
		reply = '';

		var apptService = utils.getEntity('service', appt.service);
		var data = utilsService.fillService(apptService);

		if (data) {
            if (!session.userData.profile.confirmation.price.priceListGiven) {
                reply += 'donations are 100 for HH, 150 for H. ';
                session.userData.profile.confirmation.price.priceListGiven = 1;
                session.userData.profile.confirmation.price.priceGiven['30min'] = 1;
                session.userData.profile.confirmation.price.priceGiven['1 hour'] = 1;
            }
            if (data.has_duration && data.duration != '30min' && data.duration != '1 hour') {
                reply += utils.priceTable[data.duration] + ' for ' + data.duration + '.';
                session.userData.profile.confirmation.price.priceGiven[data.duration] = 1;
            }
            if (data.has_inout && data.inout == 'outcall') {
                reply += "you'll need to call uber or lyft to pick me. ";
                session.userData.profile.confirmation.price.priceGiven.inout = 1;
                session.dialogData.givenService.flag_rejectOut = 0;
            }
            if (data.has_addon) {
                reply += 'any fetish thing is 50 extra..';
                session.userData.profile.confirmation.price.priceGiven.addon = 1;
			}
		}		
		if (data.has_inout && data.inout != 'incall') {
			reply += `i only do incall in ${neighborhood}. not old enough to drive.`
		}

		session.beginDialog('confirmService:/', {data: data, reprompt: 0});	
	}
]);

/*
*	1. Greet user.
*	2. Give neighbourhood and switch to Service.
*/
lib.dialog('/intent.location_inquiry', [
	function(session, args, next){
		session.send('[Start Location Inquiry Dialog]');
		var entities = args.intent.entities;
		utils.fillProfile(session, 'Location', entities);
		session.send('%j', session.userData.profile);		
		var appt = session.userData.profile.appointment;
		var demo = session.userData.profile.demographic;	
		
		var name = demo.name || '';
		var modelName = session.userData.profile.default.model;
		var reply = `hey ${name}.....`;

		session.send(reply);
		reply = '';

		var apptLocation = utils.getEntity('location', appt.location);
		var apptService = utils.getEntity('service', appt.service);
		var data = utilsService.fillService(apptService);
		var neighborhood = session.userData.profile.default.neighborhood;

		reply += `im in ${neighborhood}, incall only cuz im not old enough to drive lol.`;
		
		session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});
	}
]);

/*
*	1. Try to start conversation
*/
lib.dialog('/intent.unhandled', [
	function (session, args, next) {
		var neighborhood = session.userData.profile.default.neighborhood;
		var data = utilsService.fillService(null);
		var reply = 'Hey....not sure what u mean. wahtever r u looking 4 a good time together?';
		session.send(reply);
		reply = `incall only in ${neighborhood}, not old enough to drive lol` ;
		session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});
	}
]);

module.exports.createLibrary = function(){
    return lib.clone();
};

