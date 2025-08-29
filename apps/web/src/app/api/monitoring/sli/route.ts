import { NextResponse } from 'next/server';
import { sliCalculator } from '@/lib/monitoring/sli';
import { performanceMonitor } from '@/lib/performance';
import { redis } from '@/lib/redis';
import { withErrorHandler, successResponse } from '@/lib/api-handler';

export const GET = withErrorHandler(async () => {
  // Get current SLIs
  const slis = await sliCalculator.getCurrentSLIs();
  
  // Get performance stats
  const performanceStats = performanceMonitor.getCurrentStats();
  
  // Get rate limit stats (if available)
  let rateLimitStats = null;
  try {
    const rateLimitInfo = await redis.get('ratelimit:analytics');
    if (rateLimitInfo) {
      rateLimitStats = JSON.parse(rateLimitInfo as string);
    }
  } catch (error) {
    // Ignore rate limit stats errors
  }
  
  // Calculate SLO compliance
  const sloCompliance = slis.map(sli => {
    const isCompliant = sli.name === 'Error Rate' 
      ? sli.value <= sli.target
      : sli.value >= sli.target;
    
    return {
      ...sli,
      compliant: isCompliant,
      compliancePercentage: isCompliant ? 100 : (sli.value / sli.target) * 100,
    };
  });
  
  return successResponse({
    slis: sloCompliance,
    performance: performanceStats,
    rateLimit: rateLimitStats,
    timestamp: new Date().toISOString(),
  });
}, { rateLimit: false }); // Don't rate limit monitoring endpoints