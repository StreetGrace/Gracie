var saveDialogData = function (session, args, next){
	session.userData.profile = args.response;
	session.endDialog();
};
exports.saveDialogData = saveDialogData;

const availEntity = {
	Availability: ['exact-location', 'service', 'exact-time', 'relative-time', 'entity-name', 'self-reference'],
	Service: ['exact-location', 'service', 'price', 'self-reference','entity-name'],
	Location: ['exact-location', 'service', 'exact-time', 'relative-time', 'self-reference','entity-name'],
	Price: ['service', 'self-reference','entity-name'],
	Greeting: ['entity-name', 'self-reference']
};

const entityDict = {
	'exact-location': 'location',
	'service': 'service',
	'exact-time': 'exact-time',
	'relative-time': 'relative-time',
	'price': 'price',
	'entity-name': 'name',
	'self-reference': 'modelName',
	'service_addon': 'addon',
	'service-cardate': 'cardate',
	'service-duration': 'duration',
	'service-in-out': 'inout'
};

function fillProfile (session, Intent, entities){
	availEntity[Intent].forEach( (entity) => {
		if (entities.hasOwnProperty(entity) && entities[entity]){
			switch(entity) {
				case 'entity-name':
					session.userData.profile.demographic.name = entities[entity];
					break;
				case 'self-reference':
					session.userData.profile.appointment.model = entities[entity];
					break
				default:
					if (Array.isArray(entities[entity])) {
						entities[entity].forEach((ele) => {
							session.userData.profile.appointment[entityDict[entity]].push(ele);		
						});
					}else {
						session.userData.profile.appointment[entityDict[entity]].push(entities[entity]);
					}
			}
		}
	});
}
exports.fillProfile = fillProfile;

const entityCategory = {
	'exact-time': ['date', 'time', 'time-period', 'date-period'],
	'relative-time': ['time-relative', 'date', 'time', 'time-period', 'date-period', 'duration'],
	service: ['service-in-out', 'service-duration', 'service_addon', 'service-cardate', 'service-booking'],
	location: ['atlanta-neighborhood', 'chattanooga-neighborhood']
};

function getEntity (entity_type, response) {
	var result = {};
	var category = entityCategory[entity_type];

	category.forEach( (sub) => {
		if (sub in entityDict) {
			var sub_new = entityDict[sub];
		}
		else {
			var sub_new = sub;
		}
		if (response.constructor == Array) {
			var find = response.find(o => o.hasOwnProperty(sub)) || '';
			if (find) {
				result[sub_new] = find[sub];
			}	
		}
		else {
			if (response.hasOwnProperty(sub)) {
				result[sub_new] = response[sub];
			}
		}
	});
	return result;
}
exports.getEntity = getEntity;

const priceTable = {
	'15min': '40',
	'30min': '80',
	'1 hour': '120',
    '2 hours': '240',
    'overnight': '1000'
}

exports.priceTable = priceTable;

var givenTime_default = {
    complete: 0,
    date: 'today',
    time: null,
    exactTime: {},
    relativeTme: {'time-relative': 'after', time: '03:00:00'}
};

var IntentList_nonOpen = [
	'Intent.AskAge',
	'Intent.AskProof',
	'Intent.Confirmation_No',
	'Intent.confirmation_Yes',
	'Intent.Ensure',
	'Intent.Negotiate_Price',
	'Intent.Offer_Transportation',
	'Intent.Police',
	'Intent.Pregnant',
	'Intent.QuestionAge'
];

exports.IntentList_nonOpen = IntentList_nonOpen;
 
const utl = require('util');
function getSessionInfo(session) {
	try {
		return {
			conversation_id: session.message.address.conversation.id,
			user_id: session.message.address.user.id,
			user_name: session.message.address.user.name,
			bot_id: session.message.address.bot.id,
			received_message: session.message.text,
			stack: getDialogID(session.sessionState.callstack)
		}
	
	}
	catch (err) {
		return utl.inspect(session, false, null);						
	}
}

exports.getSessionInfo = getSessionInfo;

function getErrorInfo(error) {
	return {
		message: error.message,
		errStack: error.stack,
		trace: getTrace(error)
	}
};

exports.getErrorInfo = getErrorInfo;

const stackTrace = require('stack-trace');
function getTrace(err) {
    const trace = err ? stackTrace.parse(err) : stackTrace.get();
    return trace.map(site => {
      return {
        column: site.getColumnNumber(),
        file: site.getFileName(),
        function: site.getFunctionName(),
        line: site.getLineNumber(),
        method: site.getMethodName(),
        native: site.isNative()
      };
    });
}

function getDialogID(callstack) {
	var dialogStack = [];
	callstack.forEach(function(stack) {
		dialogStack.push({id: stack.id});
	})
	return dialogStack;
};

function parseMsg (rows) {
	var msg = rows[0].message;
	msg = decodeURIComponent(msg).replace(/\+/g, " ");
	return msg;
}
exports.parseMsg = parseMsg;

function getMsg(res) {
	var msg = parseMsg(res.rows);
	res.connection.end();
	return msg;
}
exports.getMsg = getMsg;
  
function throwErr(err) {
	if (err.connection) {
		err.connection.end();
		throw err.err;
	}
	else {
		throw err
	}
}
exports.throwErr = throwErr;

var db = require('./../utils_bot/QueryDB_1');
var blacklist = require('./../utils_bot/Blacklist');
var resultLogger = require('./../utils_bot/ResultLog');

function endConversation(session, chat_result, botLogger) {
	var table = {
		'error': {dialog: 'global', index: 0, branch: 0},
		'complete': {dialog: 'global', index:0, branch: 0},
		'complete_n': {dialog: 'global', index:0, branch: 1},
		'complete_noincall': {dialog: 'global', index:0, branch: 2},
		'complete_noprice': {dialog: 'global', index:0, branch: 3},
		'boot': {dialog: 'confirmService:/', index:0, branch: 0}
	};

	var sessionInfo = getSessionInfo(session);
	botLogger.info('End Conversation', sessionInfo);

	db.queryDB(table[chat_result].dialog, table[chat_result].index, table[chat_result].branch)
		.then( res => {
			var reply = eval('`'+ getMsg(res).replace(/`/g,'\\`') + '`');  
			return reply;
		}, err => {
			throwErr(err);
		})
		.then( reply => {
			blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
			return reply;
		})
		.then( reply => {
			resultLogger.insert({user_id: session.message.user.id, user_name: session.message.user.name, result: chat_result});
			return reply;
		})
		.then( reply => {
			session.endConversation(reply);
		})
		.catch( err => {
			blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
			resultLogger.insert({user_id: session.message.user.id, user_name: session.message.user.name, result: 'error'});

			var errInfo = getErrorInfo(err);
			botLogger.error("Exception Caught", Object.assign({}, errInfo, sessionInfo));
		})		
}
exports.endConversation = endConversation;