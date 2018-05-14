var builder = require('botbuilder');
var apiai = require('./../utils_bot/ApiaiRecognizer');
var utils = require('./../utils_dialog/utils');
var utilsService = require('./../utils_dialog/utils_Service');
var blacklist = require('./../utils_bot/Blacklist');
var _ = require('underscore');

var lib = new builder.Library('confirmService');

lib.dialog('/', [
    function (session, args, next) {
        try {
            // session.send('[Start confirmSerivce Dialog]');
            session.dialogData.givenService = args.data;
            session.dialogData.reprompt = args.reprompt;
            // session.send('GivenService: %j', session.dialogData.givenService);
            // session.send('Reprompt: %s', args.reprompt);      
            
            args.data = utilsService.updateService(args.data, args.data);

            if (args.data.complete) {
                session.userData.profile.confirmation.service.inout = args.data.inout;	
                session.userData.profile.confirmation.service.duration = args.data.duration;	
                session.userData.profile.confirmation.service.addon = args.data.addon;	
                session.userData.profile.confirmation.service.complete = 1;

                if (args.reply) {
                    session.send(reply);
                }
                var reply = "coool lol";
                session.replaceDialog('main:/', {reply: reply, complete_open: 1});            
            }
            else if (args.reprompt >= 3) {
                var reply = "u wasting my time, drop off my number.";
                blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                session.endConversation(reply);            
            }
            else if (args.data.flag_rejectOut) {
                session.beginDialog('/confirmIncall', {data: args.data, reply: args.reply, stored_reprompt: args.reprompt, reprompt: 0});
            }
            else if (args.data.has_addon && args.data.flag_addon) {
                if (args.data.addon == 'raw') {
                    var reply = "bare's fine if ur clean and disease free. need plan b pill cuz dont want to be 14 and pregnant....";
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
            else {
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
            }
        }
        catch (err) {
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
                var givenService = session.dialogData.givenService;
                
                if (service) {
                    service = utils.getEntity('service', service);
                }
                
                // session.send('givenService: %j', givenService);
                // session.send('service: %j', service);
                //if response irrelevant
                if (intent == 'Intent.Price_Inquiry' || price) {
                    // session.send('Switch to Price with data: %j', givenService);
                    session.replaceDialog('/givePrice', {data: givenService, stored_reprompt: session.dialogData.reprompt, reply: ''});
                }
                else if (intent == 'Intent.Service_Inquiry' || service) {
                    var givenService_new = utilsService.fillService(service);     
                    console.log('New givenService: %j', givenService_new);
                    // session.send('Newly Accepted Service input: %j', givenService_new);
                    givenService = utilsService.updateService(givenService, givenService_new);
                    
                    // session.send('Updated givenService: %j', givenService);
                    var reply = 'i see....'; 
                    session.replaceDialog('/', {data: session.dialogData.givenService, reprompt: session.dialogData.reprompt+1});
                }
                else {
                    var reply = 'let m know know what u want first?'
                    session.replaceDialog('/', {data: session.dialogData.givenService, reprompt: session.dialogData.reprompt+1, reply: reply});
                }
            });  
        }
        catch (err) {
            var reply = 'sry got to go, text u later';
            blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
            session.endConversation(reply);
		}

    }
]);

lib.dialog('/confirmIncall', [
    function (session, args, next) {
        // session.send('[Start Confirm Incall]');
        // session.send('%j', args);
        try {
            if (args.reprompt >= 2) {
                var reply = "u fooling around and i don't have all day! not talking to you bye!";
                blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                session.endConversation(reply);
            }
            else {
                session.dialogData.givenService = args.data;
                session.dialogData.prompt = args.reprompt;
                session.dialogData.stored_reprompt = args.stored_reprompt;
                builder.Prompts.text(session, args.reply);    
            }
        }
        catch (err) {
            var reply = 'sry got to go, text u later';
            blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
            session.endConversation(reply);
		}
    },
    function (session, args, next) {
        try {
            var msg = args.response;
            apiai.recognizer.recognize({message: {text: msg}}, function (error, response) {
                // session.send('[Process confirm incall reply]');
                var intent = response.intent;
                var entities = response.entities;
                // session.send('entities: %j', entities);
                var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
                // session.send('entities: %j', service);
                if (service) {
                    var service = utils.getEntity('service', service);
                    var givenService_new = utilsService.fillService(service);    
                    var givenService = utilsService.updateService(session.dialogData.givenService, givenService_new);
                }
                else {
                    var givenService_new = null;
                    var givenService = session.dialogData.givenService;
                
                }
                // session.send('new service %j', givenService_new);
                // session.send('updated service %j', givenService);
    
                if (args.reprompt >= 2) {
                    blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                    session.endConversation('stop wasting my time you jerk!');
                }
                else if (intent == 'Intent.Confirmation_Yes') {
                    var reply = 'niiiiiiiiiiiice.'
                    session.userData.profile.confirmation.service.inout = 'incall';	
                    givenService.inout = 'incall';
                    givenService = utilsService.updateService(givenService, givenService);
                    givenService.flag_rejectOut = 0;
                    session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt});
                }
                else if (intent == 'Intent.Offer_Transportation') {
                    var reply = 'ooook, fine i guess i could trust u and go to your place.'
                    session.userData.profile.confirmation.service.inout = 'outcall';
                    givenService.inout = 'outcall';
                    givenService = utilsService.updateService(givenService, givenService);
                    givenService.flag_rejectOut = 0;
                    session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt});
                }
                // else if (intent == 'Intent.Price_Inquiry' && givenService_new && givenService_new.inout == 'outcall') {
                //     session.userData.profile.confirmation.service.inout = 'outcall';
                //     givenService.flag_rejectOut = 0;
                //     givenService_new = {has_inout: 1, inout: 'outcall'};
                //     session.replaceDialog('/givePrice', {data: givenService, data_inqury: givenService_new, stored_reprompt: session.dialogData.stored_reprompt});
                // }          
                else if (service && givenService.inout == 'outcall') {
                    var reply = "told u i'm too young to drive lol.. or u need to cum and pick me up, or buy me uber"
                    session.replaceDialog('/confirmIncall', {data: givenService, reply: reply, reprompt: session.dialogData.prompt+1, stored_reprompt: session.dialogData.stored_reprompt});
                }
                else if (service) {
                    session.userData.profile.confirmation.service.inout = 'incall';	
                    givenService.inout = 'incall';
                    givenService = utilsService.updateService(givenService, givenService);
                    givenService.flag_rejectOut = 0;
                    var reply = 'good. ';
                    session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt});
                }
                else {
                    session.userData.profile.confirmation.service.inout = 'incall';	
                    givenService.inout = 'incall';
                    givenService = utilsService.updateService(givenService, givenService);
                    givenService.flag_rejectOut = 0;
                    var reply = 'lol one thing a time!! this girl get confused easily. you fine with incall only?'
                    session.replaceDialog('/confirmIncall', {data: givenService, reply: reply, reprompt: session.dialogData.prompt+1, stored_reprompt: session.dialogData.stored_reprompt});
                }  
           });  
        }
        catch (err) {
            var reply = 'sry got to go, text u later';
            blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
            session.endConversation(reply);
		}
    }  
]);

lib.dialog('/confirmRaw', [
    function (session, args, next) {
        try {
            session.dialogData.givenService = args.data;
            session.dialogData.prompt = args.reprompt;
            session.dialogData.stored_reprompt = args.stored_reprompt;
            if (args.reprompt >= 2) {
                var reply = "you r bad ppl and u wasting me time fuck off.";
                blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                session.endConversation(reply);
            }
            else {
                builder.Prompts.text(session, args.reply);
            }
        }
        catch (err) {
            var reply = 'sry got to go, text u later';
            blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
            session.endConversation(reply);
		}
    },
    function (session, args, next) {
        try {
            var msg = args.response;
            apiai.recognizer.recognize({message: {text: msg}}, function (error, response) {
                var intent = response.intent;
                var entities = response.entities;
                var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
                if (service) {
                    service = utils.getEntity('service', service);
                    var givenService_new = utilsService.fillService(service);    
                    var givenService = utilsService.updateService(session.dialogData.givenService, givenService_new);
                }         
                else {
                    var givenService = session.dialogData.givenService;
                }
    
                if (intent == 'Intent.Confirmation_Yes') {
                    var reply = 'good thank you lol. im dd free nothing to worry';
                    session.dialogData.givenService.flag_addon = 0;
                    session.replaceDialog('/', {data: session.dialogData.givenService, reply: reply, reprompt: session.dialogData.stored_reprompt});
                }
                else if (intent == 'Intent.Pregnant') {
                    var reply = 'okay i guess i could trust you...';
                    session.dialogData.givenService.flag_addon = 0;
                    session.replaceDialog('/', {data: session.dialogData.givenService, reply:reply, reprompt:session.dialogData.stored_reprompt}); 
                }
                else if (intent == 'Intent.QuestionAge') {
                    var reply = "well i am 14 why would i lie 2 u?"
                    session.replaceDialog('/underAge', {data: session.dialogData.givenService, reply:reply, stored_reprompt:session.dialogData.stored_reprompt, reprompt:0});
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
        catch (err) {
            var reply = 'sry got to go, text u later';
            blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
            session.endConversation(reply);
		}
    }
]);


lib.dialog('/confirmBDSM', [
    function (session, args, next) {
        try {
            session.dialogData.givenService = args.data;
            session.dialogData.prompt = args.reprompt;
            session.dialogData.stored_reprompt = args.stored_reprompt;
            if (args.reprompt >= 2) {
                var reply = "sry time is $$ for me i dont have all day for time waster bye.";
                blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                session.endConversation(reply);
            }
            else {
                builder.Prompts.text(session, args.reply);
            }          
        }
        catch (err) {
            var reply = 'sry got to go, text u later';
            blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
            session.endConversation(reply);
		}
    },
    function (session, args, next) {
        try {
            var msg = args.response;
            apiai.recognizer.recognize({message: {text: msg}}, function (error, response) {
                var intent = response.intent;
                var entities = response.entities;
                var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
                if (service) {
                    var service = utils.getEntity('service', service);
                    var givenService_new = utilsService.fillService(service);    
                    var givenService = utilsService.updateService(session.dialogData.givenService, givenService_new);
                }         
                else {
                    var givenService = session.dialogData.givenService;
                }
    
                if (intent == 'Intent.Confirmation_No') {
                    var reply = 'oaky im trust you lol.';
                    session.dialogData.givenService.flag_addon = 0;
                    session.replaceDialog('/', {data: session.dialogData.givenService, reply:reply, reprompt:session.dialogData.stored_reprompt});
                }
                else if (intent == 'Intent.Ensure') {
                    var reply = 'okay i guess i could trust you...dont be bad guy not cool';
                    session.dialogData.givenService.flag_addon = 0;
                    session.replaceDialog('/', {data: session.dialogData.givenService, reply:reply, reprompt:session.dialogData.stored_reprompt}); 
                }
                else if (intent == 'Intent.QuestionAge') {
                    var reply = "well i am 14 why would i lie 2 u?"
                    session.replaceDialog('/underAge', {data: session.dialogData.givenService, reply:reply, stored_reprompt:session.dialogData.stored_reprompt, reprompt:0});
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
        catch (err) {
            var reply = 'sry got to go, text u later';
            blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
            session.endConversation(reply);
		}
    }
]);

lib.dialog('/givePrice', [
    function (session, args, next) {
        try {
            // session.send('[Start give price]');
            var givenService = args.data;
            var inquiryService = args.data_inquiry;
            
            session.dialogData.queryService = args.data_inquiry;
            session.dialogData.givenService = args.data;
            session.dialogData.prompt = args.reprompt;
            session.dialogData.stored_reprompt = args.stored_reprompt;

            // session.send('stored reprompt: %d', session.dialogData.stored_reprompt);
            var reply = '';
            // session.send('incoming inquiry service: %j', inquiryService);
            if (inquiryService) {
                if (!session.userData.profile.confirmation.price.priceListGiven) {
                    reply += 'donations are 100 for HH, 150 for H. ';
                    session.userData.profile.confirmation.price.priceListGiven = 1;
                    session.userData.profile.confirmation.price.priceGiven['30min'] = 1;
                    session.userData.profile.confirmation.price.priceGiven['1 hour'] = 1;
                }
                if (inquiryService.has_duration && inquiryService.duration != '30min' && inquiryService.duration != '1 hour') {
                    reply += utils.priceTable[inquiryService.duration] + ' for ' + inquiryService.duration + '.';
                    session.userData.profile.confirmation.price.priceGiven[inquiryService.duration] = 1;
                }
                if (inquiryService.has_inout && inquiryService.inout == 'outcall') {
                    reply += "you'll need to call uber or lift to pick me. ";
                    session.userData.profile.confirmation.price.priceGiven.inout = 1;
                    session.dialogData.givenService.flag_rejectOut = 0;
                }
                if (inquiryService.has_addon) {
                    reply += 'any fetish thing is 50 extra..';
                    session.userData.profile.confirmation.price.priceGiven.addon = 1;
                }
                else {
                    if (!reply) {
                        reply += 'You happy with the price then?';
                    }
                }
            }
            else {
                if (args.reply) {
                    reply = args.reply;
                }
                else {
                    if (!session.userData.profile.confirmation.price.priceListGiven) {
                        reply += 'donations are 100 for HH, 150 for H. ';
                        session.userData.profile.confirmation.price.priceListGiven = 1;
                        session.userData.profile.confirmation.price.priceGiven['30min'] = 1;
                        session.userData.profile.confirmation.price.priceGiven['1 hour'] = 1;
                    }
                    else {
                        reply += '100 for HH, 150 for H, fetish things 50 extra. didnt i tell you already';
                        session.userData.profile.confirmation.price.priceGiven.addon = 1;
                    }
        
                }
            }
            builder.Prompts.text(session, reply);
        }
        catch (err) {
            var reply = 'sry got to go, text u later';
            blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
            session.endConversation(reply);
		}
    },
    function (session, args, next) {
        try {
            var msg = args.response;
            apiai.recognizer.recognize({message:{text:msg}}, function(error, response){
                var intent = response.intent;
                var entities = response.entities;
                var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
                var price = entities['price'] ? entities['price'] : null;
            
                if (service) {
                    var service = utils.getEntity('service', service);
                    var givenService_new = utilsService.fillService(service);    
                    var givenService = utilsService.updateService(session.dialogData.givenService, givenService_new);
                }         
                else {
                    var givenService = session.dialogData.givenService;
                    var givenService_new = null;
                }            
    
                // session.send('givenService_new: %j', givenService_new);
                // session.send('givenService: %j', givenService);
                // session.send('givenService_old: %j', session.dialogData.givenService);
                
                if (intent == 'Intent.Confirmation_Yes') {
                    var reply = 'k';
                    session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt})
                }
                else if (intent == 'Intent.Price_Inquiry') {
                    // session.send('Switch to Price with data: %j', givenService);
                    session.replaceDialog('/givePrice', {data: givenService, data_inquiry: givenService_new, reply: '', stored_reprompt: session.dialogData.stored_reprompt, reprompt: session.dialogData.reprompt+1});
                }
                else if (givenService_new) {
                    // session.send('[service mentioned]');
                    if (_.isEqual(givenService, session.dialogData.givenService)) {
                        var reply = 'good';
                        session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt})
                    }
                    else {
                        var priceGiven = session.userData.profile.confirmation.price.priceGiven;
                        // session.send('price given: %j', priceGiven);
                        if ((givenService_new.has_duration && priceGiven[givenService_new.duration]) ||
                        (givenService_new.has_inout && priceGiven.inout) || 
                        (givenService_new.addon && priceGiven.addon)) {
                            var reply = 'good';
                            session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt})                            
                        }
                        else {
                            var reply = '';
                            session.replaceDialog('/givePrice', {data: givenService, data_inquiry: givenService_new, reply: '', stored_reprompt: session.dialogData.stored_reprompt, reprompt: session.dialogData.reprompt+1});
                        }
                    }
                }
                else {
                    var reply = 'you fine with price then?';
                    // session.send('data: %j', givenService);
                    session.replaceDialog('/givePrice', {data: givenService, data_inquiry: '', reply: reply, stored_reprompt: session.dialogData.stored_reprompt, reprompt: session.dialogData.reprompt+1});
                }
            });              
        }
        catch (err) {
            var reply = 'sry got to go, text u later';
            blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
            session.endConversation(reply);
		}
    }
]);


lib.dialog('/continueService', [
    function (session, args, next) {
        try {
            if (args.reprompt > 1) {
                var reply = "Drop off my number you time-waster :/.";
                blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                session.endConversation(reply);
            }        
            else {
                session.dialogData.givenService = args.data;
                session.dialogData.reprompt = args.reprompt;
                session.dialogData.reprompt_stored = args.reprompt_stored;
                // session.send('reprompt: %d', args.reprompt);
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
        }
        catch (err) {
            var reply = 'sry got to go, text u later';
            blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
            session.endConversation(reply);
		}
    },
    function (session, args, next) {
        try {
            var msg = args.response;
            apiai.recognizer.recognize({message:{text:msg}}, function(error, response){
                var intent = response.intent;
                var entities = response.entities;
                var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
                var price = entities['price'] ? entities['price'] : null;
                var givenService = session.dialogData.givenSerivce;
                
                // session.send('givenService: %j', givenService);
                // session.send('service: %j', service);
                if (intent == 'Intent.Price_Inquiry' || price) {
                    // session.send('Switch to Price with data: %j', givenService);
                    session.replaceDialog('/givePrice', {data: givenService, reprompt_stored: session.dialogData.reprompt});
                }
                else if (intent == 'Intent.Confirmation_Yes' || service) {
                    var reply = 'sure i can do that.';
                    // session.send(reply);
                    
                    if (service) {
                        var givenService_new = utilsService.fillService(service);
                        givenService = utilsService.updateService(givenService, givenService_new);
                    }
                    
                    // session.send('Updated Service: %j', givenService);
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
        catch (err) {
            var reply = 'sry got to go, text u later';
            blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
            session.endConversation(reply);
		}
    }
]);

lib.dialog('/underAge', [
    function (session, args, next) {
        try {
            builder.Prompts.text(args.reply);
        }
        catch (err) {
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
                var givenService = session.dialogData.givenSerivce;
                
                if (intent == 'Intent.AskProof' || intent == 'Intent.Get_Pic') {
                    var reply = "Nah not doing nudity I've been burnt too many times. if you dont believe then dont wate my time. bye";
                    blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                    session.endConversation(reply);
                }
            });  
        }
        catch (err) {
            var reply = 'sry got to go, text u later';
            blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
            session.endConversation(reply);
		}
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