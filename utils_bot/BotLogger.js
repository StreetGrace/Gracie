'use strict';

var util = require('util'),
    winston = require('winston'),
    logger = new winston.Logger(),
    production = 
        (process.env.NODE_ENV || '').toLowerCase() === 
        'production';

require('winston-mongodb').MongoDB;

logger.add(winston.transports.Console, {
    colorize: true,
    timestamp: true,
    level: 'info'
});

function initial_logger (conversation_id) {
    logger.remove(winston.transports.Console);
    logger.add(winston.transports.MongoDB, ({
        db: 'mongodb://adclaimsuser%40bbdo.com:Bbdoatl1@18.234.8.122:27017/gracie',
        collection : 'bot_logging',
        level: 'info',
        label: conversation_id,
        capped: true
        }) 
    );
}

module.exports = {
    initial_logger: initial_logger,
    logger: logger
};

// Override the built-in console methods with winston hooks
function formatArgs(args){
    return [util.format.apply(util.format, Array.prototype.slice.call(args))];
}

console.log = function(){
    logger.info.apply(logger, formatArgs(arguments));
};
console.info = function(){
    logger.info.apply(logger, formatArgs(arguments));
};
console.warn = function(){
    logger.warn.apply(logger, formatArgs(arguments));
};
console.error = function(){
    logger.error.apply(logger, formatArgs(arguments));
};
console.debug = function(){
    logger.debug.apply(logger, formatArgs(arguments));
};


/////////////SAMPLES//////////////////////////////////////
// Set up Bot Logger 
// winston.loggers.add('botLog', {
//     transports : [
//         new(winston.transports.MongoDB) ({
//             db: 'mongodb://adclaimsuser%40bbdo.com:Bbdoatl1@18.234.8.122:27017/gracie',
//             collection : 'bot_logging',
//             level: 'info',
//             capped: true
//         })
//     ]
// })
// var botLog = winston.loggers.get('botLog');
// botLog.info('Conversation Start');