var mongodb = require("mongodb");
const mysql = require('mysql');
var utils = require("./../utils_dialog/utils_Time");
var config = require('./../config').config;

const conn = config.whitelistConn;
const metaConn = config.metaConn;

function find (user_id, collection, cb) {
    var uri = "mongodb://" + metaConn.ip + ":" + port + "/" + metaConn.queryString;
    var conditions = {
        'user_id': user_id
    }    
    
	var connectOptions = {};
	if (metaConn.username && metaConn.password) {
		connectOptions.auth = {};
		connectOptions.auth.user = metaConn.username;
		connectOptions.auth.password = metaConn.password;
	}	    

  var mongoClient = mongodb.MongoClient;
    mongoClient.connect(uri, connectOptions)
    .then(database => {
	  return database
		.db(metaConn.database)
		.collection(collection)
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

function queryDB(user_id) {
  var connection = mysql.createConnection(conn);
  
  params = {
    table: 'white_list',
    column: 'phone_number'
  }

  var query =  `select exists(select 1 from ${params.table} where ${params.column} = ${user_id} limit 1)`
  
  return new Promise ( (resolve, reject) => {
    connection.query(query, (err, rows) => {
      if (err) {
        return reject ({connection: connection, err:err});
      }
      resolve ({connection: connection, rows: rows});
    })
  });
}

function archive_log(user_id) {

}

queryDB('+14703058666')
    .then(res => {
        res.connection.end();
        console.log('%j', Object.values(res.rows[0])[0])
    })


module.exports = {
  queryDB: queryDB,
};
 