const db = 'test';

const config = {
	metaConn: {
		ip: '18.234.8.122',
		port: '27017',	
		username: 'adclaimsuser@bbdo.com',
		password: 'Bbdoatl1',
	}, 
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
	whitelistConn: {
		host: "loreleierd.ciargp61tp0d.us-east-1.rds.amazonaws.com",
		user: "lorelei_master",
		password: "Gracie2018",
		database: "lorelei_erd"	
	},
	ongoingConn: {
		ip: '18.234.8.122',
		port: '27017',
		database: db,
		collection: 'user_ongoing_logging',
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
	chatConnAttm: {
		ip: '18.234.8.122',
		port: '27017',
		database: db,
		collection: 'attm_logging',
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
	},	
	initialProfile: {
		default: {
			model: '',
			city: '',
			neighborhood: '',
			age: 16,
			gender: 'Female'
		},
		appointment: {
			'exact-time': [],
			'relative-time': [],
			service: [],
			price: [],
			location: [],	
			model: ''
		},
		demographic: {
			name: ''
		},
		confirmation: {
			time: {
				hour: null, minute: null, date: null, complete: 0
			},
			location: {
				neighborhood: '', site: '', address: '', complete: 0
			},
			service: {
				inout: 'incall', duration: '', addon: '', complete: 0
			},
			price: {
				priceListGiven: 0,
				priceGiven: {
					'30min': 0,
					'1 hour': 0,
					'15min': 0,
					'addon': 0,
					'2 hours': 0,
					'overnight': 0,
					'addon': 0,
					'inout': 0,
					'bare': 0
				}
			}
		}
	}
};

exports.config = config;
exports.db = db;