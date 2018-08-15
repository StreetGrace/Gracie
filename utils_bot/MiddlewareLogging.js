var mongodb= require("mongodb");
var utils = require('./../utils_dialog/utils_Time');
var config = require('./../config').config;

const options = config.chatConn;
const options_attm = config.chatConnAttm;

function insert(data, attm) {
	if (attm) {
		var opt = options_attm;
	}
	else {
		var opt = options
	}

	var uri = "mongodb://" + opt.ip + ":" + opt.port + "/" + opt.queryString;

	var conditions = {
		'conversation_id': data.conversation_id
	};
	var update = {
		'$push': { 'data': data } 
	};	
	var connectOptions = {useNewUrlParser: true};
	if (opt.username && opt.password) {
		connectOptions.auth = {};
		connectOptions.auth.user = opt.username;
		connectOptions.auth.password = opt.password;
	}	
	
	var mongoClient = mongodb.MongoClient;
	return mongoClient.connect(uri, connectOptions).then(database => {
	  return database
		.db(opt.database)
		.collection(opt.collection)
		.updateOne(conditions, update, { upsert: true })
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
			text: message.text,
			attachment: message.attachments
		};

		var now = new Date();
		var timestamp = utils.toIsoString(now);		
		entry.timestamp = timestamp;		

		if (message.attachments && message.attachments.length > 0) {
			entry.has_attm = true;
		}
		else {
			entry.has_attm = false;
		}
		
		insert(entry, false);
		if (entry.has_attm) {
			insert(entry, true);
		}

		if (session.message.text && !entry.has_attm) {
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
		}, 1000);
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
			text: req.body.text,
			attachments: req.body.attachments
		};

		var now = new Date();
		var timestamp = utils.toIsoString(now);
		entry.timestamp = timestamp;

		if (req.body.attachments && req.body.attachments.length > 0) {
			var db = insert(entry, true);
		}
		else {
			var db = insert(entry, false);
		}
		
		res.end();
	}
};