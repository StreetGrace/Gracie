var builder = require('botbuilder');
var apiai = require('./../utils_bot/ApiaiRecognizer');
var utils = require('./../utils_dialog/utils');
var utilsService = require('./../utils_dialog/utils_Service');

var lib = new builder.Library('confirmService');

lib.dialog('/', [
    function (session, args, next) {
        session.dialogData.givenService = args.data;
        session.dialogData.reprompt = args.reprompt;
        
        args.data = utilsService.updateService(args.data, args.data);

        var sessionInfo = utils.getSessionInfo(session);
        botLogger.info('confirmPrice:/, Start', Object.assign({}, sessionInfo, {data: args.data, reprompt: args.reprompt}));        

        if (args.data.complete) {
			session.userData.profile.confirmation.service.inout = args.data.inout;	
            session.userData.profile.confirmation.service.duration = args.data.duration;	
            session.userData.profile.confirmation.service.addon = args.data.addon;	
            if (args.reply) {
                args.send(reply);
            }
            var reply = "coool lol";
            session.endDialogWithResult({reply: reply});            
        }
        else if (args.reprompt > 3) {
            var reply = "u wasting my time, drop off my number.";
            session.endConversation(reply);            
        }
        else if (args.data.flag_rejectOut) {
            session.beginDialog('/confirmIncall', {data: args.data, reply: args.reply, stored_reprompt: args.reprompt, reprompt: 0});
        }
        else if (args.data.has_addon && args.data.flag_addon) {
            if (args.data.addon == 'raw') {
                var reply = "bare's fine if ur clean and disease free. need plan b pill cuz dont want to be 16 and pregnant....";
                session.beginDialog('/confirmRaw', {data: args.data, reply: reply, stored_reprompt: args.reprompt, reprompt: 0});
            }
            else if (apptService.addon == 'bdsm') {
                var reply = " im mean im open minded.. just dont want you to hurt me lol.. you not gonna hurt me right"
                session.beginDialog('/confirmBDSM', {data: args.data, reply: reply, stored_reprompt: args.reprompt, reprompt: 0});
            }
            else if (apptService.addon == 'girlfriend experience') {
                var reply = " yeah why not lol. still have to pay $"
                session.dialogData.givenService.flag_addon = 0;
            } 
            else {
                var reply = " im mean im open minded.."
                session.dialogData.givenService.flag_addon = 0;
            }
        }
        if (args.data.has_inout && !args.data.has_duration) {
            if (reply) {
                reply += ' How long are you looking for?';
            }
            else if (args.reply){
                var reply = args.reply + 'How long are you looking for?'; 
            }
            else {
                var reply = 'How long are you looking for?';
            }
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
    function (session, args, next) {
        session.dialogData.givenService = args.data;
        session.dialogData.prompt = args.reprompt;
        session.dialogData.stored_prompt = args.stored_reprompt;
        builder.Prompts.text(session, args.reply);
    },
    function (session, args, next) {
        var msg = args.response;
        apiai.recognizer.recognize({message: {text: msg}}, function (error, response) {
            var intent = response.intent;
            var entities = response.entities;
            var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
            if (service) {
                var givenService_new = utilsService.fillService(service);    
                var givenService = utilsService.updateService(session.dialogData.givenService, givenService_new);
            }
            else {
                var givenService_new = null;
                var givenService = session.dialogData.givenService;
            }
            
            if (args.reprompt >= 2) {
                session.endConversation('stop wasting my time you jerk!');
            }
            else if (intent == 'Intent.Confirmation_Yes') {
                var reply = 'niiiiiiiiiiiice.'
                session.userData.profile.confirmation.service.inout = 'incall';	
                givenService.flag_rejectOut = 0;
                session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_prompt});
            }
            else if (intent == 'Intent.Offer_Transportation') {
                var reply = 'ooook, fine i guess i could trust u.'
                session.userData.profile.confirmation.service.inout = 'outcall';
                givenService.flag_rejectOut = 0;
                session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_prompt})
            }
            else if (intent == 'Intent.Price_Inquiry') {
                session.userData.profile.confirmation.drivce.inout = 'incall';
                givenService.flag_rejectOut = 0;
                givenService_new = {has_inout: 1, inout: 'outcall'};
                session.replaceDialog('/givePrice', {data: givenService, data_inqury: givenService_new, stored_prompt: session.dialogData.stored_prompt});
            }          
            else if (service['service-in-out'] && service['service-in-out'] == 'outcall') {
                var reply = "told u i'm too young to drive! or u need to cum and pick me up!"
                session.replaceDialog('/confirmIncall', {data: givenService, reply: reply, reprompt: session.dialogData.prompt+1, stored_prompt: session.dialogData.stored_prompt});
            }
            else if (service) {
                session.userData.profile.confirmation.service.inout = 'incall';	
                givenService.flag_rejectOut = 0;
                var reply = 'good';
                session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_prompt});
            }
            else {
                session.userData.profile.confirmation.service.inout = 'incall';	
                givenService.flag_rejectOut = 0;
                var reply = 'lol one thing a time!! this girl get confused easily'
                session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_prompt});
            }  
       });  
    }  
]);

lib.dialog('/confirmRaw', [
    function (session, args, next) {
        session.dialogData.givenService = args.data;
        session.dialogData.prompt = args.reprompt;
        session.dialogData.stored_prompt = args.stored_reprompt;
        if (args.reprompt >= 2) {
            var reply = "you r bad ppl and u wasting me time fuck off.";
            session.endConversation(reply);
        }
        else {
            builder.Prompts.text(session, args.reply);
        }
    },
    function (session, args, next) {
        var msg = args.response;
        apiai.recognizer.recognize({message: {text: msg}}, function (error, response) {
            var intent = response.intent;
            var entities = response.entities;
            var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
            if (service) {
                var givenService_new = utilsService.fillService(service);    
                var givenService = utilsService.updateService(session.dialogData.givenService, givenService_new);
            }         
            else {
                var givenService = session.dialogData.givenService;
            }

            if (intent == 'Intent.Confirmation_Yes') {
                var reply = 'good thank you lol. im dd free nothing to worry';
                session.dialogData.givenService.flag_addon = 0;
                session.replaceDialog('/', {data: session.dialogData.givenService, reply: reply, reprompt: session.dialogData.stored_prompt});
            }
            else if (intent == 'Intent.Pregnant') {
                var reply = 'okay i guess i could trust you...';
                session.dialogData.givenService.flag_addon = 0;
                session.replaceDialog('/', {data: session.dialogData.givenService, reply:reply, reprompt:session.dialogData.stored_prompt}); 
            }
            else if (intent == 'Intent.QuestionAge') {
                var reply = "well i am 14 why would i lie 2 u?"
                session.replaceDialog('/underAge', {data: session.dialogData.givenService, reply:reply, stored_reprompt:session.dialogData.stored_prompt, reprompt:0});
            }
            else if (service && givenService_new.addon == 'raw') {
                var reply = "told ya i not wanna get pregnant. you need to bring me b pill or pull out. ";
                session.replaceDialog('/confirmRaw', {data: givenService, reply:reply, reprompt:session.dialogData.reprompt+1});                 
            }
            else {
                var reply = "so you aggree to bring b pill...? dont wanna be pregnant.";
                session.replaceDialog('/confirmRaw', {data: givenService, reply:reply, reprompt:session.dialogData.reprompt+1});                          
            }
        })
    }
]);


lib.dialog('/confirmBDSM', [
    function (session, args, next) {
        session.dialogData.givenService = args.data;
        session.dialogData.prompt = args.reprompt;
        session.dialogData.stored_prompt = args.stored_reprompt;
        if (args.reprompt >= 2) {
            var reply = "sry time is $$ for me i dont have all day for time waster bye.";
            session.endConversation(reply);
        }
        else {
            builder.Prompts.text(session, args.reply);
        }
    },
    function (session, args, next) {
        var msg = args.response;
        apiai.recognizer.recognize({message: {text: msg}}, function (error, response) {
            var intent = response.intent;
            var entities = response.entities;
            var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
            if (service) {
                var givenService_new = utilsService.fillService(service);    
                var givenService = utilsService.updateService(session.dialogData.givenService, givenService_new);
            }         
            else {
                var givenService = session.dialogData.givenService;
            }

            if (intent == 'Intent.Confirmation_No') {
                var reply = 'oaky im trust you lol.';
                session.dialogData.givenService.flag_addon = 0;
                session.replaceDialog('/', {data: session.dialogData.givenService, reply:reply, reprompt:session.dialogData.stored_prompt});
            }
            else if (intent == 'Intent.Ensure') {
                var reply = 'okay i guess i could trust you...dont be bad guy not cool';
                session.dialogData.givenService.flag_addon = 0;
                session.replaceDialog('/', {data: session.dialogData.givenService, reply:reply, reprompt:session.dialogData.stored_prompt}); 
            }
            else if (intent == 'Intent.QuestionAge') {
                var reply = "well i am 14 why would i lie 2 u?"
                session.replaceDialog('/underAge', {data: session.dialogData.givenService, reply:reply, stored_reprompt:session.dialogData.stored_prompt, reprompt:0});
            }
            else if (service && givenService_new.addon == 'bdsm') {
                var reply = "if i wont get hurt...will i?";
                session.replaceDialog('/confirmBDSM', {data: givenService, reply:reply, reprompt:session.dialogData.reprompt+1});                 
            }
            else {
                var reply = "so i wont get hurt right?";
                session.replaceDialog('/confirmBDSM', {data: givenService, reply:reply, reprompt:session.dialogData.reprompt+1});                          
            }
        })
    }
]);

lib.dialog('/givePrice', [
    function (session, args, next) {
        var givenService = args.data;
        var inquiryService = args.data_inqury;
        
        session.dialogData.givenService = args.data;
        session.dialogData.prompt = args.reprompt;
        session.dialogData.stored_prompt = args.stored_reprompt;

        var reply = '';
        if (!session.userData.profile.confirmation.price.priceListGiven) {
            reply += 'donations are 100 for HH, 150 for H';
            session.userData.profile.confirmation.price.priceListGiven = 1;
        }
        if (inquiryService.has_duration && inquiryService.duration != '30min' && inquiryService.duration != '1 hour') {
            reply += utils.priceTable[inquiryService.duration] + ' for ' + inquiryService.duration + '.';
        }
        if (inquiryService.has_inout && inquiryService.inout == 'outcall') {
            reply += "well you'll need to call uber or lift to pick me.";
            session.dialogData.givenService.flag_rejectOut = 0;
        }
        if (inquiryservice.has_addon) {
            reply += 'any fetish thing is 50 extra..';
        }
        builder.Prompts.text(reply);
    },
    function (session, args, next) {
        apiai.recognizer.recognize({message:{text:msg}}, function(error, response){
            var intent = response.intent;
            var entities = response.entities;
            var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
            var price = entities['price'] ? entities['price'] : null;
        
            if (service) {
                var givenService_new = utilsService.fillService(service);    
                var givenService = utilsService.updateService(session.dialogData.givenService, givenService_new);
            }         
            else {
                var givenService = session.dialogData.givenService;
            }            

            session.send('givenService: %j', givenService);
            
            if (intent == 'Intent.Confirmation_Yes') {
                var reply = 'k';
                session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt})
            }
            else if (intent == 'Intent.Price_Inquiry' || price) {
                session.send('Switch to Price with data: %j', givenService);
                session.replaceDialog('/givePrice', {data: givenService, stored_reprompt: session.dialogData.stored_reprompt, reprompt: session.dialogData.reprompt+1});
            }
            else {
                var reply = 'you fine with price then?';
                session.send(reply);
                session.replaceDialog('/givePrice', {data: givenService, stored_reprompt: session.dialogData.stored_reprompt, reprompt: session.dialogData.reprompt+1});
            }
        });              
    }
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
                session.replaceDialog('/continueService', {
                        data: session.dialogData.givenService, 
                        reprompt: session.dialogData.reprompt + 1, 
                        reprompt_stored: session.dialogData.reprompt_stored
                    }
                );
            }
        });        
    }
]);

lib.dialog('/underAge', [
    function (session, args, next) {
        builder.Prompts.text(args.reply);
    },
    function (session, args, next) {
        var msg = args.response;
        apiai.recognizer.recognize({message:{text:msg}}, function(error, response) {
            var intent = response.intent;
            var entities = response.entities;
            var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
            var price = entities['price'] ? entities['price'] : null;
            var givenService = session.dialogData.givenSerivce;
            
            if (intent == 'Intent.AskProof' || intent == 'Intent.Get_Pic') {
                var reply = "Nah not doing nudity I've been burnt too many times. if you dont believe then dont wate my time. bye";
                session.endConversation(reply);
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