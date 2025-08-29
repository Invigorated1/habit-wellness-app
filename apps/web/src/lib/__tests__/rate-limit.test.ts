import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimiter, withRateLimit } from '../rate-limit';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Clear the rate limiter store by creating a new instance
    vi.clearAllMocks();
  });

  describe('rateLimiter.check', () => {
    it('should allow requests within limit', async () => {
      const identifier = 'test-user-1';
      
      const result1 = await rateLimiter.check(identifier);
      expect(result1.success).toBe(true);
      expect(result1.limit).toBe(100);
      expect(result1.remaining).toBe(99);
      
      const result2 = await rateLimiter.check(identifier);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(98);
    });

    it('should track different identifiers separately', async () => {
      const result1 = await rateLimiter.check('user-1');
      const result2 = await rateLimiter.check('user-2');
      
      expect(result1.remaining).toBe(99);
      expect(result2.remaining).toBe(99);
    });

    it('should reset after time window', async () => {
      const identifier = 'test-user-reset';
      
      // First request
      const result1 = await rateLimiter.check(identifier);
      expect(result1.remaining).toBe(99);
      
      // Mock time passing
      const resetTime = result1.reset;
      vi.setSystemTime(new Date(resetTime + 1));
      
      // Should reset
      const result2 = await rateLimiter.check(identifier);
      expect(result2.remaining).toBe(99);
      
      vi.useRealTimers();
    });
  });

  describe('withRateLimit', () => {
    it('should return success with headers', async () => {
      const request = new Request('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });
      
      const result = await withRateLimit(request);
      
      expect(result.success).toBe(true);
      expect(result.headers['X-RateLimit-Limit']).toBe('100');
      expect(result.headers['X-RateLimit-Remaining']).toBeDefined();
      expect(result.headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should use custom identifier when provided', async () => {
      const request = new Request('http://localhost/api/test');
      
      const result1 = await withRateLimit(request, 'custom-id');
      const result2 = await withRateLimit(request, 'custom-id');
      
      expect(result1.headers['X-RateLimit-Remaining']).toBe('99');
      expect(result2.headers['X-RateLimit-Remaining']).toBe('98');
    });

    it('should handle missing headers gracefully', async () => {
      const request = new Request('http://localhost/api/test');
      
      const result = await withRateLimit(request);
      
      expect(result.success).toBe(true);
      expect(result.headers).toBeDefined();
    });
  });
});