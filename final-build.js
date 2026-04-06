#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const buildLog = path.join(__dirname, '.build-log');
const startTime = Date.now();

console.log('=== FINAL BUILD ATTEMPT ===');
console.log('Started at:', new Date().toISOString());

const npm = spawn('npm', ['run', 'build'], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true
});

let outputLines = [];
let lastActivityTime = Date.now();

npm.stdout.on('data', (data) => {
  lastActivityTime = Date.now();
  const text = data.toString();
  outputLines.push(text);
  process.stdout.write(text);
});

npm.stderr.on('data', (data) => {
  lastActivityTime = Date.now();
  const text = data.toString();
  outputLines.push(text);
  process.stderr.write(text);
});

const timeout = setTimeout(() => {
  const elapsed = Math.round((Date.now() - lastActivityTime) / 1000);
  console.error(`\n\nBuild timeout: No output for ${elapsed} seconds`);
  npm.kill('SIGTERM');
  process.exit(124);
}, 300000); // 5 minutes timeout

npm.on('close', (code) => {
  clearTimeout(timeout);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n\n=== BUILD FINISHED ===');
  console.log('Duration:', duration + 's');
  console.log('Exit Code:', code);

  if (code === 0) {
    console.log('Status: SUCCESS');
  } else {
    console.log('Status: FAILED');
    // Check for TypeScript errors in output
    const fullOutput = outputLines.join('');
    if (fullOutput.includes('error TS')) {
      console.log('\nTypeScript errors found');
    }
  }

  process.exit(code);
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('\nBuild interrupted');
  npm.kill();
  process.exit(1);
});
