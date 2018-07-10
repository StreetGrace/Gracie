const mysql = require('mysql');

var config = {
  host: "loreleierd.ciargp61tp0d.us-east-1.rds.amazonaws.com",
  user: "lorelei_master",
  password: "Gracie2018",
  database: "lorelei_erd"
};

function queryDB(bot_id) {
  var connection = mysql.createConnection(config);
  var query =  `select * from gracie_profile
    where phone = "${bot_id}"`;
    
  return new Promise ( (resolve, reject) => {
    connection.query(query, (err, rows) => {
      if (err) {
        return reject ({connection: connection, err:err});
      }
      resolve ({connection: connection, rows: rows});
    })
  });
}

function getProfile(bot_id) {
    return queryDB(bot_id)
        .then( res=> {
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

getProfile('default-user');
module.exports = {
  getProfile: getProfile,
};