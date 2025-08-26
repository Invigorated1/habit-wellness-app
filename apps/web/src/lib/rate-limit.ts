import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    })
  : null;

// Create rate limiters
const ipRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute per IP
      analytics: true,
      prefix: 'ratelimit:ip',
    })
  : null;

const userRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute per user
      analytics: true,
      prefix: 'ratelimit:user',
    })
  : null;

const apiKeyRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, '1 h'), // 1000 requests per hour per API key
      analytics: true,
      prefix: 'ratelimit:apikey',
    })
  : null;

export type RateLimitOptions = {
  type?: 'ip' | 'user' | 'apikey';
  identifier?: string;
  limit?: number;
  window?: string;
};

export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): Promise<{ success: boolean; response?: NextResponse }> {
  // Skip rate limiting if Redis is not configured
  if (!redis) {
    console.warn('Rate limiting is disabled: Redis not configured');
    return { success: true };
  }

  const { type = 'ip', identifier } = options;

  let rateLimiter: Ratelimit | null = null;
  let key: string;

  switch (type) {
    case 'user':
      if (!identifier) {
        return { success: true }; // Skip if no user ID
      }
      rateLimiter = userRateLimiter;
      key = identifier;
      break;

    case 'apikey':
      if (!identifier) {
        return { success: true }; // Skip if no API key
      }
      rateLimiter = apiKeyRateLimiter;
      key = identifier;
      break;

    case 'ip':
    default:
      rateLimiter = ipRateLimiter;
      key = getClientIp(request) || 'unknown';
      break;
  }

  if (!rateLimiter) {
    return { success: true };
  }

  try {
    const { success, limit, reset, remaining } = await rateLimiter.limit(key);

    if (!success) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Please slow down and try again later',
        },
        { status: 429 }
      );

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());
      response.headers.set('Retry-After', Math.floor((reset - Date.now()) / 1000).toString());

      return { success: false, response };
    }

    return { success: true };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow the request if rate limiting fails
    return { success: true };
  }
}

// Get client IP address
function getClientIp(request: NextRequest): string | null {
  // Check various headers in order of preference
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Fallback to request IP (may not be accurate behind proxies)
  return request.ip || null;
}

// Custom rate limiter for specific endpoints
export function createCustomRateLimiter(
  requests: number,
  window: string
): Ratelimit | null {
  if (!redis) return null;

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: 'ratelimit:custom',
  });
}

// Rate limit decorator for API routes (example usage)
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: RateLimitOptions
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { success, response } = await checkRateLimit(request, options);
    
    if (!success) {
      return response!;
    }

    return handler(request);
  };
}