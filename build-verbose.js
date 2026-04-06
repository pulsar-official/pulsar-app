#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');

console.log('=== BUILD STARTED ===');
console.log('Time:', new Date().toISOString());
console.log('CWD:', process.cwd());
console.log('');

const child = spawn('npm', ['run', 'build'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let lastOutput = Date.now();
const outputTimeout = 120000; // 2 minutes without output = timeout

child.stdout.on('data', (data) => {
  lastOutput = Date.now();
  process.stdout.write(data);
});

child.stderr.on('data', (data) => {
  lastOutput = Date.now();
  process.stderr.write(data);
});

const timeoutCheck = setInterval(() => {
  const elapsed = Date.now() - lastOutput;
  if (elapsed > outputTimeout) {
    console.error('\n\n=== BUILD TIMEOUT: No output for 2 minutes ===');
    clearInterval(timeoutCheck);
    child.kill();
    process.exit(124);
  }
}, 30000);

child.on('close', (code) => {
  clearInterval(timeoutCheck);
  console.log('\n\n=== BUILD COMPLETED ===');
  console.log('Exit Code:', code);
  if (code === 0) {
    console.log('Status: SUCCESS');
  } else {
    console.log('Status: FAILED');
  }
  process.exit(code);
});
