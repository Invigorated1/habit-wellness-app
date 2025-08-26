import { prisma } from './prisma';

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  retries?: number;
  duration?: number;
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    onRetry,
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        break;
      }
      
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt),
        maxDelay
      );
      
      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Log job execution with timing and result
 */
export async function logJobExecution(
  jobName: string,
  fn: () => Promise<any>
): Promise<JobResult> {
  const startTime = Date.now();
  let retries = 0;
  
  try {
    const result = await withRetry(fn, {
      onRetry: (error, attempt) => {
        retries = attempt;
        console.log(`[Job ${jobName}] Retry ${attempt} after error:`, error.message);
      },
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`[Job ${jobName}] Completed successfully in ${duration}ms`);
    
    return {
      success: true,
      data: result,
      retries,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`[Job ${jobName}] Failed after ${retries} retries in ${duration}ms:`, errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      retries,
      duration,
    };
  }
}

/**
 * Get job statistics for monitoring
 */
export async function getJobStats(jobName: string, days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  const jobs = await prisma.cronJob.findMany({
    where: {
      name: jobName,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  const total = jobs.length;
  const successful = jobs.filter(j => j.status === 'completed').length;
  const failed = jobs.filter(j => j.status === 'failed').length;
  const running = jobs.filter(j => j.status === 'running').length;
  
  const successRate = total > 0 ? (successful / total) * 100 : 0;
  
  // Calculate average duration from successful jobs
  const durations = jobs
    .filter(j => j.status === 'completed' && j.result)
    .map(j => {
      try {
        const result = j.result as any;
        return result.duration || 0;
      } catch {
        return 0;
      }
    })
    .filter(d => d > 0);
  
  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;
  
  return {
    total,
    successful,
    failed,
    running,
    successRate: Math.round(successRate * 100) / 100,
    avgDuration: Math.round(avgDuration),
    recentJobs: jobs.slice(0, 10).map(j => ({
      id: j.id,
      status: j.status,
      lastRunAt: j.lastRunAt,
      error: j.error,
    })),
  };
}

/**
 * Clean up old job records
 */
export async function cleanupOldJobs(jobName: string, daysToKeep: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const result = await prisma.cronJob.deleteMany({
    where: {
      name: jobName,
      createdAt: { lt: cutoffDate },
    },
  });
  
  console.log(`[Cleanup] Deleted ${result.count} old ${jobName} job records`);
  
  return result.count;
}