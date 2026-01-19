import { PrismaClient } from '@prisma/client';
import { logger } from './src/utils/logger';

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    logger.info('Connecting to database...');
    await prisma.$connect();
    
    logger.info('Database connection successful!');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    logger.info('Test query result:', { result });
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    logger.info('Database tables:', { tables });
    
  } catch (error) {
    logger.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

testConnection();
