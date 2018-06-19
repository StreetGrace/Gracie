var mysql = require('mysql');

function queryRes(dialog, index, branch) {
  return new Promise(function(resolve, reject) {
    var param = {
      table: 'dialog',
      column: 'message',
      dialog: dialog,
      index: index,
      branch: branch
    };
  
    var con = mysql.createConnection({
      host: "loreleierd.ciargp61tp0d.us-east-1.rds.amazonaws.com",
      user: "lorelei_master",
      password: "Gracie2018",
      database: "lorelei_erd"
    });
  
    con.connect();
    con.query(
      `select ${param.column} from ${param.table}
        where dialog = "${param.dialog}" \
        and \`index\` = "${param.index}" \
        and branch = "${param.branch}" \
        order by rand() limit 1;`, 
        function (err, result) {
          if (err) {
            reject (err); 
          }
          else {
            resolve (result[0]);
          }
    })
    .then(function () {
      if (conn) {
        return conn.close();
      }
    })
    .catch(function (err) {
      console.log('Error closing connection', e)
    })
  })
}

module.exports = {
  queryRes: queryRes,
};



