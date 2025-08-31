const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

// Quick test of login logic
const MASTER_PASSWORD = 'admin123';
const db = new sqlite3.Database('clinic.db');

function testLogin(username, password) {
  return new Promise((resolve) => {
    console.log(`\nTesting login: username="${username}", password="${password}"`);
    
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        console.log('❌ Database error:', err.message);
        resolve(false);
        return;
      }
      
      if (!row) {
        console.log('❌ User not found');
        resolve(false);
        return;
      }
      
      console.log(`   User found: ${row.username}, stored password: "${row.password}", role: ${row.role}`);
      
      // Same logic as server
      if (password === MASTER_PASSWORD || row.password === password) {
        console.log('✅ Login would succeed');
        if (password === MASTER_PASSWORD) {
          console.log('   (using master password)');
        } else {
          console.log('   (using user-specific password)');
        }
        resolve(true);
      } else {
        console.log('❌ Login would fail');
        console.log(`   password !== "${MASTER_PASSWORD}" && password !== "${row.password}"`);
        resolve(false);
      }
    });
  });
}

async function runTests() {
  console.log('Testing login combinations:');
  
  await testLogin('admin', 'admin');
  await testLogin('admin', 'admin123');
  await testLogin('user', 'user');
  await testLogin('user', 'admin123');
  await testLogin('admin', 'wrong');
  
  db.close();
  console.log('\nTest complete!');
}

runTests();
