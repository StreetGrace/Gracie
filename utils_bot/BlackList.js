var mongodb = require("mongodb");
var utils = require("./../utils_dialog/utils_Time");
var config = require('./../config').config;

const options = config.blacklistConn;

function find (user_id) {
    var uri = "mongodb://" + options.ip + ":" + options.port + "/" + options.queryString;
    var conditions = {
        'user_id': user_id
    }    
    
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
		.findOne(conditions)
		.then(res => {
			database.close();
			return res
		}, err => {
			database.close();
			throw err;
		});
	})	
}

function insert (data) {
	var uri = "mongodb://" + options.ip + ":" + options.port + "/" + options.queryString;
	var conditions = {
		'user_id': data.user_id
	};

	var now = new Date();
	var timestamp = utils.toIsoString(now);		

	var update = {
		'$set': { 
			'user_id': data.user_id,
			'user_name': data.user_name,
			'timestamp': timestamp
		} 
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
	find: find,
	insert: insert
};


// find('UBZHRDB0V:TBSVD522U1')
// 	.then(res => {console.log('%j', res)})
// 	.catch(err => {
// 		console.log('%j', err)
// 	})