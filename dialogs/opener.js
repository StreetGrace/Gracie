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
.beginDialogAction('openGreetingAction', '/intent.greeting', {matches: 'Intent.GiveName'})
.beginDialogAction('openAvailAction', '/intent.availability', {matches: 'Intent.Availability'})
.beginDialogAction('openServiceAction', '/intent.service_inquiry', {matches: 'Intent.Service_Inquiry'})
.beginDialogAction('openLocationAction', '/intent.location_inquiry', {matches: 'Intent.Location_Inquiry'})
.beginDialogAction('openPriceAction', '/intent.price_inquiry', {matches: 'Intent.Price_Inquiry'})
.beginDialogAction('openUnhandled', '/intent.unhandled', {matches: 'Default Fallback Intent'})
.beginDialogAction('openUnhandled', '/intent.unhandled', {matches: /.*/i});


/*
*	1. Try to start conversation
*/
lib.dialog('/intent.unhandled', [
	function (session, args, next) {
		var reply = 'Hey....not sure what u mean. wahtever r u looking 4 a good time together?';
		session.endDialog(reply);
	}
]);


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

		session.endDialog(reply);		
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
		var flag_rejectOut = 0;

		var givenTime = utilsTime.fillTime(appt['exact-time'], appt['relative-time']);
		if (givenTime.complete || givenTime.partial) {
			reply += " and i'm free at that time.";
		}

		if (appt.location) {
			var apptLocation = utils.getEntity('location', appt.location);
			var neighborhood = session.userData.profile.default.neighborhood;
			if (apptLocation['atlanta-neighborhood']) {
				if (apptLocation['atlanta-neighborhood'] == neighborhood) {
					reply += ` incall only cuz im not old enough to drive lol.`
				}
				else {
					reply += ` nah i only do incall in ${neighborhood}, not old enough to drive.`;
				}
				flag_rejectOut = 1;
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
				flag_rejectOut = 1;
			}
			if ('addon' in apptService) {
				if (apptService.addon == 'raw') {
					reply += "only if ur clean and dd free. also need plan b pill cuz dont want to be 14 and pregnant....ur dd free right?";
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
			data.flag_rejectOut = flag_rejectOut;
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
			var flag_rejectOut = 1;
		}
		if ('addon' in apptService) {
			if (apptService.addon == 'raw') {
				reply += "only if ur clean and dd free. also need plan b pill cuz dont want to be 14 and pregnant....ur dd free right?";
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
		data.flag_rejectOut = flag_rejectOut;
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

		if ('inout' in apptService && apptService.inout == 'outcall') {
			reply += `i only do incall in ${neighborhood}. not old enough to drive.`
			var flag_rejectOut = 1;
		}
		data.flag_rejectOut = flag_rejectOut;
		session.beginDialog('confirmPrice:/', {data: data, reprompt: 0});	
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
		data.flag_rejectOut = flag_rejectOut;
		session.beginDialog('confirmService:/', {data: data, reply: reply, reprompt: 0});
	}
]);

module.exports.createLibrary = function(){
    return lib.clone();
};

