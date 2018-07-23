var apiai = require('./../utils_bot/ApiaiRecognizer');
var db = require('./../utils_bot/QueryDB_1');
var utils = require('./../utils_dialog/utils');
var msg = 'how much for quickie?';

apiai.recognize({message:{text: msg}, inputContexts: ['confirm']})
    .then(res => {
        var intent = res.intent;
        if (intent == 'Confirm.Confirmation_No') {
            var code = 1;
            console.log(code);
            console.log('%j', res);
        }
        else {
            return apiai.recognize({message:{text: msg}})
                .then( res=> {
                    var code = 2;
                    console.log(code);
                    console.log('%j', res);
                    return db.queryDB('confirmService:/givePrice', 1, 0)
                    .then( res=> {
                        var reply = eval('`'+ utils.getMsg(res).replace(/`/g,'\\`') + '`');  
                        session.replaceDialog('/', {data: givenService, reply: reply, reprompt: session.dialogData.stored_reprompt})
                    }, err => {
                        utils.throwErr(err);
                    })       
                })
        }
    })
    .catch(err => {
        console.log(err.message);
    })