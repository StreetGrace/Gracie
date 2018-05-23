var mysql = require('mysql');

function queryRes(dialog, index, branch, cb) {
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


// queryRes(con, 'opener:/availability', 0, 0, function (err, result) {
//   if (err) {
//     console.log(err);
//     console.log('error pulling data');
//   }
//   else {
//     var jonName = 'Lyra';
//     var text = result.message;
//     text = decodeURIComponent(text).replace(/\+/g, " ");
//     text = eval('`'+ text.replace(/`/g,'\\`') + '`');
//     console.log(text);
//   }
// });



