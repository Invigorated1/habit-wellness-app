import { PrismaClient } from '@/generated/prisma';
import { withRetry, withTimeout } from './resilience';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Add query timeout
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Add middleware for timeouts and retries
prismaClient.$use(async (params, next) => {
  // Set default timeout for all operations
  const timeout = 10000; // 10 seconds
  
  // Define which operations should be retried
  const retryableOperations = ['findFirst', 'findMany', 'findUnique', 'count'];
  const shouldRetry = retryableOperations.includes(params.action);
  
  // Execute with resilience patterns
  const execute = async () => {
    return withTimeout(
      () => next(params),
      { timeout, errorMessage: `Database query timeout: ${params.model}.${params.action}` }
    );
  };
  
  if (shouldRetry) {
    return withRetry(execute, {
      maxAttempts: 3,
      retryCondition: (error) => {
        // Only retry on transient errors
        const transientErrorCodes = [
          'P1001', // Can't reach database server
          'P1002', // Database server was reached but timed out
          'P1008', // Operations timed out
          'P1017', // Server has closed the connection
          'P2024', // Timed out fetching a new connection from the pool
        ];
        
        if (transientErrorCodes.includes(error.code)) {
          logger.debug('Retrying transient database error', { code: error.code });
          return true;
        }
        
        // Don't retry on any other Prisma errors (including P2025 - record not found)
        if (error.code?.startsWith('P')) {
          return false;
        }
        
        // Retry on network errors
        if (error.message?.includes('ECONNREFUSED') || 
            error.message?.includes('ETIMEDOUT') ||
            error.message?.includes('ECONNRESET')) {
          return true;
        }
        
        return false;
      },
    });
  }
  
  return execute();
});

export const prisma = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;