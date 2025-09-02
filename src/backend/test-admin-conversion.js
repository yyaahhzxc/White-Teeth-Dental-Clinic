// Simple test to verify admin role conversion
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dbPath = './clinic.db';
if (!fs.existsSync(dbPath)) {
  console.log('❌ Database file not found');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('🔍 Checking admin role conversion...\n');
  
  db.all("SELECT username, role, userRole FROM users", (err, rows) => {
    if (err) {
      console.error('❌ Error:', err);
      return;
    }
    
    console.log('Users in database:');
    let adminCount = 0;
    let oldAdminFound = false;
    
    rows.forEach(row => {
      console.log(`- ${row.username}: role="${row.role}", userRole="${row.userRole}"`);
      
      if (row.role === 'Administrator' || row.userRole === 'Administrator') {
        adminCount++;
      }
      
      if (row.role === 'admin' || row.userRole === 'admin') {
        oldAdminFound = true;
        console.log(`  ⚠️  Old admin format found!`);
      }
    });
    
    console.log(`\nSummary:`);
    console.log(`- Total users: ${rows.length}`);
    console.log(`- Administrator users: ${adminCount}`);
    console.log(`- Old admin format found: ${oldAdminFound ? 'YES ❌' : 'NO ✅'}`);
    
    if (!oldAdminFound) {
      console.log('\n✅ SUCCESS: All admin users have been converted to Administrator!');
    } else {
      console.log('\n❌ FAILED: Some old admin formats still exist!');
    }
    
    db.close();
  });
});
