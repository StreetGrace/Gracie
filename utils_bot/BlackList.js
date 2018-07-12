var mongodb = require("mongodb");
var utils = require("./../utils_dialog/utils_Time");

const options = {
	ip: '18.234.8.122',
	port: '27017',
	database: 'test',
	collection: 'user_logging',
	username: 'adclaimsuser@bbdo.com',
	password: 'Bbdoatl1',
	queryString: 'test'
}

function find (user_id, cb) {
    var uri = "mongodb://" + options.ip + ":" + options.port + "/" + options.queryString;
    var conditions = {
        'user_id': user_id
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
	mongoClient.connect(uri, connectOptions).then(database => {
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
	find: find,
	insert: insert
};