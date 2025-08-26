import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry, logJobExecution, getJobStats, cleanupOldJobs } from './cron';

// Mock prisma
vi.mock('./prisma', () => ({
  prisma: {
    cronJob: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

const { prisma } = await import('./prisma');

describe('Cron Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('withRetry', () => {
    it('returns result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure with exponential backoff', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const onRetry = vi.fn();
      const promise = withRetry(fn, { maxRetries: 3, initialDelay: 100, onRetry });

      // First attempt fails immediately
      await vi.advanceTimersByTimeAsync(0);
      expect(fn).toHaveBeenCalledTimes(1);

      // First retry after 100ms
      await vi.advanceTimersByTimeAsync(100);
      expect(fn).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);

      // Second retry after 200ms (exponential backoff)
      await vi.advanceTimersByTimeAsync(200);
      expect(fn).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 2);

      const result = await promise;
      expect(result).toBe('success');
    });

    it('throws after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('persistent failure'));

      const promise = withRetry(fn, { maxRetries: 2, initialDelay: 10 });

      // Advance through all retries
      await vi.advanceTimersByTimeAsync(1000);

      await expect(promise).rejects.toThrow('persistent failure');
      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('respects max delay', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      const onRetry = vi.fn();

      const promise = withRetry(fn, {
        maxRetries: 5,
        initialDelay: 1000,
        maxDelay: 3000,
        onRetry,
      });

      // First retry: 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      expect(fn).toHaveBeenCalledTimes(2);

      // Second retry: 2000ms
      await vi.advanceTimersByTimeAsync(2000);
      expect(fn).toHaveBeenCalledTimes(3);

      // Third retry: should be capped at 3000ms (not 4000ms)
      await vi.advanceTimersByTimeAsync(3000);
      expect(fn).toHaveBeenCalledTimes(4);

      // Cleanup
      await vi.advanceTimersByTimeAsync(10000);
      await expect(promise).rejects.toThrow();
    });
  });

  describe('logJobExecution', () => {
    it('logs successful execution', async () => {
      const fn = vi.fn().mockResolvedValue({ data: 'test' });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await logJobExecution('test-job', fn);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: 'test' });
      expect(result.retries).toBe(0);
      expect(result.duration).toBeGreaterThan(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Job test-job] Completed successfully')
      );

      consoleSpy.mockRestore();
    });

    it('logs failed execution with retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('job error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.useRealTimers(); // Use real timers for this test
      const result = await logJobExecution('test-job', fn);

      expect(result.success).toBe(false);
      expect(result.error).toBe('job error');
      expect(result.retries).toBe(3);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Job test-job] Failed after 3 retries')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getJobStats', () => {
    it('calculates job statistics correctly', async () => {
      const mockJobs = [
        { 
          id: '1', 
          status: 'completed', 
          result: { duration: 1000 },
          createdAt: new Date(),
        },
        { 
          id: '2', 
          status: 'completed', 
          result: { duration: 2000 },
          createdAt: new Date(),
        },
        { 
          id: '3', 
          status: 'failed', 
          error: 'error',
          createdAt: new Date(),
        },
        { 
          id: '4', 
          status: 'running',
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.cronJob.findMany).mockResolvedValue(mockJobs as any);

      const stats = await getJobStats('test-job', 7);

      expect(stats.total).toBe(4);
      expect(stats.successful).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.running).toBe(1);
      expect(stats.successRate).toBe(50);
      expect(stats.avgDuration).toBe(1500);
      expect(stats.recentJobs).toHaveLength(4);
    });

    it('handles empty job history', async () => {
      vi.mocked(prisma.cronJob.findMany).mockResolvedValue([]);

      const stats = await getJobStats('test-job', 7);

      expect(stats.total).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.avgDuration).toBe(0);
      expect(stats.recentJobs).toHaveLength(0);
    });
  });

  describe('cleanupOldJobs', () => {
    it('deletes old job records', async () => {
      vi.mocked(prisma.cronJob.deleteMany).mockResolvedValue({ count: 10 });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const count = await cleanupOldJobs('test-job', 30);

      expect(count).toBe(10);
      expect(prisma.cronJob.deleteMany).toHaveBeenCalledWith({
        where: {
          name: 'test-job',
          createdAt: { lt: expect.any(Date) },
        },
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Cleanup] Deleted 10 old test-job job records'
      );

      consoleSpy.mockRestore();
    });
  });
});