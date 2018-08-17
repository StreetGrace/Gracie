var mongodb = require("mongodb");
var config = require('./../config').config;

const options = config.bufferConn;

function find (conversation_id, cb) {
    var uri = "mongodb://" + options.ip + ":" + options.port + "/" + options.queryString;
    var conditions = {
        'conversation_id': conversation_id
    }    
    
	var connectOptions = {useNewUrlParser: true};
	if (options.username && options.password) {
		connectOptions.auth = {};
		connectOptions.auth.user = options.username;
		connectOptions.auth.password = options.password;
	}	    

  var mongoClient = mongodb.MongoClient;
	mongoClient.connect(uri, connectOptions).then(database => {
	  return database
		.db(options.database)
		.collection(options.collection)
		.findOne(conditions, function (err, result) {
			database.close(true);
			cb(result); 
		});
	})	
}

function insert (data) {
	var uri = "mongodb://" + options.ip + ":" + options.port + "/" + options.queryString;
	var conditions = {
		'conversation_id': data.conversation_id
	};
	var update = {
		'$set': { 
			'conversation_id': data.conversation_id,
			'msg': data.msg,
			'timestamp': data.timestamp,
			'attm': data.attm
		} 
	};	
	var connectOptions = {useNewUrlParser: true};
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

function del_msg (conversation_id) {
	var uri = "mongodb://" + options.ip + ":" + options.port + "/" + options.queryString;
	var conditions = {
		'conversation_id': conversation_id
	};
		
	var connectOptions = {useNewUrlParser: true};
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
		.deleteOne(conditions)
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
	find: find,
	insert: insert,
	del_msg: del_msg
};