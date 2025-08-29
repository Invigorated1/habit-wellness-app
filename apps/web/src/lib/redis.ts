import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { logger } from './logger';

// Create Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiter with Redis backend
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit',
});

// Cache utilities
export class Cache {
  constructor(
    private prefix: string,
    private defaultTTL: number = 3600 // 1 hour default
  ) {}

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(this.getKey(key));
      if (data) {
        logger.debug('Cache hit', { prefix: this.prefix, key });
        return data as T;
      }
      logger.debug('Cache miss', { prefix: this.prefix, key });
      return null;
    } catch (error) {
      logger.error('Cache get error', { error, prefix: this.prefix, key });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await redis.set(this.getKey(key), value, {
        ex: ttl || this.defaultTTL,
      });
      logger.debug('Cache set', { prefix: this.prefix, key, ttl: ttl || this.defaultTTL });
    } catch (error) {
      logger.error('Cache set error', { error, prefix: this.prefix, key });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await redis.del(this.getKey(key));
      logger.debug('Cache delete', { prefix: this.prefix, key });
    } catch (error) {
      logger.error('Cache delete error', { error, prefix: this.prefix, key });
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      // Note: pattern matching requires SCAN which Upstash supports
      const keys: string[] = [];
      let cursor = 0;
      
      do {
        const result = await redis.scan(cursor, {
          match: `${this.prefix}:${pattern}`,
          count: 100,
        });
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== 0);
      
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info('Cache invalidated', { prefix: this.prefix, pattern, count: keys.length });
      }
    } catch (error) {
      logger.error('Cache invalidate error', { error, prefix: this.prefix, pattern });
    }
  }
}

// Create cache instances
export const habitCache = new Cache('habits', 300); // 5 minutes
export const userCache = new Cache('users', 3600); // 1 hour

// Cache decorators
export function cacheable(
  cacheInstance: Cache,
  keyGenerator: (...args: any[]) => string,
  ttl?: number
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator(...args);
      
      // Try to get from cache
      const cached = await cacheInstance.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
      
      // Execute original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      if (result !== null && result !== undefined) {
        await cacheInstance.set(cacheKey, result, ttl);
      }
      
      return result;
    };

    return descriptor;
  };
}

// Cache invalidation helpers
export async function invalidateUserCache(userId: string) {
  await userCache.delete(userId);
  await habitCache.invalidate(`user:${userId}:*`);
}

export async function invalidateHabitCache(userId: string, habitId?: string) {
  if (habitId) {
    await habitCache.delete(`habit:${habitId}`);
  }
  await habitCache.delete(`user:${userId}:habits`);
}