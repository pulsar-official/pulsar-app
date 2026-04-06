const { execSync } = require('child_process');

try {
  console.log('Starting build...');
  execSync('npm run build', {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
  console.log('\n=== BUILD SUCCEEDED ===');
  process.exit(0);
} catch (error) {
  console.error('\n=== BUILD FAILED ===');
  console.error('Exit code:', error.status);
  process.exit(1);
}
