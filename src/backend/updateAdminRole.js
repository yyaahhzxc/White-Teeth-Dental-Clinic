const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const DBPATH = path.resolve(__dirname, 'clinic.db');
console.log('Using DB for updateAdminRole:', DBPATH);
const db = new sqlite3.Database(DBPATH);

db.serialize(() => {
  db.run("UPDATE users SET role='admin' WHERE username='admin'", function (err) {
    if (err) {
      console.error('Update error:', err.message);
    } else {
      console.log('OK - updated rows:', this.changes);
    }

    db.all('SELECT id, username, role FROM users', [], (e, rows) => {
      if (e) {
        console.error('Select error:', e.message);
      } else {
        console.log('Current users:');
        console.log(JSON.stringify(rows, null, 2));
      }
      db.close();
    });
  });
});
