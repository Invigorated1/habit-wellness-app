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
        // Retry on connection errors
        if (error.code === 'P2024' || error.code === 'P2025') {
          return true;
        }
        // Don't retry on validation errors
        if (error.code?.startsWith('P2')) {
          return false;
        }
        return true;
      },
    });
  }
  
  return execute();
});

export const prisma = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;