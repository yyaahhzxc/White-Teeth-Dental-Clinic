const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking current database state...\n');

db.all("SELECT DISTINCT employeeRole FROM users WHERE employeeRole IS NOT NULL AND employeeRole != '' ORDER BY employeeRole", (err, rows) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log('=== CURRENT EMPLOYEE ROLES IN DATABASE ===');
    if (rows.length === 0) {
        console.log('No employee roles found');
    } else {
        rows.forEach(row => console.log(`- "${row.employeeRole}"`));
    }
    console.log(`Total: ${rows.length} distinct roles\n`);

    db.all("SELECT id, username, employeeRole, userRole FROM users ORDER BY id", (err, users) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('=== ALL USERS ===');
            users.forEach(user => {
                console.log(`ID: ${user.id}, Username: ${user.username}, Employee Role: "${user.employeeRole}", User Role: "${user.userRole}"`);
            });
        }
        
        db.close();
    });
});
