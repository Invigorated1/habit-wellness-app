import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { trackServerEvent } from '@/lib/posthog';

// Cost configuration (example rates)
const COST_CONFIG = {
  // Database costs (per 1M operations)
  DATABASE_READ: 0.25,
  DATABASE_WRITE: 1.25,
  
  // Redis costs (per GB-month)
  REDIS_STORAGE: 0.10,
  REDIS_OPERATIONS: 0.05, // per 100k commands
  
  // Compute costs (per GB-second)
  FUNCTION_COMPUTE: 0.0000166667,
  
  // Bandwidth costs (per GB)
  BANDWIDTH_EGRESS: 0.12,
  
  // Storage costs (per GB-month)
  STORAGE: 0.023,
} as const;

// Usage metrics
interface UsageMetrics {
  databaseReads: number;
  databaseWrites: number;
  redisCommands: number;
  functionInvocations: number;
  functionDuration: number; // in ms
  bandwidthEgress: number; // in bytes
  storageUsed: number; // in bytes
}

// Cost alert thresholds
interface CostThresholds {
  daily: number;
  weekly: number;
  monthly: number;
}

export class CostTracker {
  private readonly thresholds: CostThresholds = {
    daily: 10, // $10/day
    weekly: 50, // $50/week
    monthly: 150, // $150/month
  };
  
  async trackDatabaseOperation(type: 'read' | 'write', count = 1) {
    const key = `cost:db:${type}:${this.getCurrentHour()}`;
    await redis.incrby(key, count);
    await redis.expire(key, 86400 * 7); // Keep for 7 days
  }
  
  async trackRedisOperation(commands = 1) {
    const key = `cost:redis:${this.getCurrentHour()}`;
    await redis.incrby(key, commands);
    await redis.expire(key, 86400 * 7);
  }
  
  async trackFunctionInvocation(durationMs: number) {
    const hour = this.getCurrentHour();
    await redis.incrby(`cost:function:count:${hour}`, 1);
    await redis.incrby(`cost:function:duration:${hour}`, durationMs);
    await redis.expire(`cost:function:count:${hour}`, 86400 * 7);
    await redis.expire(`cost:function:duration:${hour}`, 86400 * 7);
  }
  
  async trackBandwidth(bytes: number) {
    const key = `cost:bandwidth:${this.getCurrentHour()}`;
    await redis.incrby(key, bytes);
    await redis.expire(key, 86400 * 7);
  }
  
  async getUsageMetrics(period: 'hour' | 'day' | 'week' | 'month'): Promise<UsageMetrics> {
    const hours = this.getHoursForPeriod(period);
    const metrics: UsageMetrics = {
      databaseReads: 0,
      databaseWrites: 0,
      redisCommands: 0,
      functionInvocations: 0,
      functionDuration: 0,
      bandwidthEgress: 0,
      storageUsed: 0,
    };
    
    // Aggregate metrics
    for (const hour of hours) {
      const [dbReads, dbWrites, redis, fnCount, fnDuration, bandwidth] = await Promise.all([
        this.getMetric(`cost:db:read:${hour}`),
        this.getMetric(`cost:db:write:${hour}`),
        this.getMetric(`cost:redis:${hour}`),
        this.getMetric(`cost:function:count:${hour}`),
        this.getMetric(`cost:function:duration:${hour}`),
        this.getMetric(`cost:bandwidth:${hour}`),
      ]);
      
      metrics.databaseReads += dbReads;
      metrics.databaseWrites += dbWrites;
      metrics.redisCommands += redis;
      metrics.functionInvocations += fnCount;
      metrics.functionDuration += fnDuration;
      metrics.bandwidthEgress += bandwidth;
    }
    
    // Get current storage usage (mock for now)
    metrics.storageUsed = await this.getStorageUsage();
    
    return metrics;
  }
  
  async calculateCosts(metrics: UsageMetrics): Promise<{ total: number; breakdown: Record<string, number> }> {
    const breakdown = {
      database: (
        (metrics.databaseReads / 1_000_000) * COST_CONFIG.DATABASE_READ +
        (metrics.databaseWrites / 1_000_000) * COST_CONFIG.DATABASE_WRITE
      ),
      redis: (metrics.redisCommands / 100_000) * COST_CONFIG.REDIS_OPERATIONS,
      compute: (metrics.functionDuration / 1000) * COST_CONFIG.FUNCTION_COMPUTE,
      bandwidth: (metrics.bandwidthEgress / 1_073_741_824) * COST_CONFIG.BANDWIDTH_EGRESS, // Convert to GB
      storage: (metrics.storageUsed / 1_073_741_824) * COST_CONFIG.STORAGE,
    };
    
    const total = Object.values(breakdown).reduce((sum, cost) => sum + cost, 0);
    
    return { total, breakdown };
  }
  
  async checkAlerts(): Promise<void> {
    const [daily, weekly, monthly] = await Promise.all([
      this.getCostsForPeriod('day'),
      this.getCostsForPeriod('week'),
      this.getCostsForPeriod('month'),
    ]);
    
    const alerts: string[] = [];
    
    if (daily.total > this.thresholds.daily) {
      alerts.push(`Daily cost threshold exceeded: $${daily.total.toFixed(2)} > $${this.thresholds.daily}`);
    }
    
    if (weekly.total > this.thresholds.weekly) {
      alerts.push(`Weekly cost threshold exceeded: $${weekly.total.toFixed(2)} > $${this.thresholds.weekly}`);
    }
    
    if (monthly.total > this.thresholds.monthly) {
      alerts.push(`Monthly cost threshold exceeded: $${monthly.total.toFixed(2)} > $${this.thresholds.monthly}`);
    }
    
    if (alerts.length > 0) {
      logger.warn('Cost alerts triggered', { alerts });
      
      // Track in analytics
      for (const alert of alerts) {
        trackServerEvent('system', 'cost_alert', { alert });
      }
      
      // Send notifications (implement based on your notification system)
      await this.sendAlerts(alerts);
    }
  }
  
  private async getCostsForPeriod(period: 'hour' | 'day' | 'week' | 'month') {
    const metrics = await this.getUsageMetrics(period);
    return this.calculateCosts(metrics);
  }
  
  private async getMetric(key: string): Promise<number> {
    const value = await redis.get(key);
    return Number(value) || 0;
  }
  
  private async getStorageUsage(): Promise<number> {
    // Mock implementation - in production, query actual storage usage
    return 1_073_741_824; // 1 GB
  }
  
  private getCurrentHour(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`;
  }
  
  private getHoursForPeriod(period: 'hour' | 'day' | 'week' | 'month'): string[] {
    const hours: string[] = [];
    const now = new Date();
    let hoursToInclude = 1;
    
    switch (period) {
      case 'hour':
        hoursToInclude = 1;
        break;
      case 'day':
        hoursToInclude = 24;
        break;
      case 'week':
        hoursToInclude = 24 * 7;
        break;
      case 'month':
        hoursToInclude = 24 * 30;
        break;
    }
    
    for (let i = 0; i < hoursToInclude; i++) {
      const date = new Date(now.getTime() - i * 60 * 60 * 1000);
      hours.push(
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`
      );
    }
    
    return hours;
  }
  
  private async sendAlerts(alerts: string[]): Promise<void> {
    // Implement based on your notification system
    // Options: Slack, email, SMS, PagerDuty, etc.
    logger.error('Cost alerts need attention', { alerts });
  }
  
  // Public method to set custom thresholds
  setThresholds(thresholds: Partial<CostThresholds>) {
    Object.assign(this.thresholds, thresholds);
  }
}

export const costTracker = new CostTracker();