#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'build-output.log');
const startTime = Date.now();

try {
  console.log('Starting build at', new Date().toISOString());

  // Run build with output to both console and file
  execSync('npm run build 2>&1', {
    cwd: __dirname,
    stdio: 'inherit',
    timeout: 600000 // 10 minutes
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\nBUILD SUCCEEDED in ${duration}s`);
  fs.appendFileSync(logFile, `\n\nBUILD STATUS: SUCCESS\nDuration: ${duration}s\n`);
  process.exit(0);
} catch (error) {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.error(`\nBUILD FAILED in ${duration}s`);
  console.error('Error:', error.message);
  fs.appendFileSync(logFile, `\n\nBUILD STATUS: FAILED\nExit Code: ${error.status}\nDuration: ${duration}s\n`);
  process.exit(1);
}
