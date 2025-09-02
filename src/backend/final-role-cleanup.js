const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath);

console.log('🧹 Final cleanup: Ensuring only Dentist, Assistant Dentist, and Receptionist roles exist\n');

async function finalCleanup() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Check current roles
            db.all("SELECT DISTINCT employeeRole FROM users WHERE employeeRole IS NOT NULL AND employeeRole != '' ORDER BY employeeRole", (err, rows) => {
                if (err) {
                    console.error('Error querying current roles:', err);
                    reject(err);
                    return;
                }

                console.log('=== CURRENT EMPLOYEE ROLES ===');
                rows.forEach(row => console.log(`- "${row.employeeRole}"`));
                console.log('');

                // Clean up any roles that aren't in our target list
                const targetRoles = ['Dentist', 'Assistant Dentist', 'Receptionist'];
                const rolesToClean = rows.map(r => r.employeeRole).filter(role => !targetRoles.includes(role));

                console.log('Target roles:', targetRoles);
                console.log('Roles to clean up:', rolesToClean);
                console.log('');

                if (rolesToClean.length > 0) {
                    console.log('=== CLEANING UP INVALID ROLES ===');
                    
                    // Convert any non-standard roles to appropriate ones
                    const cleanupPromises = [];
                    
                    rolesToClean.forEach(invalidRole => {
                        let targetRole = 'Dentist'; // Default fallback
                        
                        // Map invalid roles to valid ones
                        if (invalidRole.toLowerCase().includes('assistant') || invalidRole.toLowerCase().includes('hygienist')) {
                            targetRole = 'Assistant Dentist';
                        } else if (invalidRole.toLowerCase().includes('reception') || invalidRole.toLowerCase().includes('front')) {
                            targetRole = 'Receptionist';
                        } else if (invalidRole.toLowerCase().includes('admin') || invalidRole.toLowerCase().includes('dentist')) {
                            targetRole = 'Dentist';
                        }

                        cleanupPromises.push(new Promise((resolveCleanup, rejectCleanup) => {
                            console.log(`Converting "${invalidRole}" to "${targetRole}"`);
                            db.run(
                                "UPDATE users SET employeeRole = ? WHERE employeeRole = ?",
                                [targetRole, invalidRole],
                                function(err) {
                                    if (err) {
                                        console.error(`Error cleaning up ${invalidRole}:`, err);
                                        rejectCleanup(err);
                                    } else {
                                        console.log(`✅ Converted ${this.changes} user(s) from "${invalidRole}" to "${targetRole}"`);
                                        resolveCleanup();
                                    }
                                }
                            );
                        }));
                    });

                    Promise.all(cleanupPromises)
                        .then(() => {
                            console.log('\n=== VERIFICATION ===');
                            verifyFinalRoles(resolve, reject);
                        })
                        .catch(reject);
                } else {
                    console.log('✅ All roles are already standardized!');
                    verifyFinalRoles(resolve, reject);
                }
            });
        });
    });
}

function verifyFinalRoles(resolve, reject) {
    db.all("SELECT DISTINCT employeeRole FROM users WHERE employeeRole IS NOT NULL AND employeeRole != '' ORDER BY employeeRole", (err, rows) => {
        if (err) {
            console.error('Error verifying final roles:', err);
            reject(err);
            return;
        }

        console.log('✅ Final employee roles:');
        rows.forEach(row => console.log(`- "${row.employeeRole}"`));
        console.log(`Total: ${rows.length} distinct roles`);

        // Show all users
        db.all("SELECT id, username, employeeRole, userRole FROM users ORDER BY id", (err, users) => {
            if (err) {
                console.error('Error querying final users:', err);
                reject(err);
                return;
            }

            console.log('\n=== ALL USERS WITH STANDARDIZED ROLES ===');
            users.forEach(user => {
                console.log(`ID: ${user.id}, Username: ${user.username}, Employee Role: "${user.employeeRole}", User Role: "${user.userRole}"`);
            });

            console.log('\n🎉 Role standardization completed successfully!');
            console.log('📋 Available employee roles: Dentist, Assistant Dentist, Receptionist');
            resolve();
        });
    });
}

// Run the cleanup
finalCleanup()
    .then(() => {
        console.log('Closing database connection...');
        db.close();
    })
    .catch((error) => {
        console.error('Cleanup failed:', error);
        db.close();
        process.exit(1);
    });
