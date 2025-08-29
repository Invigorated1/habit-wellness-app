import { NextResponse } from 'next/server';
import { costTracker } from '@/lib/monitoring/cost-tracker';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { requirePermission, Permissions } from '@/lib/auth/permissions';
import { getCurrentUserId } from '@/lib/auth';

export const GET = withErrorHandler(async (request: Request) => {
  // Only admins can view cost data
  const userId = await getCurrentUserId();
  await requirePermission(userId, Permissions.ADMIN_VIEW_ANALYTICS);
  
  const url = new URL(request.url);
  const period = url.searchParams.get('period') || 'day';
  
  // Validate period
  if (!['hour', 'day', 'week', 'month'].includes(period)) {
    throw new ValidationError('Invalid period. Must be hour, day, week, or month');
  }
  
  // Get usage metrics
  const metrics = await costTracker.getUsageMetrics(period as any);
  
  // Calculate costs
  const costs = await costTracker.calculateCosts(metrics);
  
  // Check for alerts
  await costTracker.checkAlerts();
  
  return successResponse({
    period,
    metrics,
    costs: {
      total: costs.total.toFixed(2),
      breakdown: Object.entries(costs.breakdown).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value.toFixed(2),
        }),
        {}
      ),
    },
    timestamp: new Date().toISOString(),
  });
}, { rateLimit: false });

import { ValidationError } from '@/lib/errors';