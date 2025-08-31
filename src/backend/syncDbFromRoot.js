const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..', 'clinic.db');
const backend = path.resolve(__dirname, 'clinic.db');

console.log('root:', root);
console.log('backend:', backend);

try {
  fs.copyFileSync(root, backend);
  console.log('Copied root clinic.db to backend clinic.db');
} catch (e) {
  console.error('Copy failed:', e.message);
  process.exit(1);
}
