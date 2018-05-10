var x1 = {
	b: 2,
	a: 2,

}

var x2 = {
	a: 2,
	b: 2
}

var _ = require('underscore');
r = _.isEqual(x1, x2);

console.log(r);