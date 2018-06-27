'use strict';
// let patch = require('./../utils_bot/patches');

var db = require('./../utils_bot/QueryDB_1');
var utils = require('./../utils_dialog/utils');

var botLog = require('./../utils_bot/BotLogger');
var botLogger = botLog.botLog;

let restify = require('restify')
//Include the library botbuilder
let builder = require('botbuilder')

//Create the server
let server = restify.createServer()

//Run the server continuously
server.listen(3978, function(){
	console.log('The server is running on ', server.name, server.url)
})

// Create chat connector with the default id and password
let connector = new builder.ChatConnector({
	appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
})

//When the server posts to /api/messages, make the connector listen to it.
// server.post('/api/messages', connector.listen())

// var inMemoryStorage = new builder.MemoryBotStorage();
// var bot = new builder.UniversalBot(connector, {});
// bot.set('storage', inMemoryStorage);
db.queryDB('opener:/availability', 0, 2)
	.then( res => {
		console.log(res.rows);
		return res
	})
	.then( res => {
		var msg = utils.getMsg(res);
		console.log(msg);
	})

bot.dialog('/', [
	function (session, args, next) {
		try {
			let reply;
			var sessionInfo = utils.getSessionInfo(session);

			db.queryDB('global', 0, 0)
				.then( res => {
					reply = utils.parseMsg(res.rows);
					res.connection.end();
					
					var test2 = 'test2';
					if (session.message.text == '1') {
						return db.queryDB('confirmService:/', 0, 1);
					}
					return '';
				}, err => {
					err.connection.end();
					throw (err.err);
				})
				.then( res => {
					if (res) {
						reply += ' || ' + utils.parseMsg(res.rows) + test2;
						res.connection.end();
					}
					session.send(reply);
				}, err => {
					if (err.connection) {
						err.connection.end();
						throw (err.err)
					}
					else {
						throw err
					}
				})
				// .then(res => {
				// 	session.beginDialog('test2');
				// })
				.catch(err => {
					var errInfo = utils.getErrorInfo(err);
					botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
					session.endConversation('Error');
				}) 			
		}
		catch (err) {
			console.log('ERR: ' + err.message);
			
		}
	}
]);

bot.dialog('test', [
	function (session, args, next) {
		let reply = 'd2: ';
		db.queryDB('global', 0, 0)
			.then( res => {
				reply += utils.parseMsg(res.rows);
				res.connection.end();
		
				if (session.message.text == '1') {
					return db.queryDB('confirmService:/', 0, 1);
				}
				return '';
			},
			err => {
				err.connection.end();
				throw err.err;
			})
			.then( function(res) {
				if (res) {
					reply += ' || ' + utils.parseMsg(res.rows);
					res.connection.end();
				}
				session.send(reply);
			})
			.catch(err => {
				console.log(err.message) 
			}) 
	}
])

