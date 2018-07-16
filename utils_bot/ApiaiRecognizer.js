var apiai = require('apiai'); 
var app = apiai('95f0b71700704fac9c60319c677545e8'); 

function apiaiRequest (context) {
    return new Promise( function(resolve, reject) {
        if (context && context.message && context.message.text){
            var msg = context.message.text;
            var inputContexts = context.inputContexts || [];
            var request = app.textRequest(msg, { 
                sessionId: Math.random(),
                contexts: inputContexts
            });
    
            request.on('response', resolve);
            request.on('error', reject);
            request.end();                
        }
        else{
            resolve();
        }
    })
}

function recognize(context) {
    return apiaiRequest(context)
        .then( res => {
            if (res) {
                var result = res.result;
                return {
                    score: 1,
                    intent: result.metadata.intentName,
                    entities: result.parameters                    
                };
            }
            else {
                return { score: 0.0, intent: null, entities: null};
            }
        }, err => {
            throw err;
        })
}

module.exports.recognize = recognize;

module.exports.recognizer = {
    recognize: function(context, callback) {
        var result = { score: 0.0, intent: null, entities: null};
        if (context && context.message && context.message.text){
            var msg = context.message.text;
            var inputContexts = context.inputContexts || [];
            
            var request = app.textRequest(msg, { 
                sessionId: Math.random(),
                contexts: inputContexts
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



// recognize({message: {text: ''}, inputContexts: ['police', 'all']})
//     .then(res => {
//         console.log('%j', res);
//     })
//     .catch(err => {
//         console.log(err.message);
//     })
