
var winston = require('winston')
var logger = new winston.Logger()
require('winston-mongodb').MongoDB

// Set up Bot Logger 
// I override logger function
// in case of error I'll inject errorMeta to meta
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

winston.loggers.add('botLog', {
    transports : [
        new(winston.transports.MongoDB) ({
            db: 'mongodb://adclaimsuser%40bbdo.com:Bbdoatl1@18.234.8.122:27017/gracie',
            collection : 'bot_logging',
            level: 'info',
            handleExceptions: true,
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
            handleExceptions: true,
            capped: true,   
        }),    
    ]
})

var botLog = winston.loggers.get('botLog');
var unacaughtLog = winston.loggers.get('UncaughtExceptionLog');

botLog.log = function(){
    var args = arguments;
    var level = args[0];
  
    if(level === 'error') {
      var originalMeta = args[2] || {};
      args[2] = extend(originalMeta, {logType: 'Standard'});
    }
  
    winston.Logger.prototype.log.apply(this,args);
  };


module.exports = {
    botLog: botLog
};

botLog.error('metaobj test', {conversation_id: 'Test'});
x();

// botLog.info('Test');
// botLog.info('metaobj test', {'meg': 'Test'});
// botLog.warn('Test Warn');
// botLog.log('info', 'test', {id: 'test_id'})