var apiai = require('apiai'); 
var app = apiai('95f0b71700704fac9c60319c677545e8'); 

module.exports.recognizer = {
	recognize: function(context, callback) {
        var result = { score: 0.0, intent: null, entities: null};
        if (context && context.message && context.message.text){
            var msg = context.message.text;
            
            var request = app.textRequest(msg, { 
                sessionId: Math.random()
            });
            request.on('response', function(response) {
                var res = response.result; 
                var intent_result = {
                    score: 1,
                    intent: res.metadata.intentName,
                    entities: res.parameters                    
                }

                callback(null, intent_result);
            });
            request.on('error', function(error) {
                callback(error);
            });
		    request.end();
        }
        else{
            callback(null, result);
        }
    }
};

