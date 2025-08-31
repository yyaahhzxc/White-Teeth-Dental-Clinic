const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 Final verification of admin role conversion...');

const DB_PATH = path.join(__dirname, 'clinic.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database for verification');
});

function verifyRoles() {
  console.log('\n=== FINAL ROLE STATUS ===');
  
  // Check all users
  db.all('SELECT id, username, role, userRole, employeeRole, status FROM users ORDER BY id', [], (err, rows) => {
    if (err) {
      console.error('❌ Error reading users:', err);
      return;
    }
    
    console.log('\nAll users:');
    console.log('ID | Username | Role         | UserRole     | EmployeeRole     | Status');
    console.log('---|----------|--------------|--------------|------------------|--------');
    
    let adminCount = 0;
    let userCount = 0;
    let inconsistencies = 0;
    
    rows.forEach(row => {
      const roleStr = (row.role || '').padEnd(12);
      const userRoleStr = (row.userRole || '').padEnd(12);
      const employeeRoleStr = (row.employeeRole || '').padEnd(16);
      
      console.log(`${row.id.toString().padEnd(2)} | ${row.username.padEnd(8)} | ${roleStr} | ${userRoleStr} | ${employeeRoleStr} | ${row.status}`);
      
      // Count admin vs user
      if (row.role === 'Administrator') adminCount++;
      else if (row.role === 'User') userCount++;
      
      // Check for inconsistencies
      if (row.role !== row.userRole) {
        console.log(`⚠️  INCONSISTENCY: ${row.username} has role='${row.role}' but userRole='${row.userRole}'`);
        inconsistencies++;
      }
      
      // Check for old admin values
      if (row.role && (row.role.toLowerCase() === 'admin' || row.role === 'admin')) {
        console.log(`❌ FOUND OLD ADMIN: ${row.username} still has role='${row.role}'`);
      }
      if (row.userRole && (row.userRole.toLowerCase() === 'admin' || row.userRole === 'admin')) {
        console.log(`❌ FOUND OLD ADMIN: ${row.username} still has userRole='${row.userRole}'`);
      }
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`📊 Total users: ${rows.length}`);
    console.log(`👑 Administrators: ${adminCount}`);
    console.log(`👤 Users: ${userCount}`);
    console.log(`⚠️  Inconsistencies: ${inconsistencies}`);
    
    // Check distinct roles
    db.all('SELECT DISTINCT role FROM users WHERE role IS NOT NULL ORDER BY role', [], (err, roleRows) => {
      if (err) return console.error('Error getting roles:', err);
      
      db.all('SELECT DISTINCT userRole FROM users WHERE userRole IS NOT NULL ORDER BY userRole', [], (err, userRoleRows) => {
        if (err) return console.error('Error getting userRoles:', err);
        
        console.log(`🔹 Distinct roles: [${roleRows.map(r => `'${r.role}'`).join(', ')}]`);
        console.log(`🔹 Distinct userRoles: [${userRoleRows.map(r => `'${r.userRole}'`).join(', ')}]`);
        
        // Final validation
        const hasOldAdmin = roleRows.some(r => r.role.toLowerCase() === 'admin') || 
                           userRoleRows.some(r => r.userRole.toLowerCase() === 'admin');
        
        if (hasOldAdmin) {
          console.log('❌ MIGRATION INCOMPLETE: Old "admin" roles still exist!');
        } else {
          console.log('✅ MIGRATION SUCCESSFUL: All admin users converted to Administrator!');
        }
        
        if (inconsistencies === 0) {
          console.log('✅ CONSISTENCY CHECK: All role fields are synchronized!');
        } else {
          console.log('❌ CONSISTENCY ISSUE: Some role fields are not synchronized!');
        }
        
        console.log('\n🎉 Verification completed!');
        db.close();
      });
    });
  });
}

verifyRoles();
