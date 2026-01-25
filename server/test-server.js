const { spawn } = require('child_process');
const axios = require('axios');

console.log('🧪 Testing server startup...\n');

// Start the server
const server = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: 'pipe'
});

let serverOutput = '';
let serverReady = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  console.log('📝 Server:', output.trim());
  
  if (output.includes('Server is running on port')) {
    serverReady = true;
    testServer();
  }
});

server.stderr.on('data', (data) => {
  const output = data.toString();
  console.log('❌ Error:', output.trim());
  
  if (output.includes('Uncaught Exception') || output.includes('TypeError')) {
    console.log('\n💥 Server failed to start due to errors');
    server.kill();
    process.exit(1);
  }
});

async function testServer() {
  if (!serverReady) return;
  
  console.log('\n🌐 Testing server endpoints...');
  
  try {
    // Test health endpoint
    const response = await axios.get('http://localhost:3001/health', { timeout: 5000 });
    console.log('✅ Health check:', response.status, response.data);
    
    // Test stats endpoint
    const statsResponse = await axios.get('http://localhost:3001/api/payment/stats', { timeout: 5000 });
    console.log('✅ Stats endpoint:', statsResponse.status);
    
    console.log('\n🎉 Server is working correctly!');
    
  } catch (error) {
    console.log('❌ Server test failed:', error.message);
  } finally {
    server.kill();
    process.exit(0);
  }
}

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\n⏰ Test timeout - server may have issues');
  server.kill();
  process.exit(1);
}, 30000);