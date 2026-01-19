import dotenv from 'dotenv';
import { logger } from './src/utils/logger';

dotenv.config();

const requiredEnvVars = [
  'DATABASE_URL',
  'FLARE_RPC_URL',
  'FLARE_CHAIN_ID',
  'PRIVATE_KEY',
  'USDT0_CONTRACT_ADDRESS',
  'MASTER_ACCOUNT_CONTROLLER_ADDRESS',
  'PROOFRAILS_API_KEY',
  'PROOFRAILS_API_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'FRONTEND_URL'
];

function checkEnv() {
  logger.info('Checking environment variables...');
  
  let allVarsPresent = true;
  
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      logger.error(`Missing required environment variable: ${envVar}`);
      allVarsPresent = false;
    } else {
      // Don't log sensitive values
      const value = envVar.includes('KEY') || envVar.includes('SECRET') || envVar.includes('PASSWORD')
        ? '***REDACTED***'
        : process.env[envVar];
      logger.info(`✓ ${envVar}=${value}`);
    }
  });

  if (allVarsPresent) {
    logger.info('All required environment variables are present');
  } else {
    logger.error('Some required environment variables are missing');
    process.exit(1);
  }
}

checkEnv();
