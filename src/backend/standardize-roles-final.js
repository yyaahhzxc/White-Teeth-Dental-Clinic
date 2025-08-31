const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Standardizing employee roles to: Dentist, Assistant Dentist, Receptionist\n');

// Define the role mappings
const roleMapping = {
    'Dental Assistant': 'Assistant Dentist',  // Convert Dental Assistant to Assistant Dentist
    'Dentist': 'Dentist',                     // Keep Dentists as is  
    'Receptionist': 'Receptionist'            // Keep Receptionists as is
};

async function standardizeRoles() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // First, let's see what we currently have
            console.log('=== CURRENT EMPLOYEE ROLES ===');
            db.all("SELECT DISTINCT employeeRole FROM users WHERE employeeRole IS NOT NULL AND employeeRole != '' ORDER BY employeeRole", (err, rows) => {
                if (err) {
                    console.error('Error querying current roles:', err);
                    reject(err);
                    return;
                }

                console.log('Current distinct employee roles:');
                rows.forEach(row => console.log(`- "${row.employeeRole}"`));
                console.log(`Total: ${rows.length} distinct roles\n`);

                // Show current users with their roles
                db.all("SELECT id, username, employeeRole, userRole FROM users ORDER BY id", (err, users) => {
                    if (err) {
                        console.error('Error querying users:', err);
                        reject(err);
                        return;
                    }

                    console.log('=== CURRENT USERS ===');
                    users.forEach(user => {
                        console.log(`ID: ${user.id}, Username: ${user.username}, Employee Role: "${user.employeeRole}", User Role: "${user.userRole}"`);
                    });
                    console.log(`Total: ${users.length} users\n`);

                    // Now perform the migration
                    console.log('=== ROLE MIGRATION ===');
                    
                    // Update each role according to the mapping
                    let updatePromises = [];
                    
                    for (const [oldRole, newRole] of Object.entries(roleMapping)) {
                        updatePromises.push(new Promise((resolveUpdate, rejectUpdate) => {
                            db.run(
                                "UPDATE users SET employeeRole = ? WHERE employeeRole = ?",
                                [newRole, oldRole],
                                function(err) {
                                    if (err) {
                                        console.error(`Error updating ${oldRole} to ${newRole}:`, err);
                                        rejectUpdate(err);
                                    } else {
                                        if (this.changes > 0) {
                                            console.log(`✅ Updated ${this.changes} user(s) from "${oldRole}" to "${newRole}"`);
                                        }
                                        resolveUpdate();
                                    }
                                }
                            );
                        }));
                    }

                    Promise.all(updatePromises)
                        .then(() => {
                            console.log('\n=== MIGRATION COMPLETED ===');
                            
                            // Verify the results
                            db.all("SELECT DISTINCT employeeRole FROM users WHERE employeeRole IS NOT NULL AND employeeRole != '' ORDER BY employeeRole", (err, rows) => {
                                if (err) {
                                    console.error('Error verifying results:', err);
                                    reject(err);
                                    return;
                                }

                                console.log('✅ Final employee roles:');
                                rows.forEach(row => console.log(`- "${row.employeeRole}"`));
                                console.log(`Total: ${rows.length} distinct roles\n`);

                                // Show updated users
                                db.all("SELECT id, username, employeeRole, userRole FROM users ORDER BY id", (err, users) => {
                                    if (err) {
                                        console.error('Error querying final users:', err);
                                        reject(err);
                                        return;
                                    }

                                    console.log('=== UPDATED USERS ===');
                                    users.forEach(user => {
                                        console.log(`ID: ${user.id}, Username: ${user.username}, Employee Role: "${user.employeeRole}", User Role: "${user.userRole}"`);
                                    });

                                    console.log('\n🎉 Employee role standardization completed successfully!');
                                    resolve();
                                });
                            });
                        })
                        .catch(reject);
                });
            });
        });
    });
}

// Run the migration
standardizeRoles()
    .then(() => {
        console.log('Closing database connection...');
        db.close();
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        db.close();
        process.exit(1);
    });
