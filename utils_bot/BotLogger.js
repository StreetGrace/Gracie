
var winston = require('winston')
var logger = new winston.Logger()
require('winston-mongodb').MongoDB

function extend (origin, add) {
    // Don't do anything if add isn't an object
    if (!add || typeof add !== 'object') return origin;
  
    var keys = Object.keys(add);
    var i = keys.length;
    while (i--) {
      origin[keys[i]] = add[keys[i]];
    }
    return origin;
};

function getErrMeta(err, user_id) {
    let { message } = err;
    if (!message && typeof err === 'string') {
      message = err;
    }

    return {
      error: err,
      // TODO (indexzero): how do we configure this?
      user_id: user_id,
      level: 'error',
      message: [
        `Exception Caught: ${(message || '(no error message)')}`,
        err.stack || '  No stack trace'
      ].join('\n'),
      stack: err.stack,
    };   
}
// Set up Bot Logger 
winston.loggers.add('botLog', {
    transports : [
        new(winston.transports.MongoDB) ({
            db: 'mongodb://adclaimsuser%40bbdo.com:Bbdoatl1@18.234.8.122:27017/gracie',
            collection : 'bot_logging',
            level: 'info',
            label: 'Standard',
            capped: true
        }),    
    ]
})

winston.loggers.add('UncaughtExceptionLog', {
    transports : [
        new(winston.transports.MongoDB) ({
            db: 'mongodb://adclaimsuser%40bbdo.com:Bbdoatl1@18.234.8.122:27017/gracie',
            collection : 'bot_logging',
            level: 'info',
            label: 'Uncaught Exception',
            handleExceptions: true,
            capped: true,   
        }),    
    ]
})

var botLog = winston.loggers.get('botLog');

module.exports = {
    botLog,
    getErrMeta: getErrMeta
};

// var uncaughtExceptionLog = winston.loggers.get('UncaughtExceptionLog');

// var uncaughtLog = winston.loggers.get('UncaughtExceptionLog');

// botLog.log = function(){
//     var args = arguments;
//     var level = args[0];

//     var originalMeta = args[2] || {};
//     args[2] = extend(originalMeta, {logType: 'Standard'});
    
//     winston.Logger.prototype.log.apply(this,args);
// };

// logger.log = function(){
//     var args = arguments;
//     var level = args[0];
    
//     var originalMeta = args[2] || {};

//     args[2] = extend(originalMeta, {logType: 'Uncaught Exception'});

//     winston.Logger.prototype.log.apply(this,args);
// };