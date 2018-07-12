const mysql = require('mysql');

var config = {
  host: "loreleierd.ciargp61tp0d.us-east-1.rds.amazonaws.com",
  user: "lorelei_master",
  password: "Gracie2018",
  database: "lorelei_erd"
};

function queryDB(dialog, index, branch) {
  var connection = mysql.createConnection(config);
  var param = {
    table: 'dialog',
    column: 'message',
    dialog: dialog,
    index: index,
    branch: branch
  };

  var query =  `select ${param.column} from ${param.table}
    where dialog = "${param.dialog}" \
    and \`index\` = "${param.index}" \
    and branch = "${param.branch}" \
    order by rand() limit 1;`;

  
  return new Promise ( (resolve, reject) => {
    connection.query(query, (err, rows) => {
      if (err) {
        return reject ({connection: connection, err:err});
      }
      resolve ({connection: connection, rows: rows});
    })
  });
}

function closeDB(connection) {
  return new Promise ( ( resolve, reject ) => {
    connection.end( err => {
      if ( err ) {
        return reject (err);
      }
      resolve ();        
    });
  });
}

module.exports = {
  queryDB: queryDB,
  closeDB: closeDB,
};
 