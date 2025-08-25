#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🏗️  Building White Teeth Dental Clinic Desktop App...\n');

try {
  // Step 1: Build React app
  console.log('📦 Building React frontend...');
  execSync('npm run build', { stdio: 'inherit', cwd: process.cwd() });
  console.log('✅ React build complete!\n');

  // Step 2: Check if backend files exist
  const backendPath = path.join(process.cwd(), 'src', 'backend');
  if (fs.existsSync(backendPath)) {
    console.log('✅ Backend files found!\n');
  } else {
    console.log('⚠️  Backend files not found at src/backend\n');
  }

  // Step 3: Build Electron app
  console.log('⚡ Building Electron desktop app...');
  execSync('npm run dist', { stdio: 'inherit', cwd: process.cwd() });
  console.log('\n🎉 Desktop app build complete!');
  console.log('📁 Check the "dist" folder for your .exe file');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
