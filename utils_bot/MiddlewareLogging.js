var mongodb= require("mongodb");
var utils = require('./../utils_dialog/utils_Time');

const options = {
    ip: '18.234.8.122',
    port: '27017',
    database: 'gracie',
    collection: 'chat_test_logging',
    username: 'adclaimsuser@bbdo.com',
    password: 'Bbdoatl1',
    queryString: 'gracie'
}

function insert(data) {
	var uri = "mongodb://" + options.ip + ":" + options.port + "/" + options.queryString;
	var conditions = {
		'conversation_id': data.conversation_id
	};
	var update = {
		'$push': { 'data': data } 
	};	
	var connectOptions = {};
	if (options.username && options.password) {
		connectOptions.auth = {};
		connectOptions.auth.user = options.username;
		connectOptions.auth.password = options.password;
	}	
	
	var mongoClient = mongodb.MongoClient;
	return mongoClient.connect(uri, connectOptions).then(database => {
	  return database
		.db(options.database)
		.collection(options.collection)
		.update(conditions, update, { upsert: true })
		.then(() => {
		  database.close(true);
		})
		.catch(err => {
		  database.close(true);
		  throw err;
		});
	});
  }

module.exports = {
	logIncomingMessage: function (session, next) {
		var message = session.message;
		var entry = {
			conversation_id: message.address.conversation.id,
			address_id: message.address.id,
			channel_id: message.address.channelId,
			direction: 'incoming',
			agent: message.agent,
			source: message.source,
			user_id: message.user.id,
			user_name: message.user.name,
			bot_id: message.address.bot.id,
			bot_name: message.address.bot.name,
			text: message.text
		};
		var now = new Date();
		var timestamp = utils.toIsoString(now);		
		entry.timestamp = timestamp;		
		var db = insert(entry);

		if (session.message.text) {
			session.message.text = session.message.text.replace(/q.v./gi, 'qv');
		}
		 
		next();
	},
	logOutgoingMessage: function (event, next) {
		var message = event;
		var entry = {
			conversation_id: message.address.conversation.id,
			address_id: message.address.id,
			channel_id: message.address.channelId,
			direction: 'outgoing',
			agent: message.agent,
			source: message.source,
			user_id: message.address.user.id,
			user_name: message.address.user.name,
			bot_id: message.address.bot.id,
			bot_name: message.address.bot.name,
			text: message.text,
		};		

		var now = new Date();
		setTimeout(function(){
			var timestamp = utils.toIsoString(now);		
			entry.timestamp = timestamp;	
			if (message.text) {
				var db = insert(entry);		
			}			
			next();
		}, 10);
	},
	logBlackListedMessage: function (req, res) {
		var entry = {
			conversation_id: req.body.conversation.id,
			address_id: null,
			channel_id: req.body.channelId,
			direction: 'incoming',
			agent: 'botbuilder',
			source: null,
			user_id: req.body.from.id,
			user_name: req.body.from.name,
			bot_id: req.body.recipient.id,
			bot_name: req.body.recipient.name,
			text: req.body.text
		};

		var now = new Date();
		var timestamp = utils.toIsoString(now);
		entry.timestamp = timestamp;
		var db = insert(entry);
		res.end();
	}
};