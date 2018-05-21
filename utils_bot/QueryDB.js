var mysql = require('mysql');

var con = mysql.createConnection({
    host: "loreleierd.ciargp61tp0d.us-east-1.rds.amazonaws.com",
    user: "lorelei_master",
    password: "Gracie2018",
    database: "gracie_response"
  });

con.connect();

function queryRes(con, param, cb) {
  con.query(
    `select ${param.column} from ${param.table} `,
      // where library = ${param.library} \
      // and dialog = ${param.dialog} \
      // and "index" = ${param.index} \
      // and branch = ${param.branch};`, 
      function (err, result) {
        if (err) {
          cb (err, null);
          con.end();
        }
        else {
          cb (null, result[0]);
          con.end();
        }
  })
}

module.exports = {
  queryRes: queryRes,
};

var param = {
  column: 'response',
  table: 'response_test',
  library: 'global',
  dialog: 'global',
  index: 0,
  branch: 0
};

queryRes(con, param, function (err, result) {
  if (err) {
    console.log(err);
    console.log('error pulling data');
  }
  else {
    var name = 'Lyra';
    var text = result.response;
    var text = eval('`'+ text.replace(/`/g,'\\`') + '`');
    console.log(text);
  }
});



