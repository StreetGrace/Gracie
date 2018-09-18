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
        session.send('Police Dialog Data: %j', session.dialogData);
        session.send('Police Session State: %j', session.sessionState);
        session.dialogData = {reprompt: args.reprompt, denied: args.denied};
        var topicPolice = session.userData.profile.topics.police;
        var dialogStatus = session.dialogData;
        var reply = '';
        if (dialogStatus.reprompt >= 2) {
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
        else if (args.reply) {
            builder.Prompts.text(args.reply);
        }
        else {
            db.queryDB('generalTopic:/police', 0, 1)
            .then( res => {
                reply += (reply ? ' ' : '') + eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');
                if (dialogStatus.denied) {
                    return '';
                }
                else {
                    dialogStatus.denied = true;
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
            console.log('=======================================');
            console.log('Dialog Police, response received');
            console.log('=======================================');
            var dialogStatus = session.dialogData;
            var topicPolice = session.userData.profile.topics.police;
            topicPolice.count += 1;

            session.send('Police Dialog Data: %j', session.dialogData);
            var msg = args.response;
            var sessionInfo = utils.getSessionInfo(session);
            // session.send('Police Args: %j', args);
            apiai.recognize({message: {text: msg}})
				.then(res => {
                    var intent = res.intent;
                    var entities = res.entities;
                            
                    return apiai.recognize({message: {text: msg}, inputContexts: ['confirm']})
                        .then( res => {
                            var intent_c = res.intent;

                            botLogger.info('generalTopic:/police, Receive Response', 
                                Object.assign({}, sessionInfo, 
                                {intent: intent, intent_c: intent_c, entities: entities})); 
                            
                            if (intent_c == 'Confirm.Confirmation_No' && !topicPolice.complete) {
                                return db.queryDB('generalTopic:/police', 1, 0)
                                .then( res=> {
                                    var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');     
                                    topicPolice.complete = true;
                                    session.send(reply);
                                    session.endDialog();
                                    // session.endDialogWithResult({reply: reply});
                                }, err => {
                                    utils.throwErr(err);
                                })            		               
                            }
                            else if ((intent_c == 'Confirm.Confirmation_No' && topicPolice.complete) || intent_c == 'Confirm.Cancel') {
                                utils.endConversation(session, 'complete_nopolice', botLogger);
                            }
                            else if (intent_c == 'Confirm.Confirmation_Yes' && topicPolice.complete) {
                                return db.queryDB('generalTopic:/police', 1, 1)
                                .then( res=> {
                                    var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');    
                                    session.send(reply);
                                    session.endDialog();
                                    // session.endDialogWithResult({reply: reply});
                                }, err => {
                                    utils.throwErr(err);
                                })            		               
                            }
                            else if (intent_c == 'Confirm.Confirmation_Yes' && !topicPolice.complete) {
                                return db.queryDB('generalTopic:/police', 1, 2)
                                .then( res=> {
                                    var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');     
                                    session.replaceDialog('/police', {reply: reply, repormpt: dialogStatus.reprompt+1, denied: dialogStatus.denied});
                                }, err => {
                                    utils.throwErr(err);
                                })            		               
                            }			
                            else {
                                return db.queryDB('generalTopic:/police', 1, 3)
                                .then( res=> {
                                    var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');     
                                    session.replaceDialog('/police', {reply: reply, repormpt: dialogStatus.reprompt+1, denied: dialogStatus.denied});
                                }, err => {
                                    utils.throwErr(err);
                                })   	
                            }  							
                        });
            })
            .catch(err => {
                var errInfo = utils.getErrorInfo(err);
                botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
                utils.endConversation(session, 'error', botLogger);					
            })
        }
        catch (err) {
            var errInfo = utils.getErrorInfo(err);
            botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
            utils.endConversation(session, 'error', botLogger);					
        }
    }		        
]);


module.exports.createLibrary = function(){
    return lib.clone();
};

					
					