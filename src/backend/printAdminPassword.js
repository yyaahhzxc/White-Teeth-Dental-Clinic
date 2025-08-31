const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('clinic.db');
db.get("SELECT id, username, password, role FROM users WHERE username='admin'", [], (e, r) => {
  if (e) console.error('ERR', e.message);
  else console.log(r);
  db.close();
});
