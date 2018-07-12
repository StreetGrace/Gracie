/*
* @TODO: 
*   1. handle duration in suggestTIme
*   2. add Intent givenNoTimeSlot and handle when user provide time window when they are unavailable
*/
var builder = require('botbuilder');
var apiai = require('./../utils_bot/ApiaiRecognizer');
var utils = require('./../utils_dialog/utils');
var utilsTime = require('./../utils_dialog/utils_Time');

var lib = new builder.Library('confirmTime');

lib.dialog('/', [
    function (session, args, next) {
        session.send('[Start ConfirmTime Dialog]');
        session.dialogData.givenTime = args.data;
        session.dialogData.reprompt = args.reprompt;
        session.send('GivenTime: %j', session.dialogData.givenTime);
        session.send('Reprompt: %d', args.reprompt);
        
        if (args.data.complete) {
			session.userData.profile.confirmation.time.date = utilsTime.parseDate(args.data.date);	
				[session.userData.profile.confirmation.time.hour,
                    session.userData.profile.confirmation.time.minute] = utilsTime.parseDate(args.data.time);		           
            var reply =  "perfect, let's meet at that time!";
            session.send(reply);
            session.endDialogWithResult({data: args.data});
        }
        else if (args.reprompt > 3) {
            var reply = "you are wasting my time, now drop off my number.";
            session.endConversation(reply);
        }
        else if (args.reply) {
            builder.Prompts.text(session, args.reply);
        }
        else {
            var reply = 'so what time works for you?';
            builder.Prompts.text(session, reply);
        }
        
    },
    function (session, args, next) {
        var msg = args.response;
        apiai.recognizer.recognize({message:{text:msg}}, function(error, response) {
            var intent = response.intent;
            var entities = response.entities;
            var exactTime = (entities['exact-time'] && entities['exact-time'].length > 0) ? entities['exact-time'] : null;
            var relativeTime = entities['relative-time'] || null;
            var givenTime = session.dialogData.givenTime;
            session.send('givenTime: %j', givenTime);
            session.send('exactTime: %j', exactTime);
            session.send('relativeTime: %j', relativeTime);
            //if response irrelevant
            if (intent != 'Intent.Availability' && 
                !(['Default Fallback Intent', 'Intent.Give_TimeSlot'].indexOf(intent) >= 0 && (exactTime || relativeTime))) {
                session.beginDialog('/continueTime', {data: session.dialogData.givenTime, reprompt: 0, reprompt_stored: session.dialogData.reprompt});
            }
            //if no time given, suggest time
            else if (!exactTime && !relativeTime) {
                session.beginDialog('/suggestTime', {data: session.dialogData.givenTime, reprompt: session.dialogData.reprompt});
            }
            else {
                var givenTime_new = utilsTime.fillTime(exactTime, relativeTime);     
                // console.log('New givenTime: %j', givenTime_new);
                session.send('Newly Accepted Time input: %j', givenTime_new);
                if (givenTime && givenTime.date && givenTime.date != 'today' && (!exactTime || !exactTime.date)) {
                    givenTime_new.date = givenTime.date;
                }
                givenTime_new.date = givenTime_new.date || givenTime.date;
                givenTime_new.time = givenTime_new.time || givenTime.time;
                givenTime_new.complete = (givenTime_new.date && givenTime_new.time && givenTime_new.time != 'now') ? 1 : 0;
                givenTime_new.exactTime =  Object.keys(givenTime_new.exactTime).length > 0 ? givenTime_new.exactTime : givenTime.exactTime;
                givenTime_new.relativeTime = Object.keys(givenTime_new.relativeTime).length > 0 ? givenTime_new.relativeTime : givenTime.relativeTime;   
                session.send('Updated givenTime: %j', givenTime_new)       
                if (givenTime_new.complete) {
                    var date = utilsTime.parseDate(givenTime_new.date);	
                    var [hour, min] = utilsTime.parseTime(givenTime_new.time);
                    session.userData.profile.confirmation.time.date = date;
                    [session.userData.profile.confirmation.time.hour,
                        session.userData.profile.confirmation.time.minute] = [hour, min];	
                    var reply = `Perfect, I'll see you at ${hour}` + (min ? `:${min}` : '') + ` ${date}`;
                    session.send(reply);	
                    session.endDialogWithResult({data: {date: givenTime_new.date, time: givenTime_new.time}});
                } 
                else {
                    var reply = 'sure, can you be more specific?';
                    session.send('Switch back with data: %j', givenTime_new);
                    session.replaceDialog('/', {data: givenTime_new, reply: reply, reprompt: session.dialogData.reprompt + 1});
                }    
            }
        });  
    }
]);
//1. More variation of reprompt response and increase reprompt limit
//2. Direct some of intents to other dialogs and return
//3. Add one-sentence handler and continue current topic
lib.dialog('/continueTime', [
    function (session, args, next) {
        if (args.reprompt > 1) {
            var reply = "Drop off my number you are wasting my time.";
            session.endConversation(reply);
        }        
        else {
            session.dialogData.givenTime = args.data;
            session.dialogData.reprompt = args.reprompt;
            session.dialogData.reprompt_stored = args.reprompt_stored;
            session.send('reprompt: %d', args.reprompt);
            if (args && args.reprompt) {
                var reply = 'can we confirm time first?';
                builder.Prompts.text(session, reply);
            }
            else {
                var reply = 'Mind letting me know what time you have in mind first?';
                builder.Prompts.text(session, reply);
            }      
        }
    },
    function (session, args, next) {
        var msg = args.response;
        apiai.recognizer.recognize({message:{text:msg}}, function(error, response){
            var intent = response.intent;
            var entities = response.entities || '';
            var exactTime = (entities['exact-time'] && entities['exact-time'].length > 0) ? entities['exact-time'] : null;
            var relativeTime = entities['relative-time'] || null;
            if (intent == 'Intent.Confirmation_Yes' || 
                ((intent == 'Intent.Give_TimeSlot' || intent == 'Intent.Availability') && 
                ((exactTime && exactTime.length > 0) || relativeTime))) {
                var reply = 'great!';
                session.send(reply);
                var givenTime = session.dialogData.givenTime;
                var givenTime_new = utilsTime.fillTime(exactTime, relativeTime);
                
                givenTime_new.date = givenTime_new.date || givenTime.date;
                givenTime_new.time = givenTime_new.time || givenTime.time;
                givenTime_new.complete = (givenTime_new.date && givenTime_new.time && givenTime_new.time != 'now') ? 1 : 0;
                givenTime_new.exactTime =  Object.keys(givenTime_new.exactTime).length ? givenTime_new.exacTime : givenTime.exactTime;
                givenTime_new.relativeTime = Object.keys(givenTime_new.relativeTime).length ? givenTime_new.relativeTime : givenTime.relativeTime;
                // session.send('Old: %j', givenTime);
                // session.send('New: %j', givenTime_new);
                var reply = 'when would you like to meet?';
                session.replaceDialog('/', {data: givenTime_new, reply: reply, reprompt: session.dialogData.reprompt_stored + 1});
            }
            else {
                session.replaceDialog('/continueTime', {
                        data: session.dialogData.givenTime, 
                        reprompt: session.dialogData.reprompt + 1, 
                        reprompt_stored: session.dialogData.reprompt_stored
                    }
                );
            }
        });        

    }
]);
//@TODO bug: handle now givenTime is recognized
lib.dialog('/suggestTime', [
    function (session, args, next) {
        session.send('[Test Suggest Time]');
        session.dialogData.givenTime = args.data;
        session.dialogData.reprompt = args.reprompt;
        var givenTime = args.data;
        var suggestTime = utilsTime.getSuggestTime(givenTime);
        session.send('Suggest Time: %j', suggestTime);

        var reply = '';
        if (!suggestTime.date && !suggestTime.time) {
            // session.send('1');
            reply += 'My schedule is all open today, just let me know what time works for you';
            session.replaceDialog('/', {data: givenTime, reply: reply, reprompt: session.dialogData.reprompt + 1});
        }
        else if (!suggestTime.time) {
            // session.send('2');
            reply += 'how about ' + utilsTime.parseDate(suggestTime.date) + '?';
            
        }
        else {
            // session.send('3');
            var [hour, min] = utilsTime.parseTime(suggestTime.time);
            reply += `how about ${hour}` + (min ? `:${min}` : '') + ' ' + utilsTime.parseDate(suggestTime.date) + '?';
        }
        session.dialogData.suggestTime = suggestTime;
        builder.Prompts.text(session, reply);
    },
    function (session, args, next) {
        var msg = args.response;
        apiai.recognizer.recognize({message:{text:msg}}, function(error, response){
            var intent = response.intent;
            var entities = response.entities || '';
            var exactTime = (entities['exact-time'] && entities['exact-time'].length > 0) ? entities['exact-time'] : null;
            var relativeTime = entities['relative-time'] || null;
            if (intent == 'Intent.Confirmation_Yes' ) {
                session.dialogData.givenTime.date = 
                    session.dialogData.suggestTime.date ? session.dialogData.suggestTime.date : session.dialogData.givenTime.date;
                session.dialogData.givenTime.time = 
                    session.dialogData.suggestTime.time ? session.dialogData.suggestTime.time : session.dialogData.givenTime.time;
                if (session.dialogData.givenTime.date && session.dialogData.givenTime.time && session.dialogData.givenTime.time != 'now') {
                        session.dialogData.givenTime.complete = 1;
                }
                session.send('%j', session.dialogData.givenTime);
                session.send('%d', session.dialogData.reprompt);
                session.replaceDialog('/', {
                    data: session.dialogData.givenTime, 
                    reply: reply, 
                    reprompt: session.dialogData.reprompt + 1
                });
            }       
            else if (exactTime || relativeTime) {
                var givenTime = session.dialogData.givenTime;
                var givenTime_new = utilsTime.fillTime(exactTime, relativeTime);   
                session.send('%j', givenTime_new);  
                session.send('Newly Accepted Time input: %j', givenTime_new);
                if (givenTime.date && givenTime.date != 'today' && !exactTime.date) {
                    givenTime_new.date = givenTime.date;
                }
                else {
                    givenTime_new.date = givenTime_new.date;
                }
                givenTime_new.date = givenTime_new.date || givenTime.date;
                givenTime_new.time = givenTime_new.time || givenTime.time;
                givenTime_new.complete = (givenTime_new.date && givenTime_new.time && givenTime_new.time != 'now') ? 1 : 0;
                givenTime_new.exactTime =  Object.keys(givenTime_new.exactTime).length > 0 ? givenTime_new.exactTime : givenTime.exactTime;
                givenTime_new.relativeTime = Object.keys(givenTime_new.relativeTime).length > 0 ? givenTime_new.relativeTime : givenTime.relativeTime;   
                session.send('Updated givenTime: %j', givenTime_new)       
                if (givenTime_new.complete) {
                    var date = utilsTime.parseDate(givenTime_new.date);	
                    var [hour, min] = utilsTime.parseTime(givenTime_new.time);
                    session.userData.profile.confirmation.time.date = date;
                    [session.userData.profile.confirmation.time.hour,
                        session.userData.profile.confirmation.time.minute] = [hour, min];	
                    var reply = `Perfect, I'll see you at ${hour}` + (min ? `:${min}` : '') + ` ${date}`;
                    session.send(reply);	
                    session.endDialogWithResult({data: {date: givenTime_new.date, time: givenTime_new.time}});
                } 
                else {
                    var reply = 'sure, can you be more specific?';
                    session.send('Switching back with data: %j', givenTime_new);
                    session.replaceDialog('/', {data: givenTime_new, reply: reply, reprompt: session.dialogData.reprompt + 1});
                }                   
            }
            else {
                var reply = 'Just let me know what timeslot you prefer ok?';
                session.replaceDialog('/', {data: givenTime, reply: reply, reprompt: session.dialogData.reprompt + 1});
            }
        })
    }        
]);
module.exports.createLibrary = function(){
    return lib.clone();
};