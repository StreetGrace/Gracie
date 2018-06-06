
var winston = require('winston')
var logger = new winston.Logger()
require('winston-mongodb').MongoDB

// Set up Bot Logger 
winston.loggers.add('botLog', {
    transports : [
        new(winston.transports.MongoDB) ({
            db: 'mongodb://adclaimsuser%40bbdo.com:Bbdoatl1@18.234.8.122:27017/gracie',
            collection : 'bot_logging',
            level: 'info',
            capped: true
        })
    ]
})
var botLog = winston.loggers.get('botLog');

// module.exports = {
//     botLog: botLog
// };

botLog.info('Test');
botLog.warn('Test Warn');
