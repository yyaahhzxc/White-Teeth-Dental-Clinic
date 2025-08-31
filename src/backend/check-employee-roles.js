const sqlite3 = require('sqlite3').verbose();

console.log('🔍 Analyzing employee roles in database...\n');

const db = new sqlite3.Database('./clinic.db', (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }
});

// Get distinct employee roles
db.all('SELECT DISTINCT employeeRole FROM users WHERE employeeRole IS NOT NULL AND employeeRole != "" ORDER BY employeeRole', [], (err, roleRows) => {
  if (err) {
    console.error('❌ Error getting employee roles:', err);
    return;
  }
  
  console.log('📋 Current Employee Roles in Database:');
  console.log('=====================================');
  
  if (roleRows.length === 0) {
    console.log('   (No employee roles found)');
  } else {
    roleRows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.employeeRole}`);
    });
  }
  
  console.log(`\n📊 Total: ${roleRows.length} distinct employee roles\n`);
  
  // Get users with their roles for context
  db.all('SELECT username, firstName, lastName, employeeRole FROM users ORDER BY employeeRole, username', [], (err, userRows) => {
    if (err) {
      console.error('❌ Error getting users:', err);
      return;
    }
    
    console.log('👥 Users and Their Employee Roles:');
    console.log('==================================');
    
    userRows.forEach(user => {
      const fullName = `${user.firstName} ${user.lastName}`.trim();
      console.log(`   ${user.username.padEnd(8)} | ${fullName.padEnd(15)} | ${user.employeeRole || '(not set)'}`);
    });
    
    console.log('\n✅ Analysis complete!');
    db.close();
  });
});
