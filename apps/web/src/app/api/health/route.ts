import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { performanceMonitor } from '@/lib/performance';
import { logger } from '@/lib/logger';

export async function GET() {
  const healthChecks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      performance: 'unknown',
    },
    details: {} as any,
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    healthChecks.checks.database = 'healthy';
  } catch (error) {
    healthChecks.checks.database = 'unhealthy';
    healthChecks.status = 'unhealthy';
    healthChecks.details.database = {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    logger.error('Health check: Database unhealthy', { error });
  }

  // Get performance metrics
  try {
    const stats = performanceMonitor.getCurrentStats();
    healthChecks.checks.performance = 'healthy';
    healthChecks.details.performance = stats;
  } catch (error) {
    healthChecks.checks.performance = 'unhealthy';
    healthChecks.details.performance = {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Add environment info
  healthChecks.details.environment = {
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  };

  const status = healthChecks.status === 'healthy' ? 200 : 503;
  
  return NextResponse.json(healthChecks, { status });
}