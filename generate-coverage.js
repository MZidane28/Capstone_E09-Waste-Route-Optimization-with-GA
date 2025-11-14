#!/usr/bin/env node

/**
 * Coverage Report Generator
 * Generate coverage reports for both backend and frontend
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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

  console.log('\n📊 Generating Backend Coverage...\n');
  console.log('='.repeat(50));
  
  try {
    await runCommand('npm', ['run', 'test:coverage'], serverDir);
    console.log('\n✅ Backend coverage generated!\n');
    
    const serverCoverage = path.join(serverDir, 'coverage', 'lcov-report', 'index.html');
    if (fs.existsSync(serverCoverage)) {
      console.log(`📄 Backend report: ${serverCoverage}\n`);
    }
  } catch (error) {
    console.error('\n❌ Backend coverage generation failed!\n');
  }

  console.log('\n📊 Generating Frontend Coverage...\n');
  console.log('='.repeat(50));
  
  try {
    await runCommand('npm', ['run', 'test:coverage'], clientDir);
    console.log('\n✅ Frontend coverage generated!\n');
    
    const clientCoverage = path.join(clientDir, 'coverage', 'lcov-report', 'index.html');
    if (fs.existsSync(clientCoverage)) {
      console.log(`📄 Frontend report: ${clientCoverage}\n`);
    }
  } catch (error) {
    console.error('\n❌ Frontend coverage generation failed!\n');
  }

  console.log('\n🎉 Coverage reports generated successfully!\n');
  console.log('Open the HTML files in your browser to view detailed reports.\n');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
