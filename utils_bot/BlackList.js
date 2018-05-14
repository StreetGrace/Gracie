var mongodb = require("mongodb");

const options = {
	ip: '18.234.8.122',
	port: '27017',
	database: 'gracie',
	collection: 'user_logging',
	username: 'adclaimsuser@bbdo.com',
	password: 'Bbdoatl1',
	queryString: 'gracie'
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
	var update = {
		'$set': { 
			'user_id': data.user_id,
			'user_name': data.user_name
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
		  console.log('Error inserting user id: ' + err.toString());
		  throw err;
		});
	});
  }

module.exports = {
	find: find,
	insert: insert
};