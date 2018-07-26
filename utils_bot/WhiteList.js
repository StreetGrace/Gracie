var mongodb = require("mongodb");
const mysql = require('mysql');
var config = require('./../config').config;

const conn = config.whitelistConn;
const metaConn = config.metaConn;

function find (id_condition, db, collection) {
	var uri = "mongodb://" + metaConn.ip + ":" + metaConn.port + "/" + db;
	var conditions = id_condition
    
	var connectOptions = {};
	if (metaConn.username && metaConn.password) {
		connectOptions.auth = {};
		connectOptions.auth.user = metaConn.username;
		connectOptions.auth.password = metaConn.password;
	}	    

  var mongoClient = mongodb.MongoClient;
  return mongoClient.connect(uri, connectOptions)
    .then(database => {
			return database
			.db(db)
			.collection(collection)
			.find(conditions)
			.toArray()
			.then(res => {
				database.close();
				return res
			}, err=> {
				database.close();
				throw err;
			}) 
	})	
}

function insertMany (docs, db, collection) {
	var uri = "mongodb://" + metaConn.ip + ":" + metaConn.port + "/" + db;
	
	var connectOptions = {};
	if (metaConn.username && metaConn.password) {
		connectOptions.auth = {};
		connectOptions.auth.user = metaConn.username;
		connectOptions.auth.password = metaConn.password;
	}	
	
	var mongoClient = mongodb.MongoClient;
	return mongoClient.connect(uri, connectOptions)
		.then(database => {
			return database
			.db(metaConn.database)
			.collection(collection)
			.insertMany(docs)
			.then(() => {
				database.close(true);
			})
			.catch(err => {
				database.close(true);
				throw err;
			});
		})
	}

function deleteMany (docs, db, collection) {
	var uri = "mongodb://" + metaConn.ip + ":" + metaConn.port + "/" + db;
	
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
		.db(db)
		.collection(collection)
		.deleteMany(docs)
		.then(() => {
			database.close(true);
		})
		.catch(err => {
			database.close(true);
			throw err;
		});
	});
}

function queryWL(user_id) {
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

function archiveWL(user_id) {
	var condTable = {
		'chat': {conversation_id: user_id},
		'bot_log': {'meta.conversation_id': user_id},
		'state_data': {'internal_id': {'$in': [user_id+','+user_id, user_id+',userData', user_id+',conversationData']}},
		'chat_del': {conversation_id: {'$in': [user_id]}},
		'bot_log_del': {'meta.conversation_id': {'$in': [user_id]}},
	}

	find(condTable.chat, 'archive', 'test')
		.then(result => {
			insertMany(result, 'archive', 'test2')
		})
		.then( () => {
			deleteMany(condTable.chat_del, 'archive', 'test')
		})
		.then( () => {
			find(condTable.bot_log, 'archive', 'bot_log')
		})
		.then(result => {
			insertMany(result, 'archive', 'test')
		})
		.then( () => {
			deleteMany(condTable.chat_del, 'archive', 'test2')
		})
		.then( () => {
			find(condTable.state_data, 'archive', 'bot_log')
		})
		.then(result => {
			insertMany(result, 'archive', 'test')
		})
		.then( () => {
			deleteMany(condTable.chat_del, 'archive', 'test2')
		})
}

archiveWL('+14703058666');
// insertMany([{id:'test5'}, {id:'test6'}], 'archive', 'test');
// deleteMany({'id': {'$in': ['test5', 'test3']}}, 'archive', 'test');
// var user_id = '+14703058666';
// var cond = {'internal_id': {'$in': [user_id+','+user_id, user_id+',userData', user_id+',conversationData']}};
// find(cond, 'archive', 'state_data')
// 	.then(result => {
// 		console.log('%j', result)
// 	})
// queryDB('+14703058666')
//     .then(res => {
//         res.connection.end();
//         console.log('%j', Object.values(res.rows[0])[0])
//     })

