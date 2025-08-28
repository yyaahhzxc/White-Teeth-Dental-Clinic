const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('clinic.db');

console.log('Updating admin password to "admin"...');

db.run("UPDATE users SET password = ? WHERE username = ?", ['admin', 'admin'], function(err) {
  if (err) {
    console.error('Error updating password:', err.message);
  } else {
    console.log('Password updated successfully. Rows affected:', this.changes);
    
    // Verify the update
    db.get("SELECT username, password FROM users WHERE username = ?", ['admin'], (err, row) => {
      if (err) {
        console.error('Error checking update:', err.message);
      } else {
        console.log('Verification - Admin password is now:', row.password);
      }
      db.close();
    });
  }
});
