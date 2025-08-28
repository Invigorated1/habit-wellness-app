import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { withErrorHandler, successResponse } from '@/lib/api-handler';

export const GET = withErrorHandler(async () => {
  logger.info('Testing database connection');
  
  // Test database connection
  const result = await prisma.$queryRaw`SELECT 1 as test`;
  
  logger.info('Database connection successful');
  
  return successResponse({
    message: 'Database connection successful',
    result,
  });
});