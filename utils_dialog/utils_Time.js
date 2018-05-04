const availEntity = {
	Availability: ['exact-location', 'service', 'exact-time', 'relative-time', 'entity-name', 'self-reference'],
	Service: ['service', 'price', 'self-reference','entity-name'],
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
	'service-addon': 'addon',
	'service-cardate': 'cardate',
	'service-duration': 'duration',
	'service-in-out': 'inout'
};

const entityCategory = {
	'exact-time': ['date', 'time', 'time-period', 'date-period'],
	'relative-time': ['time-relative', 'date', 'time', 'time-period', 'date-period', 'duration'],
	service: ['service-in-out', 'service-duration', 'service-addon', 'service-cardate', 'service-booking'],
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

function fillTime (apptExactTime, apptRelativeTime) {
	var exactTime = {};
	var relativeTime = {}
	if (apptExactTime) {
		exactTime = getEntity('exact-time', apptExactTime) || exactTime;
	}

	if (apptRelativeTime) {
		relativeTime = getEntity('relative-time', apptRelativeTime) || relativeTime;
	}

	var date = exactTime.date || null;
	if (!date && !(exactTime['date-period'] || relativeTime['date'] || relativeTime['date-period']) 
		&& (exactTime.time || exactTime['time-period'] || relativeTime['time'] || relativeTime['time-period'] || relativeTime['duration'])) {
		date = 'today';
	}

	var time = exactTime.time || null;
	if (time && isNow(time)) {
		time = 'now';
	}

	var complete = (date && time && time != 'now') ? 1 : 0;
	var partial = (!complete && (date || time)) ? 1 : 0;

	var result = {
		complete: complete,
		partial: partial,
		date: date,
		time: time,
		exactTime: exactTime,
		relativeTime: relativeTime
	}
	return result;
}
exports.fillTime = fillTime;

const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];
const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
function parseDate (date_str) {
	var date_parsed = 'today';
	var now = new Date();
	var date = new Date();

	if (date_str == 'today') {
		return date_str;
	}
	else {
		var dateEles = date_str.split('-').map(Number);
		date.setFullYear(dateEles[0], dateEles[1] - 1, dateEles[2]);
		var dateDelta = (date - now)/1000/3600/24;
		console.log(dateDelta);
		if (dateDelta >= 1 && dateDelta < 2) {
			date_parsed = 'tomorrow';
		}
		else if (dateDelta >= 0 && dateDelta < 1) {
			date_parsed = 'today';
		}
		else {
			date_parsed = weekday[date.getDay()];
			if ((dateDelta >= 7 && dateDelta < 14) || dateDelta < 0) {
				date_parsed = 'next ' + date_parsed;
			}
			else {
				date_parsed = 'on ' + month[dateEles[1]-1] + ' ' + dateEles[2];
			}
		}
		return date_parsed;	
	}
}
exports.parseDate = parseDate;

function parseTime (time_str) {
	var timeEles = time_str.split(':').map(Number);
	timeEles = timeEles.slice(0, 2);
	timeEles[0]  = timeEles[0] > 12 ? timeEles[0] - 12 : timeEles[0];
	return timeEles;
}
exports.parseTime = parseTime;

function isNow (time_str) {
	var now = new Date();
	var time = new Date();
	var timeEles = time_str.split(':').map(Number);
	time.setHours(timeEles[0], timeEles[1], timeEles[2]);
	if (time - now < 300000 && time - now > 0) {
		return true;
	}
	else {
		return false;
	}
}
exports.isNow = isNow;

function getDateString (dateObj) {
	var MyDateString;	
	MyDateString = dateObj.getFullYear() + '-'
				 + ('0' + (dateObj.getMonth()+1)).slice(-2) + '-'
				 + ('0' + dateObj.getDate()).slice(-2);
	return MyDateString
}
exports.getDateString = getDateString;

function getTimeString (timeObj) {
	var MyTimeString;	
	MyTimeString = ('0' + timeObj.getHours()).slice(-2) + ':'
				 + ('0' + timeObj.getMinutes()).slice(-2) + ':'
				 + ('0' + timeObj.getSeconds()).slice(-2);
	return MyTimeString
}
exports.getTimeString = getTimeString;

function toIsoString (timeObj) {
    var tzo = -timeObj.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = function(num) {
            var norm = Math.floor(Math.abs(num));
            return (norm < 10 ? '0' : '') + norm;
        };
    return timeObj.getFullYear() +
        '-' + pad(timeObj.getMonth() + 1) +
        '-' + pad(timeObj.getDate()) +
        'T' + pad(timeObj.getHours()) +
        ':' + pad(timeObj.getMinutes()) +
        ':' + pad(timeObj.getSeconds()) +
        dif + pad(tzo / 60) +
        ':' + pad(tzo % 60);
}  
exports.toIsoString = toIsoString;

//@TODO: handle until (probably need to create new intent give_unavailable_timeslot)
function getSuggestTime (givenTime) {
	var exactTime = givenTime.exactTime;
	var relativeTime = givenTime.relativeTime;

	//@TODO: Add handler for duration
	if (!givenTime.date && !givenTime.time) {
		if (Object.keys(exactTime).length === 0 && Object.keys(relativeTime).length === 0) {
			var today = new Date();
			var dateString = getDateString(today);
			return {date: dateString, time: ''};
		}
		else if (relativeTime['date']) {
			var dateEles = relativeTime['date'].split('-').map(Number);
			var suggestDate = new Date();
			suggestDate.setFullYear(dateEles[0], dateEles[1] - 1, dateEles[2]);
			if (relativeTime['time-relative'] == 'before') {
				suggestDate.setDate(suggestDate.getDate() - 1);
				return {date: getDateString(suggestDate), time: ''};
			}
			else if (relativeTime['time-relative'] == 'after') {
				suggestDate.setDate(suggestDate.getDate() + 1);
				return {date: getDateString(suggestDate), time: ''};
			}
		}
		else if (relativeTime['date-period']) {
			var [date_start, date_end] = relativeTime['date-period'].split('/');				
			var dateEles_start = date_start.split('-').map(Number);
			var dateEles_end = date_end.split('-').map(Number);
			var suggestDate = new Date();
			if (relativeTime['time-relative'] == 'before') {
				suggestDate.setFullYear(dateEles_start[0], dateEles_start[1] - 1, dateEles_start[2]);
				suggestDate.setDate(suggestDate.getDate() - 1);
				return {date: getDateString(suggestDate), time: ''};
			}
			else if (relativeTime['time-relative'] == 'after') {
				suggestDate.setFullYear(dateEles_end[0], dateEles_end[1] - 1, dateEles_end[2]);
				suggestDate.setDate(suggestDate.getDate() + 1);
				return {date: getDateString(suggestDate), time: ''};
			}	
		}	
		else if (exactTime['date-period']) {
			var [date_start, date_end] = exactTime['date-period'].split('/');
			return {date: date_start, time: ''}
		}		
	}
	else if (givenTime.time == 'now') {
		var suggestTime = new Date();
		
		suggestTime.setMinutes(suggestTime.getMinutes()+90, 0);
		
		var suggestTime30 = new Date(suggestTime.getTime());
		var suggestTime00 = new Date(suggestTime.getTime());
		suggestTime30.setMinutes(30);
		if (suggestTime.getMinutes() > 30) {
			suggestTime00.setHours(suggestTime00.getHours() + 1, 0, 0);
			suggestTime = suggestTime00 - suggestTime > suggestTime - suggestTime30 ? suggestTime30 : suggestTime00;
		}
		else {
			suggestTime00.setHours(suggestTime00.getHours() - 1, 0, 0);
			suggestTime = suggestTime - suggestTime00 > suggestTime30 - suggestTime ? suggestTime30 : suggestTime00;
		}
		return {date: getDateString(suggestTime), time: getTimeString(suggestTime)};
	}
	else if (!givenTime.time) {
		if (relativeTime['time']) {
			var timeEles = relativeTime['time'].split(':').map(Number);
			var suggestTime = new Date();
			var suggestDate = givenTime.date == 'today' ? getDateString(suggestTime) : givenTime.date;
			
			suggestTime.setHours(timeEles[0], timeEles[1], 0);
			
			if (relativeTime['time-relative'] == 'before') {
				suggestTime.setHours(suggestTime.getHours() - 1);
				return {date: suggestDate, time: getTimeString(suggestTime)};
			}
			else if (relativeTime['time-relative'] == 'after') {
				suggestTime.setHours(suggestTime.getHours() + 1);
				return {date: suggestDate, time: getTimeString(suggestTime)};
			}			
		}
		else if (relativeTime['time-period']) {
			var [timeStart, timeEnd] = relativeTime['time-period'].split('/');
			var timeEles_start = timeStart.split(':').map(Number);
			var timeEles_end = timeEnd.split(':').map(Number);
			var suggestDate = givenTime.date == 'today' ? getDateString(suggestTime) : givenTime.date;
			
			
			var suggestTime_start = new Date();
			suggestTime_start.setHours(timeEles_start[0], timeEles_start[1], 0);
			var suggestTime_end = new Date();
			suggestTime_end.setHours(timeEles_end[0], timeEles_end[1], 0);			

			if (relativeTime['time-relative'] == 'before') {
				var suggestTime = new Date(suggestTime_start.getTime());
				suggestTime.setHours(suggestTime.getHours() - 1, 0);
				return {date: suggestDate, time: getTimeString(suggestTime)};
			}
			else if (relativeTime['time-relative'] == 'after') {
				var suggestTime = new Date(suggestTime_end.getTime());
				suggestTime.setHours(suggestTime.getHours() + 1, 0);
				return {date: suggestDate, time: getTimeString(suggestTime)};
			}				
		}
		else if (exactTime['time-period']) {
			var [timeStart, timeEnd] = exactTime['time-period'].split('/');
			var timeEles_start = timeStart.split(':').map(Number);
			var timeEles_end = timeEnd.split(':').map(Number);
			
			var suggestTime_start = new Date();
			suggestTime_start.setHours(timeEles_start[0], timeEles_start[1], 0);
			var suggestTime_end = new Date();
			suggestTime_end.setHours(timeEles_end[0], timeEles_end[1], 0);

			var suggestTime = new Date((suggestTime_start.getTime() + suggestTime_end.getTime()) / 2);
			var suggestDate = givenTime.date == 'today' ? getDateString(suggestTime) : givenTime.date;
			return {date: suggestDate, time: getTimeString(suggestTime)};
		}
	}
	else {
		return {date: '', time: ''};
	}
	
}
exports.getSuggestTime = getSuggestTime;