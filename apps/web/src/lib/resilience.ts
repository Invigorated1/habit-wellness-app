import { logger } from './logger';

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

interface TimeoutOptions {
  timeout: number;
  errorMessage?: string;
}

/**
 * Default retry condition - retry on network errors and 5xx status codes
 */
const defaultRetryCondition = (error: any): boolean => {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }
  
  // Database errors that might be transient
  if (error.code === 'P2002' || error.code === 'P2024') {
    return true;
  }
  
  // HTTP 5xx errors
  if (error.status >= 500 && error.status < 600) {
    return true;
  }
  
  // Rate limit errors
  if (error.status === 429) {
    return true;
  }
  
  return false;
};

/**
 * Exponential backoff with jitter
 */
function calculateDelay(attempt: number, initialDelay: number, maxDelay: number, backoffFactor: number): number {
  const exponentialDelay = initialDelay * Math.pow(backoffFactor, attempt - 1);
  const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5);
  return Math.min(jitteredDelay, maxDelay);
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 100,
    maxDelay = 5000,
    backoffFactor = 2,
    retryCondition = defaultRetryCondition,
  } = options;
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt === maxAttempts || !retryCondition(error)) {
        throw error;
      }
      
      // Calculate delay
      const delay = calculateDelay(attempt, initialDelay, maxDelay, backoffFactor);
      
      logger.warn('Retrying after error', {
        attempt,
        maxAttempts,
        delay,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Timeout wrapper for async functions
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  options: TimeoutOptions
): Promise<T> {
  const { timeout, errorMessage = `Operation timed out after ${timeout}ms` } = options;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeout);
  });
  
  try {
    return await Promise.race([fn(), timeoutPromise]);
  } catch (error) {
    if (error instanceof Error && error.message === errorMessage) {
      logger.error('Operation timeout', { timeout, errorMessage });
    }
    throw error;
  }
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 1 minute
    private readonly halfOpenRequests: number = 3
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
        this.failures = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      
      if (this.state === 'half-open') {
        this.failures = 0;
        this.state = 'closed';
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.threshold) {
        this.state = 'open';
        logger.error('Circuit breaker opened', {
          failures: this.failures,
          threshold: this.threshold,
        });
      }
      
      throw error;
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

/**
 * Compose resilience patterns
 */
export function withResilience<T>(
  fn: () => Promise<T>,
  options: {
    timeout?: number;
    retry?: RetryOptions;
    circuitBreaker?: CircuitBreaker;
  } = {}
): Promise<T> {
  let wrappedFn = fn;
  
  // Apply timeout
  if (options.timeout) {
    const originalFn = wrappedFn;
    wrappedFn = () => withTimeout(originalFn, { timeout: options.timeout! });
  }
  
  // Apply retry
  if (options.retry) {
    const originalFn = wrappedFn;
    wrappedFn = () => withRetry(originalFn, options.retry);
  }
  
  // Apply circuit breaker
  if (options.circuitBreaker) {
    const originalFn = wrappedFn;
    wrappedFn = () => options.circuitBreaker!.execute(originalFn);
  }
  
  return wrappedFn();
}