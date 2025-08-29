import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { withErrorHandler, successResponse } from '@/lib/api-handler';

export const GET = withErrorHandler(async () => {
  // Block this endpoint based on configuration
  const { securityConfig } = await import('@/lib/config/security');
  if (securityConfig.isProduction && !securityConfig.enableTestEndpoints) {
    logger.warn('Attempted to access test-db endpoint in production');
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
      { status: 403 }
    );
  }

  logger.info('Testing database connection');
  
  // Test database connection
  const result = await prisma.$queryRaw`SELECT 1 as test`;
  
  logger.info('Database connection successful');
  
  return successResponse({
    message: 'Database connection successful',
    result,
  });
});