const mysql = require('mysql');

class Database {
  constructor ( config ) {
    this.connection = mysql.createConnection( config );
  }
  query( sql, args) {
    return new Promise( ( resolve, reject) => {
      this.connection.query( sql, args, ( err, rows ) => {
        if ( err ) {
          return reject (err);
        }
        resolve ( rows );
      });
    });
  }
  close () {
    return new Promise ( ( resolve, reject ) => {
      this.connection.end( err => {
        if ( err ) {
          return reject (err);
        }
        resolve ();        
      });
    });
  }
}

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
        return reject (err);
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

// queryDB('global', 0, 0)
//   .then(function (res) {
//     console.log(parseMsg(res.rows)); 
//     return res.connection;
//     res.connection.end();
//   })
  
moduls.exports = {
  queryDB: queryDB
};
  // queryDB('global', 0, 0)
  // .then(function (res) {
  //   console.log(parseMsg(res.rows)); 
  //   return res.connection;
  // })
  // .then(connection => closeDB(connection));

  // .then(rows => con);


// var param = {
//   table: 'dialog',
//   column: 'message',
//   dialog: 'global',
//   index: 0,
//   branch: 0
// };

//   var query =  `select ${param.column} from ${param.table}
//     where dialog = "${param.dialog}" \
//     and \`index\` = "${param.index}" \
//     and branch = "${param.branch}" \
//     order by rand() limit 1;`;

// var database = new Database(config);

// database.query(query)
//   .then(row => console.log(row))
//   .then(row => database.close());

