var builder = require('botbuilder');
var apiai = require('./../utils_bot/ApiaiRecognizer');
var utils = require('./../utils_dialog/utils');
var utilsService = require('./../utils_dialog/utils_Service');

var lib = new builder.Library('confirmService');

lib.dialog('/', [
    function (session, args, next) {
        session.send('[Start confirmSerivce Dialog]');
        session.dialogData.givenService = args.data;
        session.dialogData.reprompt = args.reprompt;
        session.send('GivenService: %j', session.dialogData.givenService);
        session.send('Reprompt: %d', args.reprompt);      
        
        if (args.data.complete) {
			session.userData.profile.confirmation.service.inout = args.data.inout;	
            session.userData.profile.confirmation.service.duration = args.data.duration;	
            session.userData.profile.confirmation.service.addon = args.data.addon;	
            var reply = "coool lol";
            session.endDialogWithResult({reply: reply});            
        }
        else if (args.reprompt > 3) {
            var reply = "u wasting my time, drop off my number.";
            session.endConversation(reply);            
        }
        else if (args.reply && args.flag_rejectOut) {
            session.replaceDialog('/confirmIncall', args);
        }
        else if (data.addon) {
            session.replaceDialog('/confirmAddon', args);
        }
        else if (args.data.has_inout && !args.data.has_duration) {
            var reply = 'How long are you looking for';
            builder.Prompts.text(session, reply);
        }        
    },
    function (session, args, next) {
        var msg = args.response;
        apiai.recognizer.recognize({message:{text:msg}}, function(error, response) {
            var intent = response.intent;
            var entities = response.entities;
            var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
            var price = entities['price'] ? entities['price'] : null;
            var givenService = session.dialogData.givenSerivce;
            
            session.send('givenService: %j', givenService);
            session.send('service: %j', service);
            //if response irrelevant
            if (intent == 'Intent.Price_Inquiry' || price) {
                session.send('Switch to Price with data: %j', givenService);
                session.replaceDialog('/givePrice', {data: givenService, reprompt_stored: session.dialogData.reprompt});
            }
            else if (intent == 'Intent.Service_Inquiry' || service) {
                var givenService_new = utilsService.fillService(service);     
                console.log('New givenService: %j', givenService_new);
                session.send('Newly Accepted Service input: %j', givenService_new);
                givenService = utilsService.updateService(givenService, givenService_new);
                
                session.send('Updated givenService: %j', givenService)       
                if (givenService.complete) {
                    session.userData.profile.confirmation.service.inout = args.data.inout;	
                    session.userData.profile.confirmation.service.duration = args.data.duration;	
                    session.userData.profile.confirmation.service.addon = args.data.addon;	
                    var reply = "Cool, works for me.";
                    session.send(reply);
                    session.endDialogWithResult({data: givenService});            
                } 
                else  {
                    session.beginDialog('/continueService', {data: session.dialogData.givenService, reprompt: 0, reprompt_stored: session.dialogData.reprompt});
                }
            }
        });  
    }

]);

lib.dialog('/confirmIncall', [

]);

lib.dialog('/continueService', [
    function (session, args, next) {
        if (args.reprompt > 1) {
            var reply = "Drop off my number you time-waster :/.";
            session.endConversation(reply);
        }        
        else {
            session.dialogData.givenService = args.data;
            session.dialogData.reprompt = args.reprompt;
            session.dialogData.reprompt_stored = args.reprompt_stored;
            session.send('reprompt: %d', args.reprompt);
            if (args && args.reprompt) {
                var reply_inout = 'Could you let me know in or out first?';
                var reply_duration = 'First how long are you looking for?'
                var reply = session.dialogData.givenService.has_inout ? reply_duration : reply_inout;
                builder.Prompts.text(session, reply);
            }
            else {
                var reply_inout = 'so you want incall or outcall?';
                var reply_duration = 'so how long are you looking for?'
                var reply = session.dialogData.givenService.has_inout ? reply_duration : reply_inout;
                builder.Prompts.text(session, reply);
            }      
        }
    },
    function (session, args, next) {
        var msg = args.response;
        apiai.recognizer.recognize({message:{text:msg}}, function(error, response){
            var intent = response.intent;
            var entities = response.entities;
            var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
            var price = entities['price'] ? entities['price'] : null;
            var givenService = session.dialogData.givenSerivce;
            
            session.send('givenService: %j', givenService);
            session.send('service: %j', service);
            if (intent == 'Intent.Price_Inquiry' || price) {
                session.send('Switch to Price with data: %j', givenService);
                session.replaceDialog('/givePrice', {data: givenService, reprompt_stored: session.dialogData.reprompt});
            }
            else if (intent == 'Intent.Confirmation_Yes' || service) {
                var reply = 'sure i can do that.';
                session.send(reply);
                
                if (service) {
                    var givenService_new = utilsService.fillService(service);
                    givenService = utilsService.updateService(givenService, givenService_new);
                }
                
                session.send('Updated Service: %j', givenService);
                session.replaceDialog('/', {data: givenService, reprompt: session.dialogData.reprompt_stored + 1});
            }
            else {
                session.replaceDialog('/continueTime', {
                        data: session.dialogData.givenService, 
                        reprompt: session.dialogData.reprompt + 1, 
                        reprompt_stored: session.dialogData.reprompt_stored
                    }
                );
            }
        });        
    }
]);

lib.dialog('/givePrice', [
    function (session, args, next) {
        var givenService = args.data;
        if (givenService.has_duration) {
            var reply = utils.priceTable[givenService.duration] + ' for ' + givenService.duration + '.';
        }
        else {
            var reply = 'my hour rate is $200.'
        }     
        builder.Prompts.text(session, reply);
    },
    function (session, args, next) {
        apiai.recognizer.recognize({message:{text:msg}}, function(error, response){
            var intent = response.intent;
            var entities = response.entities;
            var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
            var price = entities['price'] ? entities['price'] : null;
            var givenService = session.dialogData.givenSerivce;
            
            session.send('givenService: %j', givenService);
            session.send('service: %j', service);
            if (intent == 'Intent.Price_Inquiry' || price) {
                session.send('Switch to Price with data: %j', givenService);
                session.replaceDialog('/givePrice', {data: givenService, reprompt_stored: session.dialogData.reprompt});
            }
            else if (intent == 'Intent.Confirmation_Yes' || service) {
                var reply = 'sure i can do that.';
                session.send(reply);
                
                if (service) {
                    var givenService_new = utilsService.fillService(service);
                    givenService = utilsService.updateService(givenService, givenService_new);
                }
                
                session.send('Updated Service: %j', givenService);
                session.replaceDialog('/', {data: givenService, reprompt: session.dialogData.reprompt_stored + 1});
            }
            else {
                session.replaceDialog('/continueTime', {
                        data: session.dialogData.givenService, 
                        reprompt: session.dialogData.reprompt + 1, 
                        reprompt_stored: session.dialogData.reprompt_stored
                    }
                );
            }
        });              
    }
]);
module.exports.createLibrary = function(){
    return lib.clone();
};

// const sample = {
//     has_inout: has_inout,
//     has_duration: has_duration,
//     has_addon: has_addon,
//     inout: inout,
//     duration: duration,
//     addon: addon
// };