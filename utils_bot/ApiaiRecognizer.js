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

module.exports.recognizer = {
    recognize: function (context) {
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
};

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

recognize({message: {text: 'are you with police'}, inputContexts: ['police', 'all']})
    .then(res => {
        console.log('%j', res);
    })
    .catch(err => {
        console.log(err.message);
    })
