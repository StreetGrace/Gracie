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

// function getSessionInfo(session) {
// 	var meta = session.message;
// 	return {
// 		meta.
// 	}
// }