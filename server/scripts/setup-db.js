const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up PayProof database...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found in server directory');
  console.log('📝 Please create server/.env file with DATABASE_URL');
  console.log('💡 See SETUP.md for configuration details\n');
  process.exit(1);
}

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  
  // Run migrations
  console.log('\n🔄 Running database migrations...');
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  
  console.log('\n✅ Database setup completed successfully!');
  console.log('🎉 You can now start the server with: npm run dev');
  console.log('🔍 View your database with: npx prisma studio\n');
  
} catch (error) {
  console.error('\n❌ Database setup failed:', error.message);
  console.log('\n🔧 Troubleshooting tips:');
  console.log('1. Ensure PostgreSQL is running');
  console.log('2. Check DATABASE_URL in server/.env');
  console.log('3. Verify database exists and user has permissions');
  console.log('4. See SETUP.md for detailed instructions\n');
  process.exit(1);
}