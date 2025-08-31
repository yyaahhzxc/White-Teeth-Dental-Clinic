const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking database structure...\n');

// Check what tables exist
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('Error querying tables:', err);
        db.close();
        return;
    }

    console.log('=== AVAILABLE TABLES ===');
    tables.forEach(table => console.log(`- ${table.name}`));
    console.log(`Total: ${tables.length} tables\n`);

    // For each table, check its structure
    tables.forEach(table => {
        console.log(`=== STRUCTURE OF ${table.name} ===`);
        db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
            if (err) {
                console.error(`Error checking ${table.name}:`, err);
            } else {
                columns.forEach(col => {
                    console.log(`  ${col.name} (${col.type})`);
                });
                console.log('');

                // If it's a users-related table, show some sample data
                if (table.name.toLowerCase().includes('user') || table.name.toLowerCase().includes('employee')) {
                    db.all(`SELECT * FROM ${table.name} LIMIT 5`, (err, rows) => {
                        if (err) {
                            console.error(`Error querying ${table.name}:`, err);
                        } else {
                            console.log(`=== SAMPLE DATA FROM ${table.name} ===`);
                            if (rows.length === 0) {
                                console.log('No data found');
                            } else {
                                rows.forEach(row => {
                                    console.log(JSON.stringify(row, null, 2));
                                });
                            }
                            console.log('');
                        }
                    });
                }
            }
        });
    });

    // Close after a delay to allow all queries to complete
    setTimeout(() => {
        db.close();
    }, 2000);
});
