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
	location: ['atlanta-neighborhood']
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
	'15min': '65',
	'30min': '100',
	'1 hour': '150',
    '2 hours': '300',
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

function getSessionInfo(session) {
	return {
		conversation_id: session.message.address.conversation.id,
		user_id: session.message.address.user.id,
		user_name: session.message.address.user.name,
		received_message: session.message.text,
		stack: getDialogID(session.sessionState.callstack)
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

resDB.queryRes('confirmService:/', 0, 0, function (err, result){})
queryRes(dialog, index, branch, cb)

function endConversation(session, indicator) {
	var table = {
		'error': {dialog: 'global', index: 0, branch: 0},
		'complete': {dialog: 'global', index:0, branch: 0},
		'boot': {dialog: 'confirmService:/', index:0, branch: 0}
	};

	resDB.queryRes(table[indicator].dialog, table[indicator].index, table[indicator].branch, function (err, result) {
		if (err) {
		  console.log(err);
		  console.log('error pulling data');
		}
		else {
		  var reply = result.message;
		  reply = decodeURIComponent(reply).replace(/\+/g, " ");
		  reply = eval('`'+ reply.replace(/`/g,'\\`') + '`');

		  blacklist.insert({user_id: session.message.user.id, user_name: session.message.user.name});
		  session.endConversation(reply);
		}
	  }
  );
}
