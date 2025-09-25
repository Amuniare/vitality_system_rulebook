#!/usr/bin/env node

/**
 * Quick deployment script for development
 * Usage: node scripts/deploy-quick.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`${description}...`, 'blue');
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../../')
    });
    log(`✅ ${description} completed`, 'green');
    return result;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

function checkFile(filePath, description) {
  if (!fs.existsSync(filePath)) {
    log(`❌ ${description} not found at ${filePath}`, 'red');
    process.exit(1);
  }
  log(`✅ ${description} found`, 'green');
}

async function main() {
  log('🚀 Quick Firebase Deployment for Vitality System', 'bright');
  log('===============================================', 'cyan');

  // Check if we're in the right directory
  const rootDir = path.resolve(__dirname, '../../');
  process.chdir(rootDir);

  // Validate files
  checkFile('firebase.json', 'Firebase configuration');
  checkFile('modernApp/index.html', 'Main application');
  checkFile('modernApp/config/firebase.js', 'Firebase client config');

  // Check Firebase CLI
  try {
    execSync('firebase --version', { encoding: 'utf8' });
    log('✅ Firebase CLI available', 'green');
  } catch (error) {
    log('❌ Firebase CLI not found. Install with: npm install -g firebase-tools', 'red');
    process.exit(1);
  }

  // Check login status
  try {
    execSync('firebase projects:list', { encoding: 'utf8', stdio: 'pipe' });
    log('✅ Firebase authentication verified', 'green');
  } catch (error) {
    log('❌ Not logged in to Firebase. Run: firebase login', 'red');
    process.exit(1);
  }

  // Get current project
  try {
    const project = execSync('firebase use --current', { encoding: 'utf8' }).trim();
    log(`📋 Using Firebase project: ${project}`, 'yellow');
  } catch (error) {
    log('❌ No Firebase project selected. Run: firebase use --add', 'red');
    process.exit(1);
  }

  log('', 'reset');
  log('Starting deployment...', 'bright');

  // Deploy hosting only for quick updates
  execCommand('firebase deploy --only hosting', 'Deploying hosting');

  // Get project info for URLs
  const project = execSync('firebase use --current', { encoding: 'utf8' }).trim();

  log('', 'reset');
  log('🎉 Deployment completed successfully!', 'green');
  log('', 'reset');
  log('🌐 Your application is live at:', 'bright');
  log(`   https://${project}.web.app`, 'cyan');
  log(`   https://${project}.firebaseapp.com`, 'cyan');
  log('', 'reset');
  log('📖 Character Gallery:', 'blue');
  log(`   https://${project}.web.app/gallery.html`, 'cyan');
  log('', 'reset');
  log('🛠️ Character Builder:', 'blue');
  log(`   https://${project}.web.app/index.html`, 'cyan');
  log('', 'reset');
  log('💡 For full deployment (including rules), use: npm run deploy:full', 'yellow');
}

main().catch(error => {
  log(`❌ Deployment failed: ${error.message}`, 'red');
  process.exit(1);
});