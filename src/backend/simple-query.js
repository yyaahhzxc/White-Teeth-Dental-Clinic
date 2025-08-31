const sqlite3 = require('sqlite3');

console.log('Starting database query...');

const db = new sqlite3.Database('./clinic.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Database opened successfully');
});

// Simple query for employee roles
db.all("SELECT DISTINCT employeeRole FROM Employee", [], (err, rows) => {
    if (err) {
        console.error('Query error:', err.message);
    } else {
        console.log('\n=== EMPLOYEE ROLES ===');
        console.log('Found', rows.length, 'distinct roles:');
        rows.forEach(row => {
            console.log('-', row.employeeRole);
        });
    }
    
    // Close database
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('\nDatabase closed successfully');
        }
    });
});
