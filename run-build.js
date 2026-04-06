const { spawn } = require('child_process');
const fs = require('fs');

const buildProcess = spawn('npm', ['run', 'build'], {
  cwd: process.cwd(),
  shell: true
});

let output = '';
let errorOutput = '';

buildProcess.stdout.on('data', (data) => {
  const chunk = data.toString();
  output += chunk;
  console.log(chunk);
});

buildProcess.stderr.on('data', (data) => {
  const chunk = data.toString();
  errorOutput += chunk;
  console.error(chunk);
});

buildProcess.on('close', (code) => {
  console.log('\n\n=== BUILD SUMMARY ===');
  if (code === 0) {
    console.log('BUILD SUCCEEDED');
  } else {
    console.log('BUILD FAILED with exit code:', code);
  }

  // Write to a file so we can read it
  fs.writeFileSync('build-result.txt', `Exit Code: ${code}\n\nSTDOUT:\n${output}\n\nSTDERR:\n${errorOutput}`);

  process.exit(code);
});
