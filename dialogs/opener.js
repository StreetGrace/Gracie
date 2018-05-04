var builder = require('botbuilder');
var apiai = require('./apiai_recognizer');
var utils = require('./utils');
var utilsTime = require('./utils_time');
var utilsService = require('./utils_service');
var lib_router = require('./lib_router');

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
.beginDialogAction('openAvailAction', '/intent.availability', {matches: 'Intent.Availability'})
.beginDialogAction('openServiceAction', '/intent.service_inquiry', {matches: 'Intent.Service_Inquiry'})
.beginDialogAction('openLocationAction', '/intent.location_inquiry', {matches: 'Intent.Location_Inquiry'})
.beginDialogAction('openPriceAction', '/intent.price_inquiry', {matches: 'Intent.Price_Inquiry'})
.cancelAction('cancelAction', '[Unindentified Intent, Directing to Main]', {matches: 'Default Fallback Intent'});

/*
*	1. Refer user by name if name is provided.
*	2. If model name is mentioned, and different from default, correct user. (maybe only correct if they are too different)
*	3. Ask if user want to meet and end dialog. (maybe jump to service dialog, maybe to main dialog with another navigator.)
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

		if (appt.model && appt.model != modelName) {
			reply += `it is ${modelName} lol...`
		}

		reply += 'so are you looking 4 a good time?'

		session.endDialog(reply);		
	}
]);

/*
*	1. Comfirm availability.
*	2. If model name is mentioned, and different from default, correct user. (maybe only correct if they are too different)
*	3. if location is metioned and is different from default location, tell them default location and incall only.
*	4. if asked 'when' but no time mentioned, suggest 'tonight' and begin confirmTime (can stop when any time is given or user ask about location)
*	5. if service entities are mentioned: outcall --> incall only, not old enough to drive; bare -- don't like it don't want to be 14 and pregnant.
*	6. Begin dialog confirmSerivce.
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
		var outcall_flag = 0;

		if (appt.model && appt.model != modelName) {
			reply += `it is ${modelName} lol...`
		}

		var givenTime = utilsTime.fillTime(appt['exact-time'], appt['relative-time']);
		if (givenTime.complete || givenTime.partial) {
			reply += " free around that time.";
		}

		if (appt.location) {
			var apptLocation = utils.getEntity('location', appt.location);
			var neighborhood = session.userData.profile.default.neighborhood;
			if (apptLocation['atlanta-neighborhood']) {
				if (apptLocation['atlanta-neighborhood'] == neighborhood) {
					reply += `yeah im in ${neighborhood}, incall only cuz im not old enough to drive lol.`
				}
				else {
					reply += `nah i only do incall in ${neighborhood}, not old enough to drive.`;
				}
				outcall_flag = 1;
			}	
		}
		
		session.send(reply);

		if (!givenTime.complete && !givenTime.partial && 'when' in session.message.text) {
			reply = 'tonight is good....or u have time in mind?'
			session.beginDialog('confirmTime:/', {data: givenTime, reply: reply, reprompt: 0});
		}
		
		reply = '';
		if (appt.service) {
			var apptService = utils.getEntity('service', appt.service);
			var data = utilsService.fillService(apptService);
			var neighborhood = session.userData.profile.default.neighborhood;
			if ('inout' in apptService && apptService.inout == 'outcall' && !outcall_flag) {
				reply += `i only do incall in ${neighborhood}. not old enough to drive.`
				outcall_flag = 1;
			}
			if ('addon' in apptService) {
				if (apptService.addon == 'raw') {
					reply += "bare only if u . dont want to be 14 and pregnant....";
				}
				else if (apptService.addon == 'bdsm') {
					reply += "im mean im open minded.. fetishes are 50 extra... just dont want you to hurt me lol"
				}
				else if (apptService.addon == 'girlfriend experience') {
					reply += "yeah why not lol. still have to pay $"
				}
				else {
					reply += "im mean im open minded.. fetishes are 50 extra... "
				}
			}	
			data.outcall_flag = outcall_flag;
			session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});					
		}	
		else {
			next();
		}
	},
	function (session, args, next) {
		session.endDialog();
	}
]);

/*
*	1. Greet user.
*	2. If model name is mentioned, and different from default, correct user. (maybe only correct if they are too different)
*	3. dialog confirmService.
*/
lib.dialog('/intent.service_inquiry', [
	function(session, args, next){		
		session.send('[Start Service Inquiry Dialog]');
		var entities = args.intent.entities;
		utils.fillProfile(session, 'Service', entities);
		session.send('%j', session.userData.profile);		
		var appt = session.userData.profile.appointment;
		var demo = session.userData.profile.demographic;
		
		var name = demo.name || '';
		var modelName = session.userData.profile.default.model;
		var reply = `hey ${name}.....`;

		if (appt.model && appt.model != modelName) {
			reply += `it is ${modelName} lol...`
		}

		session.send(reply);

		var apptService = utils.getEntity('service', appt.service);
		var data = utilsService.fillService(apptService);

		session.beginDialog('confirmService:/', {data: data, reprompt: 0});
	}
]);

/*
*	1. Greet user.
*	2. If model name is mentioned, and different from default, correct user. (maybe only correct if they are too different)
*	3. dialog confirmPrice.
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

		if (appt.model && appt.model != modelName) {
			reply += `it is ${modelName} lol...`
		}

		session.send(reply);

		var apptService = utils.getEntity('service', appt.service);
		var data = utilsService.fillService(apptService);

		session.beginDialog('confirmPrice:/', {data: data, reprompt: 0});	
	}
]);

/*
*	1. Greet user.
*	2. If model name is mentioned, and different from default, correct user. (maybe only correct if they are too different)
*	3. dialog confirmPrice.
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

		if (appt.model && appt.model != modelName) {
			reply += `it is ${modelName} lol...`
		}

		var apptLocation = utils.getEntity('location', appt.location);
		var neighborhood = session.userData.profile.default.neighborhood;
		if (apptLocation['atlanta-neighborhood']) {
			if (apptLocation['atlanta-neighborhood'] == neighborhood) {
				reply += `yeah im in ${neighborhood}, incall only cuz im not old enough to drive lol.`
			}
			else {
				reply += `nah i only do incall in ${neighborhood}, im not old enough to drive.`;
			}
		}	
		else {
			reply += `im doing incall only in ${neighborhood}, not old enough to drvie lol.`
		}
	}
]);

module.exports.createLibrary = function(){
    return lib.clone();
};

