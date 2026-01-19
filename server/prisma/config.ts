import { PrismaClient } from '@prisma/client/edge';
import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a custom Prisma client that uses the connection pool
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Export the pool for direct query execution if needed
export { pool };
