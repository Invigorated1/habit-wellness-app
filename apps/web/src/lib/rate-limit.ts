/**
 * Redis-based rate limiter using Upstash
 */

import { logger } from './logger';
import { ratelimit as upstashRateLimit } from './redis';

// Fallback in-memory rate limiter for development
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs = 60000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  async check(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // New window
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: now + this.windowMs,
      };
    }

    if (entry.count >= this.maxRequests) {
      // Rate limit exceeded
      logger.warn('Rate limit exceeded', { identifier });
      
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    
    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - entry.count,
      reset: entry.resetTime,
    };
  }

  private cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug('Rate limiter cleanup', { entriesRemoved: cleaned });
    }
  }
}

// Use Redis-based rate limiter if available, otherwise fallback to in-memory
const useRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
const inMemoryLimiter = new InMemoryRateLimiter();

export const rateLimiter = {
  async check(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    if (useRedis) {
      try {
        const { success, limit, remaining, reset } = await upstashRateLimit.limit(identifier);
        
        if (!success) {
          logger.warn('Rate limit exceeded (Redis)', { identifier });
        }
        
        return {
          success,
          limit,
          remaining,
          reset: reset || Date.now() + 60000,
        };
      } catch (error) {
        logger.error('Redis rate limit error, falling back to in-memory', { error });
        // Fall through to in-memory limiter
      }
    }
    
    return inMemoryLimiter.check(identifier);
  }
};

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  request: Request,
  identifier?: string
): Promise<{ success: boolean; headers: Record<string, string> }> {
  // Use IP address as identifier if not provided
  const id = identifier || request.headers.get('x-forwarded-for') || 'unknown';
  
  const result = await rateLimiter.check(id);
  
  const headers = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };
  
  return {
    success: result.success,
    headers,
  };
}