import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should log info messages', () => {
    logger.info('Test message', { userId: '123' });
    
    expect(console.log).toHaveBeenCalled();
    const call = (console.log as any).mock.calls[0];
    
    // In development, it logs with colors
    if (process.env.NODE_ENV === 'development') {
      expect(call[0]).toContain('[INFO]');
      expect(call[0]).toContain('Test message');
    } else {
      // In production, it logs JSON
      const logEntry = JSON.parse(call[0]);
      expect(logEntry.level).toBe('info');
      expect(logEntry.message).toBe('Test message');
      expect(logEntry.userId).toBe('123');
    }
  });

  it('should log error messages', () => {
    logger.error('Error occurred', { error: 'Something went wrong' });
    
    expect(console.log).toHaveBeenCalled();
    const call = (console.log as any).mock.calls[0];
    
    if (process.env.NODE_ENV === 'development') {
      expect(call[0]).toContain('[ERROR]');
      expect(call[0]).toContain('Error occurred');
    }
  });

  it('should not log debug messages in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    logger.debug('Debug message');
    
    expect(console.log).not.toHaveBeenCalled();
    
    process.env.NODE_ENV = originalEnv;
  });
});