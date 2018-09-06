// var apiai = require('./../utils_bot/ApiaiRecognizer');

// var msg = 'sounds good. you are jeni or paige';
// apiai.recognize({message:{text: msg}, inputContexts: ['confirm']})
//     .then(res => {
//         var intent = res.intent;
//         if (intent == 'Confirm.Confirmation_Yes') {
//             var code = 1;
//             console.log(code);
//             console.log('%j', res);
//         }
//         else {
//             return apiai.recognize({message:{text: msg}})
//                 .then( res=> {
//                     var code = 2;
//                     console.log(code);
//                     console.log('%j', res);
//                 })
//         }
//     })
//     .catch(err => {
//         console.log(err.message);
//     })

var test = [1, 34, 21, 4];

console.log(test.slice(-2)[0]);