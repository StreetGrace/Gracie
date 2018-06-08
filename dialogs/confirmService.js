var builder = require('botbuilder');
var apiai = require('./../utils_bot/ApiaiRecognizer');
var utils = require('./../utils_dialog/utils');
var utilsService = require('./../utils_dialog/utils_Service');
var blacklist = require('./../utils_bot/Blacklist');
var resDB = require('./../utils_bot/QueryDB');
var _ = require('underscore');

var lib = new builder.Library('confirmService');

lib.dialog('/', [
    function (session, args, next) {
        session.send('%j', session.sessionState);
        try {
            // session.send('[Start confirmSerivce Dialog]');
            session.dialogData.givenService = args.data;
            session.dialogData.reprompt = args.reprompt;
            // session.send('GivenService: %j', session.dialogData.givenService);
            // session.send('Reprompt: %s', args.reprompt);      
            
            args.data = utilsService.updateService(args.data, args.data);

            if (args.data.complete) {
                // session.userData.profile.confirmation.service.inout = args.data.inout;	
                session.userData.profile.confirmation.service.duration = args.data.duration;	
                session.userData.profile.confirmation.service.addon = args.data.addon;	
                session.userData.profile.confirmation.service.complete = 1;

                if (args.reply) {
                    session.send(reply);
                }
                resDB.queryRes('confirmService:/', 0, 1, function (err, result) {
                    if (err) {
                        console.log(err);
                        console.log('error pulling data');
                    }
                    else {
                        var reply = result.message;
                        reply = decodeURIComponent(reply).replace(/\+/g, " ");
                        reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                        session.replaceDialog('main:/', {reply: reply, complete_open: 1});            
                    }
                });
            }
            else if (args.reprompt >= 2) {
                resDB.queryRes('confirmService:/', 0, 0, function (err, result) {
                    if (err) {
                        console.log(err);
                        console.log('error pulling data');
                    }
                    else {
                        var reply = result.message;
                        reply = decodeURIComponent(reply).replace(/\+/g, " ");
                        reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                        blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                        session.endConversation(reply);            
                    }
                });
            }
            else if (args.data.flag_rejectOut) {
                session.beginDialog('/confirmIncall', {data: args.data, reply: args.reply, stored_reprompt: args.reprompt, reprompt: 0});
            }
            else if (args.data.has_addon && args.data.flag_addon) {
                if (args.data.addon == 'raw') {
                    resDB.queryRes('confirmService:/', 0, 2, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ").replace('14', '16');
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.beginDialog('/confirmRaw', {data: args.data, reply: reply, stored_reprompt: args.reprompt, reprompt: 0});
                        }
                    });
                }
                else if (args.data.addon == 'bdsm') {
                    resDB.queryRes('confirmService:/', 0, 3, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.beginDialog('/confirmBDSM', {data: args.data, reply: reply, stored_reprompt: args.reprompt, reprompt: 0});
                        }
                    });
                }
                else if (args.data.addon == 'girlfriend experience') {
                    resDB.queryRes('confirmService:/', 0, 4, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.dialogData.givenService.flag_addon = 0;
                            builder.Prompts.text(session, reply); 
                        }
                    });
                } 
                else {
                    resDB.queryRes('confirmService:/', 0, 5, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.dialogData.givenService.flag_addon = 0;
                            builder.Prompts.text(session, reply); 
                        }
                    });
                }
            }
            else {
                if (args.data.has_inout && !args.data.has_duration) {
                    if (reply) {
                        resDB.queryRes('confirmService:/', 0, 6, function (err, result) {
                            if (err) {
                                console.log(err);
                                console.log('error pulling data');
                            }
                            else {
                                var reply_new = result.message;
                                reply_new = decodeURIComponent(reply_new).replace(/\+/g, " ");
                                reply += ' ' + eval('`'+ reply_new.replace(/`/g,'\\`') + '`');
                                builder.Prompts.text(session, reply);    
                            }
                        });
                    }
                    else if (args.reply){
                        resDB.queryRes('confirmService:/', 0, 6, function (err, result) {
                            if (err) {
                                console.log(err);
                                console.log('error pulling data');
                            }
                            else {
                                var reply = result.message;
                                reply = decodeURIComponent(reply).replace(/\+/g, " ");
                                reply = args.reply + ' ' + eval('`'+ reply.replace(/`/g,'\\`') + '`');
                                builder.Prompts.text(session, reply);    
                            }
                        });
                    }
                    else {
                        resDB.queryRes('confirmService:/', 0, 6, function (err, result) {
                            if (err) {
                                console.log(err);
                                console.log('error pulling data');
                            }
                            else {
                                var reply = result.message;
                                reply = decodeURIComponent(reply).replace(/\+/g, " ");
                                reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                                builder.Prompts.text(session, reply);    
                            }
                        });                        
                    }
                } 
                else {
                    var reply = 'huh? what?'
                    builder.Prompts.text(session, reply);
                }           
            }
        }
        catch (err) {
			setTimeout(function() {
				resDB.queryRes('global', 0, 0, function (err, result) {
					if (err) {
					  console.log(err);
					  console.log('error pulling data');
					}
					else {
					  var reply = result.message;
					  reply = decodeURIComponent(reply).replace(/\+/g, " ");
					  reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
	
					  blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
					  session.endConversation(reply);
					}
				});
			}, 2500);
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
                    console.log('service given');
                    console.log('%j', service);
                }
                
                // session.send('givenService: %j', givenService);
                // session.send('service: %j', service);
                //if response irrelevant
                if (intent == 'Intent.Price_Inquiry' || price) {
                    // session.send('Switch to Price with data: %j', givenService);
                    var inquiryService = null;
                    if (service) {
                        inquiryService = utilsService.fillService(service)
                    }
                    session.replaceDialog('/givePrice', {data: givenService, data_inquiry: inquiryService, stored_reprompt: session.dialogData.reprompt, reply: ''});
                }
                else if (intent == 'Intent.Service_Inquiry' || service) {
                    var givenService_new = utilsService.fillService(service);    
    
                    console.log('New givenService: %j', givenService_new);
                    // session.send('Newly Accepted Service input: %j', givenService_new);
                    givenService = utilsService.updateService(givenService, givenService_new);
                    
                    // session.send('Updated givenService: %j', givenService);
                    var reply = 'i see....'; 
                    session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.reprompt+1});
                }
                else {
                    resDB.queryRes('confirmService:/', 0, 0, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.replaceDialog('/', {data: session.dialogData.givenService, reprompt: session.dialogData.reprompt+1, reply: reply});
                        }
                    });
                }
            });  
        }
        catch (err) {
			setTimeout(function() {
				resDB.queryRes('global', 0, 0, function (err, result) {
					if (err) {
					  console.log(err);
					  console.log('error pulling data');
					}
					else {
					  var reply = result.message;
					  reply = decodeURIComponent(reply).replace(/\+/g, " ");
					  reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
	
					  blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
					  session.endConversation(reply);
					}
				});
			}, 2500);
		}

    }
]);

lib.dialog('/confirmIncall', [
    function (session, args, next) {
        // session.send('[Start Confirm Incall]');
        // session.send('%j', args);
        try {
            if (args.reprompt >= 3) {
                resDB.queryRes('confirmService:/', 0, 0, function (err, result) {
                    if (err) {
                        console.log(err);
                        console.log('error pulling data');
                    }
                    else {
                        var reply = result.message;
                        reply = decodeURIComponent(reply).replace(/\+/g, " ");
                        reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                        blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                        session.endConversation(reply);            
                    }
                });
            }
            else {
                session.dialogData.givenService = args.data;
                session.dialogData.prompt = args.reprompt;
                session.dialogData.stored_reprompt = args.stored_reprompt;
                builder.Prompts.text(session, args.reply);    
            }
        }
        catch (err) {
			setTimeout(function() {
				resDB.queryRes('global', 0, 0, function (err, result) {
					if (err) {
					  console.log(err);
					  console.log('error pulling data');
					}
					else {
					  var reply = result.message;
					  reply = decodeURIComponent(reply).replace(/\+/g, " ");
					  reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
	
					  blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
					  session.endConversation(reply);
					}
				});
			}, 2500);
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
    
                // if (args.reprompt >= 2) {
                //     blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                //     session.endConversation('stop wasting my time you jerk!');
                // }
                if (intent == 'Intent.Confirmation_Yes') {
                    resDB.queryRes('confirmService:/confirmIncall', 1, 0, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.userData.profile.confirmation.service.inout = 'incall';	
                            givenService.inout = 'incall';
                            givenService = utilsService.updateService(givenService, givenService);
                            givenService.flag_rejectOut = 0;
                            session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt});
                        }
                    });
                }
                else if (intent == 'Intent.Offer_Transportation') {
                    resDB.queryRes('confirmService:/confirmIncall', 1, 1, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            
                            session.userData.profile.confirmation.service.inout = 'outcall';
                            givenService.inout = 'outcall';
                            givenService = utilsService.updateService(givenService, givenService);
                            givenService.flag_rejectOut = 0;
                            session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt});
                        }
                    });
                }     
                else if (service && givenService_new.inout == 'outcall') {
                    resDB.queryRes('confirmService:/confirmIncall', 1, 2, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.replaceDialog('/confirmIncall', {data: givenService, reply: reply, reprompt: session.dialogData.prompt+1, stored_reprompt: session.dialogData.stored_reprompt});
                        }
                    });
                }
                else if (service && givenService_new.inout == 'incall') {
                    session.userData.profile.confirmation.service.inout = 'incall';	
                    givenService.inout = 'incall';
                    givenService = utilsService.updateService(givenService, givenService);
                    givenService.flag_rejectOut = 0;
                    // session.send('%j', givenService);
                    resDB.queryRes('confirmService:/confirmIncall', 1, 3, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt});
                        }
                    });
                }
                else {
                    resDB.queryRes('confirmService:/confirmIncall', 1, 4, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.replaceDialog('/confirmIncall', {data: givenService, reply: reply, reprompt: session.dialogData.prompt+1, stored_reprompt: session.dialogData.stored_reprompt});
                        }
                    });
                }  
           });  
        }
        catch (err) {
			setTimeout(function() {
				resDB.queryRes('global', 0, 0, function (err, result) {
					if (err) {
					  console.log(err);
					  console.log('error pulling data');
					}
					else {
					  var reply = result.message;
					  reply = decodeURIComponent(reply).replace(/\+/g, " ");
					  reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
	
					  blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
					  session.endConversation(reply);
					}
				});
			}, 2500);
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
                resDB.queryRes('confirmService:/confirmRaw', 0, 0, function (err, result) {
                    if (err) {
                        console.log(err);
                        console.log('error pulling data');
                    }
                    else {
                        var reply = result.message;
                        reply = decodeURIComponent(reply).replace(/\+/g, " ");
                        reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                        blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                        session.endConversation(reply);
                    }
                });
            }
            else {
                builder.Prompts.text(session, args.reply);
            }
        }
        catch (err) {
			setTimeout(function() {
				resDB.queryRes('global', 0, 0, function (err, result) {
					if (err) {
					  console.log(err);
					  console.log('error pulling data');
					}
					else {
					  var reply = result.message;
					  reply = decodeURIComponent(reply).replace(/\+/g, " ");
					  reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
	
					  blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
					  session.endConversation(reply);
					}
				});
			}, 2500);
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
                    resDB.queryRes('confirmService:/confirmRaw', 0, 1, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.dialogData.givenService.flag_addon = 0;
                        session.replaceDialog('/', {data: session.dialogData.givenService, reply: reply, reprompt: session.dialogData.stored_reprompt});
                        }
                    });
                }
                else if (intent == 'Intent.Pregnant') {
                    resDB.queryRes('confirmService:/confirmRaw', 0, 2, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.dialogData.givenService.flag_addon = 0;
                            session.replaceDialog('/', {data: session.dialogData.givenService, reply:reply, reprompt:session.dialogData.stored_reprompt}); 
                        }
                    });
                }
                else if (intent == 'Intent.QuestionAge') {
                    var age = 16;
                    resDB.queryRes('confirmService:/confirmRaw', 0, 3, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.replaceDialog('/underAge', {data: session.dialogData.givenService, reply:reply, stored_reprompt:session.dialogData.stored_reprompt, reprompt:0});
                        }
                    });
                }
                else if (service && givenService_new.addon == 'raw') {
                    resDB.queryRes('confirmService:/confirmRaw', 0, 4, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.replaceDialog('/confirmRaw', {data: givenService, reply:reply, reprompt:session.dialogData.reprompt+1});                 
                        }
                    });
                }
                else {
                    resDB.queryRes('confirmService:/confirmRaw', 0, 5, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.replaceDialog('/confirmRaw', {data: givenService, reply:reply, reprompt:session.dialogData.reprompt+1});                          
                        }
                    });
                }
            })
        }
        catch (err) {
			setTimeout(function() {
				resDB.queryRes('global', 0, 0, function (err, result) {
					if (err) {
					  console.log(err);
					  console.log('error pulling data');
					}
					else {
					  var reply = result.message;
					  reply = decodeURIComponent(reply).replace(/\+/g, " ");
					  reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
	
					  blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
					  session.endConversation(reply);
					}
				});
			}, 2500);
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
                resDB.queryRes('confirmService:/confirmBDSM', 0, 0, function (err, result) {
                    if (err) {
                        console.log(err);
                        console.log('error pulling data');
                    }
                    else {
                        var reply = result.message;
                        reply = decodeURIComponent(reply).replace(/\+/g, " ");
                        reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                        blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                    session.endConversation(reply);
                    }
                });
            }
            else {
                builder.Prompts.text(session, args.reply);
            }          
        }
        catch (err) {
			setTimeout(function() {
				resDB.queryRes('global', 0, 0, function (err, result) {
					if (err) {
					  console.log(err);
					  console.log('error pulling data');
					}
					else {
					  var reply = result.message;
					  reply = decodeURIComponent(reply).replace(/\+/g, " ");
					  reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
	
					  blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
					  session.endConversation(reply);
					}
				});
			}, 2500);
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
                    resDB.queryRes('confirmService:/confirmBDSM', 0, 1, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.dialogData.givenService.flag_addon = 0;
                            session.replaceDialog('/', {data: session.dialogData.givenService, reply:reply, reprompt:session.dialogData.stored_reprompt});
        
                        }
                    });
                }
                else if (intent == 'Intent.Ensure') {
                    resDB.queryRes('confirmService:/confirmBDSM', 0, 2, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.dialogData.givenService.flag_addon = 0;
                            session.replaceDialog('/', {data: session.dialogData.givenService, reply:reply, reprompt:session.dialogData.stored_reprompt}); 
        
                        }
                    });                    
                }
                else if (intent == 'Intent.QuestionAge') {
                    var age = 16;
                    resDB.queryRes('confirmService:/confirmBDSM', 0, 3, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.replaceDialog('/underAge', {data: session.dialogData.givenService, reply:reply, stored_reprompt:session.dialogData.stored_reprompt, reprompt:0});
                        }
                    });
                }
                else if (service && givenService_new.addon == 'bdsm') {
                    resDB.queryRes('confirmService:/confirmBDSM', 0, 4, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.replaceDialog('/confirmBDSM', {data: givenService, reply:reply, reprompt:session.dialogData.reprompt+1});                 
                        }
                    });
                    
                    
                }
                else {
                    resDB.queryRes('confirmService:/confirmBDSM', 0, 5, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.replaceDialog('/confirmBDSM', {data: givenService, reply:reply, reprompt:session.dialogData.reprompt+1});                          
                        }
                    });
                }
            })
        }
        catch (err) {
			setTimeout(function() {
				resDB.queryRes('global', 0, 0, function (err, result) {
					if (err) {
					  console.log(err);
					  console.log('error pulling data');
					}
					else {
					  var reply = result.message;
					  reply = decodeURIComponent(reply).replace(/\+/g, " ");
					  reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
	
					  blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
					  session.endConversation(reply);
					}
				});
			}, 2500);
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

            if (args.reprompt >= 3) {
                reply = "u dont wannt to meet stop wasting my time! not replying you bye!"
                blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                session.endConversation(reply);
            }
            else {
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
                    if (inquiryService.has_addon && inquiryService.addon != 'raw') {
                        reply += 'any fetish thing is 50 extra..';
                        session.userData.profile.confirmation.price.priceGiven.addon = 1;
                    }
                    if (inquiryService.has_addon && inquiryService.addon != 'raw') {
                        reply += 'no extra $$ but you need to bring paln b pills.'
                        session.userData.profile.confirmation.price.priceGiven.bare = 1;
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
        }
        catch (err) {
			setTimeout(function() {
				resDB.queryRes('global', 0, 0, function (err, result) {
					if (err) {
					  console.log(err);
					  console.log('error pulling data');
					}
					else {
					  var reply = result.message;
					  reply = decodeURIComponent(reply).replace(/\+/g, " ");
					  reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
	
					  blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
					  session.endConversation(reply);
					}
				});
			}, 2500);
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
                    resDB.queryRes('confirmService:/givePrice', 1, 0, function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('error pulling data');
                        }
                        else {
                            var reply = result.message;
                            reply = decodeURIComponent(reply).replace(/\+/g, " ");
                            reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                            session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt})
                        }
                    });
                }
                else if (intent == 'Intent.Price_Inquiry') {
                    // session.send('Switch to Price with data: %j', givenService);
                    session.replaceDialog('/givePrice', {data: givenService, data_inquiry: givenService_new, reply: '', stored_reprompt: session.dialogData.stored_reprompt, reprompt: session.dialogData.reprompt+1});
                }
                else if (givenService_new) {
                    // session.send('[service mentioned]');
                    if (_.isEqual(givenService, session.dialogData.givenService)) {
                        resDB.queryRes('confirmService:/givePrice', 1, 1, function (err, result) {
                            if (err) {
                                console.log(err);
                                console.log('error pulling data');
                            }
                            else {
                                var reply = result.message;
                                reply = decodeURIComponent(reply).replace(/\+/g, " ");
                                reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
                                session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt})
                            }
                        });
                    }
                    else {
                        var priceGiven = session.userData.profile.confirmation.price.priceGiven;
                        // session.send('price given: %j', priceGiven);
                        if ((givenService_new.has_duration && priceGiven[givenService_new.duration]) ||
                        (givenService_new.has_inout && priceGiven.inout) || 
                        (givenService_new.addon && priceGiven.addon)) {
                            var reply = 'good..';
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
			setTimeout(function() {
				resDB.queryRes('global', 0, 0, function (err, result) {
					if (err) {
					  console.log(err);
					  console.log('error pulling data');
					}
					else {
					  var reply = result.message;
					  reply = decodeURIComponent(reply).replace(/\+/g, " ");
					  reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
	
					  blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
					  session.endConversation(reply);
					}
				});
			}, 2500);
		}
    }
]);

lib.dialog('/underAge', [
    function (session, args, next) {
        try {
            var givenService = args.data;
            session.dialogData.givenService = args.data;
            session.dialogData.prompt = args.reprompt;
            session.dialogData.stored_reprompt = args.stored_reprompt;            
            builder.Prompts.text(session, args.reply);
        }
        catch (err) {
			setTimeout(function() {
				resDB.queryRes('global', 0, 0, function (err, result) {
					if (err) {
					  console.log(err);
					  console.log('error pulling data');
					}
					else {
					  var reply = result.message;
					  reply = decodeURIComponent(reply).replace(/\+/g, " ");
					  reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
	
					  blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
					  session.endConversation(reply);
					}
				});
			}, 2500);
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
            
                if (session.dialogData.prompt >= 2) {
                    var reply = 'time is $$ and you are wasting. not talking 2 u lol.';
                    blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                    session.endConversation(reply);
                }
                else if (intent == 'Intent.Confirmation_Yes') {
                    var reply = 'i maybe young but i make up in other ways lol....you are going to bring me pill then?';
                    session.replaceDialog('/confirmRaw', {data: session.dialogData.givenService, reply:reply, reprompt:session.dialogData.stored_reprompt});
                }
                else if (intent == 'Intent.Police') {
                    var reply = "hell no i'm not police. i dont wannna trouble if you not gonna to do it fine. just tell me yes or no?"
                    session.replaceDialog('/underAge', {data: session.dialogData.givenService, reply: reply, stored_reprompt: session.dialogData.stored_reprompt, reprompt: session.dialogData.reprompt+1})
                }
                else if (intent == 'Intent.QuestionAge') {
                    var reply = "you dont believe me fine then drop my number stop wasting my time! bye~";
                    blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                    session.endConversation(reply);
                }
                else if (intent == 'Intent.AskProof' || intent == 'Intent.Get_Pic') {
                    var reply = "Nah not doing nudity I've been burnt too many times. if you dont believe then dont wate my time. bye";
                    blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                    session.endConversation(reply);
                }
                else {
                    var reply = "err you ok that i'm a bit young?";
                    session.replaceDialog('/underAge', {data: session.dialogData.givenService, reply: reply, stored_reprompt: session.dialogData.stored_reprompt, reprompt: session.dialogData.reprompt+1})
                }
            
            });  
        }
        catch (err) {
			setTimeout(function() {
				resDB.queryRes('global', 0, 0, function (err, result) {
					if (err) {
					  console.log(err);
					  console.log('error pulling data');
					}
					else {
					  var reply = result.message;
					  reply = decodeURIComponent(reply).replace(/\+/g, " ");
					  reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');
	
					  blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
					  session.endConversation(reply);
					}
				});
			}, 2500);
		}
    } 
]);
module.exports.createLibrary = function(){
    return lib.clone();
};

