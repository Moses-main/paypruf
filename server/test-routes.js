// Simple test to check if routes can be imported without errors
console.log('🧪 Testing route imports...\n');

try {
  console.log('📝 Testing payment routes...');
  const paymentRoutes = require('./src/routes/payment.routes.ts');
  console.log('✅ Payment routes imported successfully');
  
  console.log('📝 Testing proof routes...');
  const proofRoutes = require('./src/routes/proof.routes.ts');
  console.log('✅ Proof routes imported successfully');
  
  console.log('\n🎉 All routes imported without errors!');
  
} catch (error) {
  console.log('❌ Route import failed:', error.message);
  console.log('Stack:', error.stack);
  process.exit(1);
}