const db = 'test';

const config = {
	stateConn: {
		ip: '18.234.8.122',
		port: '27017',
		database: db,
		collection: 'state_data',
		username: 'adclaimsuser@bbdo.com',
		password: 'Bbdoatl1',
		queryString: db		
	},
	blacklistConn: {
		ip: '18.234.8.122',
		port: '27017',
		database: db,
		collection: 'user_logging',
		username: 'adclaimsuser@bbdo.com',
		password: 'Bbdoatl1',
		queryString: db	
	},
	botLogConn: {
		db: 'mongodb://adclaimsuser%40bbdo.com:Bbdoatl1@18.234.8.122:27017/' + db,
		collection : 'bot_logging',
		level: 'info',
		label: 'Standard',
		capped: true	
	},
	botErrConn: {
		db: 'mongodb://adclaimsuser%40bbdo.com:Bbdoatl1@18.234.8.122:27017/' + db,
		collection : 'bot_logging',
		level: 'info',
		label: 'Uncaught Exception',
		handleExceptions: true,
		capped: true,   	
	},
	bufferConn: {
		ip: '18.234.8.122',
		port: '27017',
		database: db,
		collection: 'chat_buffer',
		username: 'adclaimsuser@bbdo.com',
		password: 'Bbdoatl1',
		queryString: db
	},
	chatConn: {
		ip: '18.234.8.122',
		port: '27017',
		database: db,
		collection: 'chat_logging',
		username: 'adclaimsuser@bbdo.com',
		password: 'Bbdoatl1',
		queryString: db	
	},
	resultConn: {
		ip: '18.234.8.122',
		port: '27017',
		database: db,
		collection: 'result_logging',
		username: 'adclaimsuser@bbdo.com',
		password: 'Bbdoatl1',
		queryString: db	
	},
	responseConn: {
	  host: "loreleierd.ciargp61tp0d.us-east-1.rds.amazonaws.com",
	  user: "lorelei_master",
	  password: "Gracie2018",
	  database: "lorelei_erd"	
	}
}

exports.config = config;