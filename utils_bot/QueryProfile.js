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
    queryDB(bot_id)
        .then( res=> {
            console.log(res.rows);
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

getProfile('default_user');
module.exports = {
  getPrfile: getProfile,
};