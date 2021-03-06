const mysql = require('mysql');
var botLog = require('./BotLogger');
var botLogger = botLog.botLog;
var connConfig = require('./../config').config;

var config = connConfig.responseConn;

function queryDB(bot_id) {
  var connection = mysql.createConnection(config);
  var query =  `select * from gracie_profile
    where phone = "${bot_id}"`;
  return new Promise ( (resolve, reject) => {
    connection.query(query, (err, rows) => {
      if (err) {
        return reject ({connection: connection, err:err});
      }
      // console.log('%j', rows[0]);
      resolve ({connection: connection, rows: rows});
    })
  });
}

function getProfile(bot_id) {
    return queryDB(bot_id)
        .then( res => {
            var row = res.rows[0];
            var profile = {
              model: row.model_name,
              city: row.model_city,
              neighborhood: row.model_location,
              age: row.model_age,
              gender: row.model_gender
            };
            res.connection.end();
            return profile
        }, err => {
            if (err.connection) {
                err.connection.end();
                throw err.err;
            }
            else {
                throw err
            }
        })
}

module.exports = {
  getProfile: getProfile,
};

