var restify = require('restify');
var builder = require('botbuilder');
var apiai = require('./apiai_recognizer');
var utils = require('./utils');
var mongodb_1 = require("mongodb");
var buffer = require('./messageBuffer');
//create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassWord: process.env.MICROSOFT_APP_PASSWORD
});

//create memory storage
var Storage = new builder.MemoryBotStorage();

//receive messages from the user and respond
const bot = new builder.UniversalBot(connector,{})
	.set('storage', Storage);

//setup restify server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function(){
	console.log('%s listening to %s', server.name, server.url);
});

//listen for message from users
server.post('/api/messages', [concatMsg(), connector.listen()]);

// msg_stored = {};

function concatMsg () {
    // now = new Date();
    return function (req, res, next) {
        if (req.body) {
            next();
        }
        else {
            var requestData = '';
            req.on('data', function (chunk) {
                requestData += chunk;
            });
            req.on('end', function () {
                try {
                    req.body = JSON.parse(requestData);
                    if (req.body.type != 'message') {
                        next();
                    }
                    else {
                        var time_stored;
                        var time_received = new Date().getTime();    
                        buffer.find(req.body.conversation.id, function (result) {
                            if (result) {
                                // console.log(result);
                                req.body.text = result.msg + ' ' + req.body.text;
                            }
                            // console.log('Text: ' + req.body.text);
                            data = {
                                conversation_id: req.body.conversation.id,
                                msg: req.body.text,
                                timestamp: time_received
                            };
                            buffer.insert(data);
                        });     
        
                        setTimeout(function () {
                            var now = new Date().getTime();
                            buffer.find(req.body.conversation.id, function (result) {
                                if (result && result.timestamp) {
                                    time_stored = result.timestamp;
                                }
                                else {
                                    time_stored = time_received;
                                }
                                if (now - time_stored > 5000) {
                                    buffer.del_msg(req.body.conversation.id);
                                    // console.log('Complete Msg: ' + req.body.text)
                                    // console.log('Complete Now: ' + now);
                                    // console.log('Complete time_stored: ' + time_stored);
                                    // console.log('Complete Diff: ' + (now - time_stored));                                
                                    next();
                                }
                                else {
                                    // console.log('Msg: ' + req.body.text)
                                    // console.log('Now: ' + now);
                                    // console.log('time_stored: ' + time_stored);
                                    // console.log('Diff: ' + (now - time_stored));  
                                    res.status(202);
                                    res.end();
                                }
                            });
                        }, 5000);
        
                    }              
                }
                catch (err) {
                    console.error('Custom Handler: receive - invalid request data received.');
                    res.send(400);
                    res.end();
                    return;
                }
            });
        }
    };
}

bot.dialog('/', [
    function (session, args, next) {
        session.send('hello');
    },
]);