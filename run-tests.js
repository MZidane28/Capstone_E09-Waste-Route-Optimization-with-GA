#!/usr/bin/env node

/**
 * Test Runner Script
 * Run all tests (backend + frontend) with a single command
 */

const { spawn } = require('child_process');
const path = require('path');

const runCommand = (command, args, cwd) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });
  });
};

const main = async () => {
  const rootDir = path.resolve(__dirname);
  const serverDir = path.join(rootDir, 'server');
  const clientDir = path.join(rootDir, 'client');

  console.log('\n🧪 Running Backend Tests...\n');
  console.log('=' .repeat(50));
  
  try {
    await runCommand('npm', ['test'], serverDir);
    console.log('\n✅ Backend tests passed!\n');
  } catch (error) {
    console.error('\n❌ Backend tests failed!\n');
    process.exit(1);
  }

  console.log('\n🎨 Running Frontend Tests...\n');
  console.log('='.repeat(50));
  
  try {
    await runCommand('npm', ['test'], clientDir);
    console.log('\n✅ Frontend tests passed!\n');
  } catch (error) {
    console.error('\n❌ Frontend tests failed!\n');
    process.exit(1);
  }

  console.log('\n🎉 All tests passed successfully!\n');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
