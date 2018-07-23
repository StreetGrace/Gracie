var builder = require('botbuilder');
var apiai = require('./../utils_bot/ApiaiRecognizer');
var utils = require('./../utils_dialog/utils');
var utilsService = require('./../utils_dialog/utils_Service');
var blacklist = require('./../utils_bot/Blacklist');
var resDB = require('./../utils_bot/QueryDB');
var db = require('./../utils_bot/QueryDB_1');
var _ = require('underscore');

var botLog = require('./../utils_bot/BotLogger');
var botLogger = botLog.botLog;

var lib = new builder.Library('confirmService');


lib.dialog('/', [
    function (session, args, next) {
        try {
            session.dialogData.givenService = args.data;
            session.dialogData.reprompt = args.reprompt;
            args.data = utilsService.updateService(args.data, args.data);

            var sessionInfo = utils.getSessionInfo(session);
            botLogger.info('confirmService:/, Start', Object.assign({}, sessionInfo, {data: args.data, reprompt: args.reprompt}));

            if (args.data.complete) {
                // session.userData.profile.confirmation.service.inout = args.data.inout;	
                session.userData.profile.confirmation.service.duration = args.data.duration;	
                session.userData.profile.confirmation.service.addon = args.data.addon;	
                session.userData.profile.confirmation.service.complete = 1;

                db.queryDB('confirmService:/', 0, 1)
				.then( res=> {
                    var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');
                    session.replaceDialog('main:/', {reply: reply, complete_open: 1}); 
				}, err => {
					utils.throwErr(err);
				})
				.catch( err => {
					var errInfo = utils.getErrorInfo(err);
					botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
					
					utils.endConversation(session, 'error');						
                })
            }
            else if (args.reprompt >= 2) {
                utils.endConversation(session, 'boot');
            }
            else if (args.data.flag_rejectOut) {
                session.beginDialog('/confirmIncall', {data: args.data, reply: args.reply, stored_reprompt: args.reprompt, reprompt: 0});
            }
            else if (args.data.has_addon && args.data.flag_addon) {
                if (args.data.addon == 'raw') {
                    db.queryDB('confirmService:/', 0, 2)
                    .then( res=> {
                        var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`').replace('14', '16');
                        session.beginDialog('/confirmRaw', {data: args.data, reply: reply, stored_reprompt: args.reprompt, reprompt: 0});
                    }, err => {
                        utils.throwErr(err);
                    })
                    .catch( err => {
                        var errInfo = utils.getErrorInfo(err);
                        botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                        
                        utils.endConversation(session, 'error');						
                    })
                }
                else if (args.data.addon == 'bdsm') {
                    db.queryDB('confirmService:/', 0, 3)
                    .then( res=> {
                        var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');
                        session.beginDialog('/confirmBDSM', {data: args.data, reply: reply, stored_reprompt: args.reprompt, reprompt: 0});
                    }, err => {
                        utils.throwErr(err);
                    })
                    .catch( err => {
                        var errInfo = utils.getErrorInfo(err);
                        botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                        
                        utils.endConversation(session, 'error');						
                    })
                }
                else if (args.data.addon == 'girlfriend experience') {
                    db.queryDB('confirmService:/', 0, 4)
                    .then( res=> {
                        var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');
                        session.dialogData.givenService.flag_addon = 0;
                        builder.Prompts.text(session, reply); 
                    }, err => {
                        utils.throwErr(err);
                    })
                    .catch( err => {
                        var errInfo = utils.getErrorInfo(err);
                        botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                        
                        utils.endConversation(session, 'error');						
                    })
                } 
                else {
                    db.queryDB('confirmService:/', 0, 5)
                    .then( res=> {
                        var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');
                        session.dialogData.givenService.flag_addon = 0;
                        builder.Prompts.text(session, reply); 
                    }, err => {
                        utils.throwErr(err);
                    })
                    .catch( err => {
                        var errInfo = utils.getErrorInfo(err);
                        botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                        
                        utils.endConversation(session, 'error');						
                    })
                }
            }
            else if (args.data.has_inout && !args.data.has_duration) {
                db.queryDB('confirmService:/', 0, 6)
                .then( res=> {
                    var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');
                    builder.Prompts.text(session, reply); 
                }, err => {
                    utils.throwErr(err);
                })
                .catch( err => {
                    var errInfo = utils.getErrorInfo(err);
                    botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                    
                    utils.endConversation(session, 'error');						
                })
            }
            else {
                db.queryDB('confirmService:/', 1, 0)
                    .then( res=> {
                        var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');                    
                        builder.Prompts.text(session, reply);
                    }, err => {
                        utils.throwErr(err);
                    })
                    .catch( err => {
                        var errInfo = utils.getErrorInfo(err);
                        botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                        
                        utils.endConversation(session, 'error');						
                    })	
            }
        }
        catch (err) {
            var errInfo = utils.getErrorInfo(err);
            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
            utils.endConversation(session, 'error');
		}

    },
    function (session, args, next) {
        try {
            var msg = args.response;
            var sessionInfo = utils.getSessionInfo(session);

            apiai.recognize({message: {text: msg}})
				.then(res => {
                    var intent = res.intent;
                    var entities = res.entities;
                    var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
                    var price = entities['price'] ? entities['price'] : null;
                    var givenService = session.dialogData.givenService;
                    
                    if (service) {
                        service = utils.getEntity('service', service);
                    }
                            
                    botLogger.info('confirmService:/, Receive Response', Object.assign({}, sessionInfo, {intent: intent, entities: entities, givenService: givenService}));                
                    //if response irrelevant
                    if (intent == 'General.Price_Inquiry' || price) {
                        var inquiryService = null;
                        if (service) {
                            inquiryService = utilsService.fillService(service)
                        }
                        session.replaceDialog('/givePrice', {data: givenService, data_inquiry: inquiryService, stored_reprompt: session.dialogData.reprompt, reply: ''});
                    }
                    else if (intent == 'General.Service_Inquiry' || service) {
                        var givenService_new = utilsService.fillService(service);    
                        givenService = utilsService.updateService(givenService, givenService_new);
                        
                        var reply = 'i see....'; 
                        session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.reprompt+1});
                    }
                    else {
                        db.queryDB('confirmService:/', 1, 0)
                            .then( res=> {
                                var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');                                 
                                session.replaceDialog('/', {data: session.dialogData.givenService, reprompt: session.dialogData.reprompt+1, reply: reply});
                            }, err => {
                                utils.throwErr(err);
                            })
                            .catch( err => {
                                var errInfo = utils.getErrorInfo(err);
                                botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                                
                                utils.endConversation(session, 'error');						
                            })	         
                    }
				})
				.catch(err => {
					var errInfo = utils.getErrorInfo(err);
					botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
					utils.endConversation(session, 'error');					
                })		 
        }
        catch (err) {
            var errInfo = utils.getErrorInfo(err);
            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
            utils.endConversation(session, 'error');
		}

    }
]);

lib.dialog('/confirmIncall', [
    function (session, args, next) {
        try {
            var sessionInfo = utils.getSessionInfo(session);
            botLogger.info('confirmService:/confirmIncall, Start', Object.assign({}, sessionInfo, {data: args.data, reprompt: args.reprompt, stored_reprompt: args.stored_reprompt}));        

            if (args.reprompt >= 2) {
                utils.endConversation(session, 'boot');
            }
            else {
                session.dialogData.givenService = args.data;
                session.dialogData.reprompt = args.reprompt;
                session.dialogData.stored_reprompt = args.stored_reprompt;
                builder.Prompts.text(session, args.reply);    
            }
        }
        catch (err) {
            var errInfo = utils.getErrorInfo(err);
            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));

            utils.endConversation(session, 'error');
		}
    },
    function (session, args, next) {
        try {
            var msg = args.response;
            var sessionInfo = utils.getSessionInfo(session);
            apiai.recognize({message: {text: msg}})
				.then(res => {
                    var intent = res.intent;
                    var entities = res.entities;
                    var service = (entities['service'] && entities['service'].length > 0) ? entities['service'] : null;
                    
                    if (service) {
                        var service = utils.getEntity('service', service);
                        var givenService_new = utilsService.fillService(service);    
                        var givenService = utilsService.updateService(session.dialogData.givenService, givenService_new);
                    }
                    else {
                        var givenService_new = null;
                        var givenService = session.dialogData.givenService;
                    
                    }
                    return {
                        intent: intent,
                        entities: entities,
                        service: service,
                        givenService_new: givenService_new,
                        givenService: givenService
                    };
                })
                .then(res => {
                    var intent = res.intent;
                    var entities = res.entites;
                    var service = res.service;
                    var givenService_new = res.givenService_new;
                    var givenService = res.givenService;

                    return apiai.recognize({message: {text: msg}, inputContexts: ['confirm']})
                        .then( res => {
                            var intent_c = res.intent;

                            botLogger.info('confirmService:/confirmincall, Receive Response', 
                                Object.assign({}, sessionInfo, 
                                {intent: intent, intent_c: intent_c, entities: entities, givenService: givenService, givenService_new: givenService_new})); 
                            
                            if (intent_c == 'Confirm.Confirmation_Yes') {
                                db.queryDB('confirmService:/confirmIncall', 1, 0)
                                .then( res=> {
                                    var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');     
                                    session.userData.profile.confirmation.service.inout = 'incall';	
                                    givenService.inout = 'incall';
                                    givenService = utilsService.updateService(givenService, givenService);
                                    givenService.flag_rejectOut = 0;
                                    session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt});
                                }, err => {
                                    utils.throwErr(err);
                                })                           
                            }
                            else if (intent_c == 'Confirm.Confirmation_No' || intent == 'Confirm.Cancel') {
                                utils.endConversation(session, 'complete_noincall');
                            }
                            else if (intent == 'General.Offer_Transportation') {
                                db.queryDB('confirmService:/confirmIncall', 1, 1)
                                    .then( res=> {
                                        var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');  
                                        session.userData.profile.confirmation.service.inout = 'outcall';
                                        givenService.inout = 'outcall';
                                        givenService = utilsService.updateService(givenService, givenService);
                                        givenService.flag_rejectOut = 0;
                                        session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt});
                                    }, err => {
                                        utils.throwErr(err);
                                    })    
                            }     
                            else if (service && givenService_new.inout == 'outcall') {
                                db.queryDB('confirmService:/confirmIncall', 1, 2)
                                    .then( res=> {
                                        var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');  
                                        session.replaceDialog('/confirmIncall', {data: givenService, reply: reply, reprompt: session.dialogData.reprompt+1, stored_reprompt: session.dialogData.stored_reprompt});
                                    }, err => {
                                        utils.throwErr(err);
                                    })
                            }
                            else if (service && givenService_new.inout == 'incall') {
                                session.userData.profile.confirmation.service.inout = 'incall';	
                                givenService.inout = 'incall';
                                givenService = utilsService.updateService(givenService, givenService);
                                givenService.flag_rejectOut = 0;
                                
                                db.queryDB('confirmService:/confirmIncall', 1, 3)
                                    .then( res=> {
                                        var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`'); 
                                        session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt}); 
                                    }, err => {
                                        utils.throwErr(err);
                                    })
                            }
                            else {
                                db.queryDB('confirmService:/confirmIncall', 1, 4)
                                    .then( res=> {
                                        var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');  
                                        session.replaceDialog('/confirmIncall', {data: givenService, reply: reply, reprompt: session.dialogData.reprompt+1, stored_reprompt: session.dialogData.stored_reprompt});
                                    }, err => {
                                        utils.throwErr(err);
                                    })
                            }  							
                        });
                })
				.catch(err => {
					var errInfo = utils.getErrorInfo(err);
					botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
					utils.endConversation(session, 'error');					
                })		
        }
        catch (err) {
            var errInfo = utils.getErrorInfo(err);
            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));            
            utils.endConversation(session, 'error');
		}
    }  
]);

lib.dialog('/confirmRaw', [
    function (session, args, next) {
        try {
            session.dialogData.givenService = args.data;
            session.dialogData.reprompt = args.reprompt;
            session.dialogData.stored_reprompt = args.stored_reprompt;

            var sessionInfo = utils.getSessionInfo(session);
            botLogger.info('confirmService:/confirmRaw, Start', Object.assign({}, sessionInfo, {data: args.data, reprompt: args.reprompt, stored_reprompt: args.stored_reprompt}));

            if (args.reprompt >= 2) {

                utils.endConversation(session, 'boot');
            }
            else {
                builder.Prompts.text(session, args.reply);
            }
        }
        catch (err) {
            var errInfo = utils.getErrorInfo(err);
            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
            utils.endConversation(session, 'error');
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
                    var givenService_new = null;
                }
    
                var sessionInfo = utils.getSessionInfo(session);
                botLogger.info('confirmService:/confirmRaw, Receive Response', 
                    Object.assign({}, sessionInfo, {intent: intent, entities: entities, givenService: givenService, givenService_new: givenService_new}));

                if (intent == 'General.Confirmation_Yes') {
                    db.queryDB('confirmService:/confirmRaw', 0, 1)
                        .then( res=> {
                            var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');  
                            session.dialogData.givenService.flag_addon = 0;
                            session.replaceDialog('/', {data: session.dialogData.givenService, reply: reply, reprompt: session.dialogData.stored_reprompt});
                        }, err => {
                            utils.throwErr(err);
                        })
                        .catch( err => {
                            var errInfo = utils.getErrorInfo(err);
                            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                            
                            utils.endConversation(session, 'error');						
                        })	
                }
                else if (intent == 'General.Pregnant') {
                    db.queryDB()
                        .then( res=> {
                            var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');  
                            session.dialogData.givenService.flag_addon = 0;
                            session.replaceDialog('/', {data: session.dialogData.givenService, reply:reply, reprompt:session.dialogData.stored_reprompt}); 
                        }, err => {
                            utils.throwErr(err);
                        })
                        .catch( err => {
                            var errInfo = utils.getErrorInfo(err);
                            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                            
                            utils.endConversation(session, 'error');						
                        })
                }
                else if (intent == 'General.QuestionAge') {
                    var age = session.userData.profile.default.age;
                    db.queryDB('confirmService:/confirmRaw', 0, 3)
                        .then( res=> {
                            var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');  
                            session.replaceDialog('/underAge', {data: session.dialogData.givenService, reply:reply, stored_reprompt:session.dialogData.stored_reprompt, reprompt:0});
                        }, err => {
                            utils.throwErr(err);
                        })
                        .catch( err => {
                            var errInfo = utils.getErrorInfo(err);
                            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                            
                            utils.endConversation(session, 'error');						
                        })	                    
                }
                else if (service && givenService_new.addon == 'raw') {
                    db.queryDB('confirmService:/confirmRaw', 0, 4)
                        .then( res=> {
                            var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');  
                            session.replaceDialog('/confirmRaw', {data: givenService, reply:reply, reprompt:session.dialogData.reprompt+1, stored_reprompt: session.dialogData.stored_reprompt});     
                        }, err => {
                            utils.throwErr(err);
                        })
                        .catch( err => {
                            var errInfo = utils.getErrorInfo(err);
                            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                            
                            utils.endConversation(session, 'error');						
                        })	
                }
                else {
                    db.queryDB('confirmService:/confirmRaw', 0, 5)
                        .then( res=> {
                            var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`'); 
                            session.replaceDialog('/confirmRaw', {data: givenService, reply:reply, reprompt:session.dialogData.reprompt+1, stored_reprompt: session.dialogData.stored_reprompt});    
                        }, err => {
                            utils.throwErr(err);
                        })
                        .catch( err => {
                            var errInfo = utils.getErrorInfo(err);
                            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                            
                            utils.endConversation(session, 'error');						
                        })	
                }
            })
        }
        catch (err) {
            var errInfo = utils.getErrorInfo(err);
            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
            utils.endConversation(session, 'error');
		}
    }
]);


lib.dialog('/confirmBDSM', [
    function (session, args, next) {
        try {
            session.dialogData.givenService = args.data;
            session.dialogData.reprompt = args.reprompt;
            session.dialogData.stored_reprompt = args.stored_reprompt;

            var sessionInfo = utils.getSessionInfo(session);
            botLogger.info('confirmService:/confirmBDSM, Start', Object.assign({}, sessionInfo, {data: args.data, reprompt: args.reprompt, stored_reprompt: args.stored_reprompt}));            

            if (args.reprompt >= 2) {

                utils.endConversation(session, 'boot');
            }
            else {
                builder.Prompts.text(session, args.reply);
            }          
        }
        catch (err) {
            var errInfo = utils.getErrorInfo(err);
            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
            utils.endConversation(session, 'error');
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
                    var givenService_new = null;
                }

                var sessionInfo = utils.getSessionInfo(session);
                botLogger.info('confirmService:/confirmBDSM, Receive Response', 
                    Object.assign({}, sessionInfo, {intent: intent, entities: entities, givenService: givenService, givenService_new: givenService_new}));

                if (intent == 'General.Confirmation_No') {
                    db.queryDB('confirmService:/confirmBDSM', 0, 1)
                        .then( res=> {
                            var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');  
                            session.dialogData.givenService.flag_addon = 0;
                            session.replaceDialog('/', {data: session.dialogData.givenService, reply:reply, reprompt:session.dialogData.stored_reprompt});
                        }, err => {
                            utils.throwErr(err);
                        })
                        .catch( err => {
                            var errInfo = utils.getErrorInfo(err);
                            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                            
                            utils.endConversation(session, 'error');						
                        })
                }
                else if (intent == 'General.Ensure') {
                    db.queryDB('confirmService:/confirmBDSM', 0, 2)
                        .then( res=> {
                            var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');  
                            session.dialogData.givenService.flag_addon = 0;
                            session.replaceDialog('/', {data: session.dialogData.givenService, reply:reply, reprompt:session.dialogData.stored_reprompt}); 
                        }, err => {
                            utils.throwErr(err);
                        })
                        .catch( err => {
                            var errInfo = utils.getErrorInfo(err);
                            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                            
                            utils.endConversation(session, 'error');						
                        })	
                }
                else if (intent == 'General.QuestionAge') {
                    var age = session.userData.profile.default.age;
                    db.queryDB('confirmService:/confirmBDSM', 0, 3)
                        .then( res=> {
                            var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');  
                            session.replaceDialog('/underAge', {data: session.dialogData.givenService, reply:reply, stored_reprompt:session.dialogData.stored_reprompt, reprompt:0});
                        }, err => {
                            utils.throwErr(err);
                        })
                        .catch( err => {
                            var errInfo = utils.getErrorInfo(err);
                            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                            
                            utils.endConversation(session, 'error');						
                        })
                }
                else if (service && givenService_new.addon == 'bdsm') {
                    db.queryDB('confirmService:/confirmBDSM', 0, 4)
                        .then( res=> {
                            var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');  
                            session.replaceDialog('/confirmBDSM', {data: givenService, reply:reply, reprompt:session.dialogData.reprompt+1});    
                        }, err => {
                            utils.throwErr(err);
                        })
                        .catch( err => {
                            var errInfo = utils.getErrorInfo(err);
                            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                            
                            utils.endConversation(session, 'error');						
                        })                    
                }
                else {
                    db.queryDB('confirmService:/confirmBDSM', 0, 5)
                        .then( res=> {
                            var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');  
                            session.replaceDialog('/confirmBDSM', {data: givenService, reply:reply, reprompt:session.dialogData.reprompt+1});       
                        }, err => {
                            utils.throwErr(err);
                        })
                        .catch( err => {
                            var errInfo = utils.getErrorInfo(err);
                            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                            
                            utils.endConversation(session, 'error');						
                        })
                }
            })
        }
        catch (err) {
            var errInfo = utils.getErrorInfo(err);
            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
            utils.endConversation(session, 'error');
		}
    }
]);

lib.dialog('/givePrice', [
    function (session, args, next) {
        try {
            var givenService = args.data;
            var inquiryService = args.data_inquiry; 
            
            session.dialogData.queryService = args.data_inquiry;
            session.dialogData.givenService = args.data;
            session.dialogData.reprompt = args.reprompt;
            session.dialogData.stored_reprompt = args.stored_reprompt;

            var sessionInfo = utils.getSessionInfo(session);
            botLogger.info('confirmService:/givePrice, Start', Object.assign({}, sessionInfo, {data: args.data, reprompt: args.reprompt, stored_reprompt: args.stored_reprompt}));            

            if (args.reprompt >= 3) {
                utils.endConversation(session, 'boot');
            }
            else {
                var reply = '';
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
                    if (inquiryService.has_addon && inquiryService.addon == 'raw') {
                        reply += 'no extra $$ for raw but you need to bring paln b pills.'
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
            var errInfo = utils.getErrorInfo(err);
            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
            utils.endConversation(session, 'error');
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
    
                var sessionInfo = utils.getSessionInfo(session);
                botLogger.info('confirmService:/givePrice, Receive Response', 
                    Object.assign({}, sessionInfo, {intent: intent, entities: entities, givenService: givenService, givenService_new: givenService_new}));                 
                
                if (intent == 'General.Confirmation_Yes') {
                    db.queryDB('confirmService:/givePrice', 1, 0)
                        .then( res=> {
                            var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');  
                            session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt})
                        }, err => {
                            utils.throwErr(err);
                        })
                        .catch( err => {
                            var errInfo = utils.getErrorInfo(err);
                            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                            
                            utils.endConversation(session, 'error');						
                        })                    
                }
                else if (intent == 'General.Price_Inquiry') {
                    session.replaceDialog('/givePrice', {data: givenService, data_inquiry: givenService_new, reply: '', stored_reprompt: session.dialogData.stored_reprompt, reprompt: session.dialogData.reprompt+1});
                }
                else if (givenService_new) {
                    if (_.isEqual(givenService, session.dialogData.givenService)) {
                        db.queryDB('confirmService:/givePrice', 1, 1)
                            .then( res=> {
                                var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');  
                                session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt})
                            }, err => {
                                utils.throwErr(err);
                            })
                            .catch( err => {
                                var errInfo = utils.getErrorInfo(err);
                                botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                                
                                utils.endConversation(session, 'error');						
                            })	                        
                    }
                    else {
                        var priceGiven = session.userData.profile.confirmation.price.priceGiven;
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
                    session.replaceDialog('/givePrice', {data: givenService, data_inquiry: '', reply: reply, stored_reprompt: session.dialogData.stored_reprompt, reprompt: session.dialogData.reprompt+1});
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

lib.dialog('/underAge', [
    function (session, args, next) {
        try {
            var givenService = args.data;
            session.dialogData.givenService = args.data;
            session.dialogData.reprompt = args.reprompt;
            session.dialogData.stored_reprompt = args.stored_reprompt;    
            
            var sessionInfo = utils.getSessionInfo(session);
            botLogger.info('confirmService:/underAge, Start', Object.assign({}, sessionInfo, {data: args.data, reprompt: args.reprompt, stored_reprompt: args.stored_reprompt}));
                        
            builder.Prompts.text(session, args.reply);
        }
        catch (err) {
            var errInfo = utils.getErrorInfo(err);
            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
            utils.endConversation(session, 'error');
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

                var sessionInfo = utils.getSessionInfo(session);
                botLogger.info('confirmService:/underAge, Receive Response', 
                    Object.assign({}, sessionInfo, {intent: intent, entities: entities, givenService: givenService}));                   

                if (session.dialogData.reprompt >= 2) {
                    var reply = 'time is $$ and you are wasting. not talking 2 u lol.';
                    blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                    session.endConversation(reply);
                }
                else if (intent == 'General.Confirmation_Yes') {
                    var reply = 'i maybe young but i make up in other ways lol....you are going to bring me pill then?';
                    session.replaceDialog('/confirmRaw', {data: session.dialogData.givenService, reply:reply, reprompt:session.dialogData.stored_reprompt});
                }
                else if (intent == 'General.Police') {
                    var reply = "hell no i'm not police. i dont wannna trouble if you not gonna to do it fine. just tell me yes or no?"
                    session.replaceDialog('/underAge', {data: session.dialogData.givenService, reply: reply, stored_reprompt: session.dialogData.stored_reprompt, reprompt: session.dialogData.reprompt+1})
                }
                else if (intent == 'General.QuestionAge') {
                    var reply = "you dont believe me fine then drop my number stop wasting my time! bye~";
                    blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
                    session.endConversation(reply);
                }
                else if (intent == 'General.AskProof' || intent == 'General.Get_Pic') {
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
            var errInfo = utils.getErrorInfo(err);
            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
            utils.endConversation(session, 'error');
		}
    } 
]);
module.exports.createLibrary = function(){
    return lib.clone();
};

