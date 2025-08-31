const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔄 Starting comprehensive admin role migration...');

const DB_PATH = path.join(__dirname, 'clinic.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database for migration');
});

function runMigration() {
  console.log('\n=== BEFORE MIGRATION ===');
  
  // Check current state
  db.all('SELECT id, username, role, userRole, employeeRole FROM users', [], (err, rows) => {
    if (err) {
      console.error('❌ Error reading users:', err);
      return;
    }
    
    console.log('Current users:');
    rows.forEach(row => {
      console.log(`  ${row.id}: ${row.username} | role='${row.role}' | userRole='${row.userRole}' | employeeRole='${row.employeeRole}'`);
    });
    
    // Run comprehensive migration
    performMigration(rows);
  });
}

function performMigration(users) {
  console.log('\n=== PERFORMING MIGRATION ===');
  
  const migrations = [
    {
      name: 'Update role "admin" to "Administrator"',
      sql: 'UPDATE users SET role = "Administrator" WHERE role = "admin" OR role = "Admin"',
    },
    {
      name: 'Update userRole "admin" to "Administrator"',
      sql: 'UPDATE users SET userRole = "Administrator" WHERE userRole = "admin" OR userRole = "Admin"',
    },
    {
      name: 'Update role "user" to "User"',
      sql: 'UPDATE users SET role = "User" WHERE role = "user"',
    },
    {
      name: 'Update userRole "user" to "User"',
      sql: 'UPDATE users SET userRole = "User" WHERE userRole = "user"',
    },
    {
      name: 'Sync role field to match userRole for Administrators',
      sql: 'UPDATE users SET role = "Administrator" WHERE userRole = "Administrator" AND role != "Administrator"',
    },
    {
      name: 'Sync role field to match userRole for Users',
      sql: 'UPDATE users SET role = "User" WHERE userRole = "User" AND role != "User"',
    },
    {
      name: 'Sync userRole field to match role for Administrators',
      sql: 'UPDATE users SET userRole = "Administrator" WHERE role = "Administrator" AND userRole != "Administrator"',
    },
    {
      name: 'Sync userRole field to match role for Users',
      sql: 'UPDATE users SET userRole = "User" WHERE role = "User" AND userRole != "User"',
    },
    {
      name: 'Set default User role for null/empty roles',
      sql: 'UPDATE users SET role = "User" WHERE role IS NULL OR role = ""',
    },
    {
      name: 'Set default User userRole for null/empty userRoles',
      sql: 'UPDATE users SET userRole = "User" WHERE userRole IS NULL OR userRole = ""',
    }
  ];
  
  let completed = 0;
  
  function runNextMigration() {
    if (completed >= migrations.length) {
      verifyMigration();
      return;
    }
    
    const migration = migrations[completed];
    console.log(`Running: ${migration.name}`);
    
    db.run(migration.sql, [], function(err) {
      if (err) {
        console.error(`❌ Error in ${migration.name}:`, err);
      } else {
        console.log(`✅ ${migration.name}: ${this.changes} rows updated`);
      }
      
      completed++;
      runNextMigration();
    });
  }
  
  runNextMigration();
}

function verifyMigration() {
  console.log('\n=== AFTER MIGRATION ===');
  
  db.all('SELECT id, username, role, userRole, employeeRole FROM users', [], (err, rows) => {
    if (err) {
      console.error('❌ Error reading users after migration:', err);
      return;
    }
    
    console.log('Updated users:');
    rows.forEach(row => {
      console.log(`  ${row.id}: ${row.username} | role='${row.role}' | userRole='${row.userRole}' | employeeRole='${row.employeeRole}'`);
    });
    
    // Verify consistency
    let inconsistencies = 0;
    rows.forEach(row => {
      if (row.role !== row.userRole) {
        console.log(`⚠️  Inconsistency for ${row.username}: role='${row.role}' vs userRole='${row.userRole}'`);
        inconsistencies++;
      }
    });
    
    if (inconsistencies === 0) {
      console.log('✅ All roles are consistent!');
    } else {
      console.log(`❌ Found ${inconsistencies} inconsistencies`);
    }
    
    // Check distinct roles
    db.all('SELECT DISTINCT role FROM users ORDER BY role', [], (err, roleRows) => {
      if (err) return;
      console.log('\nDistinct roles:', roleRows.map(r => r.role));
      
      db.all('SELECT DISTINCT userRole FROM users ORDER BY userRole', [], (err, userRoleRows) => {
        if (err) return;
        console.log('Distinct userRoles:', userRoleRows.map(r => r.userRole));
        
        console.log('\n🎉 Migration completed successfully!');
        db.close();
      });
    });
  });
}

// Start migration
runMigration();
