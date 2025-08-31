mcpconst sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('clinic.db');

console.log('Checking all users in database:');
db.all("SELECT id, username, password, role FROM users", [], (err, rows) => {
  if (err) {
    console.error('Database error:', err.message);
  } else {
    console.log('Users found:', rows);
    
    // Test specific admin user
    const adminUser = rows.find(r => r.username === 'admin');
    if (adminUser) {
      console.log('\nAdmin user details:');
      console.log('- Username:', adminUser.username);
      console.log('- Password:', adminUser.password);
      console.log('- Role:', adminUser.role);
      
      // Test password comparisons
      console.log('\nPassword tests:');
      console.log('- Password === "admin":', adminUser.password === 'admin');
      console.log('- Password === "admin123":', adminUser.password === 'admin123');
      console.log('- Password length:', adminUser.password.length);
      console.log('- Password type:', typeof adminUser.password);
    } else {
      console.log('\nNo admin user found!');
    }
  }
  db.close();
});
