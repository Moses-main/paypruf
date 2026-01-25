#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🧪 Testing server startup...\n');

// Start the server with a timeout
const server = spawn('npx', ['ts-node', 'src/index.ts'], {
  cwd: __dirname,
  stdio: 'pipe',
  env: { ...process.env, NODE_ENV: 'development' }
});

let hasError = false;
let serverStarted = false;

// Capture stdout
server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('📝 Server output:', output.trim());
  
  if (output.includes('Server is running on port')) {
    console.log('✅ Server started successfully!');
    serverStarted = true;
    setTimeout(() => {
      server.kill();
      process.exit(0);
    }, 2000);
  }
});

// Capture stderr
server.stderr.on('data', (data) => {
  const output = data.toString();
  console.log('❌ Server error:', output.trim());
  
  if (output.includes('Uncaught Exception') || 
      output.includes('TypeError') || 
      output.includes('Error:')) {
    hasError = true;
    console.log('\n💥 Server failed to start');
    server.kill();
    process.exit(1);
  }
});

// Handle server exit
server.on('close', (code) => {
  if (!serverStarted && !hasError) {
    console.log(`\n⚠️  Server exited with code ${code}`);
    process.exit(code);
  }
});

// Timeout after 15 seconds
setTimeout(() => {
  if (!serverStarted) {
    console.log('\n⏰ Server startup timeout - check your configuration');
    server.kill();
    process.exit(1);
  }
}, 15000);