#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';

console.log('🧪 PayProof Setup Test\n');

async function testEndpoint(url, name) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    console.log(`✅ ${name}: ${response.status} ${response.statusText}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return false;
  }
}

async function testDatabase() {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    console.log(`✅ Database connection: OK`);
    return true;
  } catch (error) {
    console.log(`❌ Database connection: ${error.message}`);
    return false;
  }
}

function checkEnvFiles() {
  const frontendEnv = fs.existsSync('.env');
  const backendEnv = fs.existsSync('server/.env');
  
  console.log(`${frontendEnv ? '✅' : '❌'} Frontend .env file`);
  console.log(`${backendEnv ? '✅' : '❌'} Backend .env file`);
  
  return frontendEnv && backendEnv;
}

function checkDependencies() {
  const frontendDeps = fs.existsSync('node_modules');
  const backendDeps = fs.existsSync('server/node_modules');
  
  console.log(`${frontendDeps ? '✅' : '❌'} Frontend dependencies`);
  console.log(`${backendDeps ? '✅' : '❌'} Backend dependencies`);
  
  return frontendDeps && backendDeps;
}

async function runTests() {
  console.log('📋 Checking prerequisites...\n');
  
  const envOk = checkEnvFiles();
  const depsOk = checkDependencies();
  
  if (!envOk) {
    console.log('\n❌ Missing environment files. Please see SETUP.md for configuration.\n');
    return;
  }
  
  if (!depsOk) {
    console.log('\n❌ Missing dependencies. Run:');
    console.log('   npm install');
    console.log('   cd server && npm install\n');
    return;
  }
  
  console.log('\n🌐 Testing endpoints...\n');
  
  const backendOk = await testEndpoint(`${BACKEND_URL}/health`, 'Backend health');
  const frontendOk = await testEndpoint(FRONTEND_URL, 'Frontend');
  
  if (!backendOk) {
    console.log('\n❌ Backend not running. Start with:');
    console.log('   cd server && npm run dev\n');
  }
  
  if (!frontendOk) {
    console.log('\n❌ Frontend not running. Start with:');
    console.log('   npm run dev\n');
  }
  
  console.log('\n🔍 Testing API endpoints...\n');
  
  // Test specific API endpoints
  const endpoints = [
    { url: `${BACKEND_URL}/api/payment/stats`, name: 'Payment stats' },
  ];
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint.url, endpoint.name);
  }
  
  console.log('\n📊 Test Summary\n');
  
  if (backendOk && frontendOk) {
    console.log('🎉 All systems operational!');
    console.log('\n🚀 Next steps:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Connect your MetaMask wallet');
    console.log('3. Send a test payment');
    console.log('4. View the generated proof');
    console.log('5. Test the shareable link\n');
  } else {
    console.log('⚠️  Some services are not running. Please check the setup.\n');
  }
  
  console.log('📚 For detailed setup instructions, see SETUP.md');
  console.log('🐛 For troubleshooting, check the console logs\n');
}

runTests().catch(console.error);