const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking users table structure...\n');

// Check the structure of the users table
db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
        console.error('Error checking table structure:', err);
        db.close();
        return;
    }

    console.log('=== USERS TABLE STRUCTURE ===');
    columns.forEach(col => {
        console.log(`- ${col.name} (${col.type})`);
    });
    console.log('');

    // Show some sample data
    db.all("SELECT * FROM users LIMIT 3", (err, rows) => {
        if (err) {
            console.error('Error querying users:', err);
        } else {
            console.log('=== SAMPLE USER DATA ===');
            rows.forEach(row => {
                console.log(JSON.stringify(row, null, 2));
            });
        }
        
        db.close();
    });
});
