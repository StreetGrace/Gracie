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

var lib = new builder.Library('generalTopic');

lib.dialog('/police', [
    function (session, args, next) {
        var topicPolice = session.userData.profile.topics.police;
        var reply;
        if (args.reprompt >= 2) {
            utils.endConversation(session, 'boot', botLogger);
        }
        else if (topicPolice.complete && topicPolice.count > 1) {
            utils.endConversation(session, 'boot', botLogger);
        }
        else if (topicPolice.complete && topicPolice.count == 1) {
            db.queryDB('generalTopic:/police', 0, 2)
            .then( res => {
                reply += (reply ? ' ' : '') + eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');
                builder.Prompts.text(session, reply);
            }, err => {
                utils.throwErr(err);
            })
            .catch( err => {
                var errInfo = utils.getErrorInfo(err);
                botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                
                utils.endConversation(session, 'error', botLogger);					
            })           
        }
        else {
            db.queryDB('generalTopic:/police', 0, 1)
            .then( res => {
                reply += (reply ? ' ' : '') + eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');
                if (args.denied) {
                    return '';
                }
                else {
                    return db.queryDB('generalTopic:/police', 0, 0);
                }  
            }, err => {
                utils.throwErr(err);
            })
            .then( res => {
                if (res) {
                    reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`') + ' ' + reply;
                }
                builder.Prompts.text(session, reply);
            }, err => {
                utils.throwErr(err);
            })
            .catch( err => {
                var errInfo = utils.getErrorInfo(err);
                botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                
                utils.endConversation(session, 'error', botLogger);					
            })            
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
                            
                    botLogger.info('confirmService:/, Receive Response', Object.assign({}, sessionInfo, {intent: intent, entities: entities, givenService: givenService}));                
                    //if response irrelevant
                    if (intent == 'General.Price_Inquiry' || price) {
                        var inquiryService = null;
                        if (service) {
                            inquiryService = utilsService.fillService(service)
                        }
                        session.replaceDialog('/givePrice', 
                        {data: givenService, data_inquiry: inquiryService, 
                        stored_reprompt: session.dialogData.reprompt, 
                        reply: '', defaultCount: 0});
                    }
                    else if (intent == 'General.Service_Inquiry' || service) {
                        var givenService_new = utilsService.fillService(service);    
                        givenService = utilsService.updateService(givenService, givenService_new);
                        
                        var reply = 'i see....'; 
                        session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.reprompt+1});
                    }
                    else {
                        return db.queryDB('confirmService:/', 1, 0)
                            .then( res=> {
                                var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');                                 
                                session.replaceDialog('/', {data: session.dialogData.givenService, reprompt: session.dialogData.reprompt+1, reply: reply});
                            }, err => {
                                utils.throwErr(err);
                            })	         
                    }
				})
				.catch(err => {
					var errInfo = utils.getErrorInfo(err);
					botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
					utils.endConversation(session, 'error', botLogger);					
                })		        
    }

]);