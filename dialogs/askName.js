var builder = require('botbuilder');
var apiai = require('./apiai_recognizer');

var lib = new builder.Library('askName');
lib.dialog('/', [
    function(session, args){
        session.send('[Start askName Dialog]');
        var reply = args.reply;
        builder.Prompts.text(session, reply + " can i have your name?");
    },
    function(session, args){
        var msg = args.response;
        apiai.recognizer.recognize( {message: {text:msg}}, function (error, response) {
            var intent = response.intent;
            var entities = response.entities;
            if (entities.hasOwnProperty('entity-name')) {
                var name =  entities['entity-name'];                	
            }
            else{
                var name = '';
            }        
            if(name){
                session.send(`${name} right? cool.`);
            }
            else{
                session.send('well then');
                name = 'mysterious'
            }
            session.endDialogWithResult({ response: name });
        });
    }
]);

module.exports.createLibrary = function(){
    return lib.clone();
};