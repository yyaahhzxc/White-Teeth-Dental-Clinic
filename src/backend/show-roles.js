// Simple script to show employee roles from database
console.log('Checking employee roles...');

// Try different database connection approaches
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Try absolute path first
const dbPath = path.join(__dirname, 'clinic.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('\n=== EMPLOYEE ROLES ===');
  
  db.all("SELECT DISTINCT employeeRole FROM users WHERE employeeRole IS NOT NULL AND employeeRole != '' ORDER BY employeeRole", (err, rows) => {
    if (err) {
      console.error('Error getting employee roles:', err);
    } else {
      console.log('Available employee roles:');
      rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.employeeRole}`);
      });
      console.log(`Total: ${rows.length} roles`);
    }
    
    console.log('\n=== USER ROLES ===');
    db.all("SELECT DISTINCT userRole FROM users WHERE userRole IS NOT NULL AND userRole != '' ORDER BY userRole", (err, rows) => {
      if (err) {
        console.error('Error getting user roles:', err);
      } else {
        console.log('Available user roles:');
        rows.forEach((row, i) => {
          console.log(`${i + 1}. ${row.userRole}`);
        });
        console.log(`Total: ${rows.length} roles`);
      }
      
      console.log('\n=== ALL USERS ===');
      db.all("SELECT username, employeeRole, userRole FROM users ORDER BY username", (err, rows) => {
        if (err) {
          console.error('Error getting users:', err);
        } else {
          console.log('Users and their roles:');
          rows.forEach(row => {
            console.log(`${row.username}: ${row.employeeRole} / ${row.userRole}`);
          });
        }
        
        db.close();
        console.log('\nDone!');
      });
    });
  });
});
