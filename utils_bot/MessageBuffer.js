var mongodb = require("mongodb");

const options = {
    ip: 'ds161713.mlab.com',
    port: '61713',
    database: 'sg_state',
    collection: 'test_msg_buffer',
    username: 'ray',
    password: 'Bbdoatl1',
    queryString: 'sg_state'
}

function find (conversation_id, cb) {
    var uri = "mongodb://" + options.ip + ":" + options.port + "/" + options.queryString;
    var conditions = {
        'conversation_id': conversation_id
    }    
    
	var connectOptions = {};
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
			'timestamp': data.timestamp
		} 
	};	
	var connectOptions = {};
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
		.update(conditions, update, { upsert: true })
		.then(() => {
			// console.log('insert data complete: %j', update);
		  database.close(true);
		})
		.catch(err => {
		  database.close(true);
		  console.log('Error updating log: ' + err.toString());
		  throw err;
		});
	});
  }

function del_msg (conversation_id) {
	var uri = "mongodb://" + options.ip + ":" + options.port + "/" + options.queryString;
	var conditions = {
		'conversation_id': conversation_id
	};
		
	var connectOptions = {};
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
		.deleteOne(conditions)
		.then(() => {
		  database.close(true);
		})
		.catch(err => {
		  database.close(true);
		  console.log('Error deleting log: ' + err.toString());
		  throw err;
		});
	});
}


module.exports = {
	find: find,
	insert: insert,
	del_msg: del_msg
};