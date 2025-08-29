import { redis } from '../redis';
import { logger } from '../logger';

// Service Level Indicators (SLIs)
export interface SLI {
  name: string;
  value: number;
  target: number;
  unit: string;
  period: string;
}

// SLI Keys
const SLI_KEYS = {
  AVAILABILITY: 'sli:availability',
  LATENCY_P99: 'sli:latency:p99',
  LATENCY_P95: 'sli:latency:p95',
  ERROR_RATE: 'sli:error_rate',
  APDEX: 'sli:apdex', // Application Performance Index
} as const;

// SLI Calculator
export class SLICalculator {
  private readonly windowSize = 300; // 5 minutes in seconds
  
  async recordRequest(
    endpoint: string,
    duration: number,
    success: boolean,
    statusCode: number
  ) {
    const timestamp = Math.floor(Date.now() / 1000);
    const minute = Math.floor(timestamp / 60) * 60;
    
    try {
      // Record in Redis with expiry
      const pipeline = redis.pipeline();
      
      // Total requests counter
      pipeline.hincrby(`metrics:${minute}:requests`, endpoint, 1);
      
      // Success/failure counters
      if (success) {
        pipeline.hincrby(`metrics:${minute}:success`, endpoint, 1);
      } else {
        pipeline.hincrby(`metrics:${minute}:errors`, endpoint, 1);
        pipeline.hincrby(`metrics:${minute}:errors:${statusCode}`, endpoint, 1);
      }
      
      // Latency buckets for percentile calculation
      const bucket = this.getLatencyBucket(duration);
      pipeline.hincrby(`metrics:${minute}:latency:${bucket}`, endpoint, 1);
      
      // Set expiry
      pipeline.expire(`metrics:${minute}:requests`, 3600); // 1 hour
      pipeline.expire(`metrics:${minute}:success`, 3600);
      pipeline.expire(`metrics:${minute}:errors`, 3600);
      pipeline.expire(`metrics:${minute}:errors:${statusCode}`, 3600);
      pipeline.expire(`metrics:${minute}:latency:${bucket}`, 3600);
      
      await pipeline.exec();
      
      // Update real-time SLIs
      await this.updateSLIs();
    } catch (error) {
      logger.error('Failed to record metrics', { error });
    }
  }
  
  private getLatencyBucket(duration: number): string {
    if (duration < 100) return '0-100';
    if (duration < 300) return '100-300';
    if (duration < 500) return '300-500';
    if (duration < 1000) return '500-1000';
    if (duration < 3000) return '1000-3000';
    return '3000+';
  }
  
  async updateSLIs() {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - this.windowSize;
    
    try {
      // Calculate availability (success rate)
      const availability = await this.calculateAvailability(windowStart, now);
      await redis.set(SLI_KEYS.AVAILABILITY, availability, { ex: 60 });
      
      // Calculate latency percentiles
      const { p95, p99 } = await this.calculateLatencyPercentiles(windowStart, now);
      await redis.set(SLI_KEYS.LATENCY_P95, p95, { ex: 60 });
      await redis.set(SLI_KEYS.LATENCY_P99, p99, { ex: 60 });
      
      // Calculate error rate
      const errorRate = await this.calculateErrorRate(windowStart, now);
      await redis.set(SLI_KEYS.ERROR_RATE, errorRate, { ex: 60 });
      
      // Calculate Apdex score
      const apdex = await this.calculateApdex(windowStart, now);
      await redis.set(SLI_KEYS.APDEX, apdex, { ex: 60 });
    } catch (error) {
      logger.error('Failed to update SLIs', { error });
    }
  }
  
  private async calculateAvailability(startTime: number, endTime: number): Promise<number> {
    let totalRequests = 0;
    let successfulRequests = 0;
    
    for (let time = startTime; time <= endTime; time += 60) {
      const minute = Math.floor(time / 60) * 60;
      const [requests, success] = await Promise.all([
        redis.hvals(`metrics:${minute}:requests`),
        redis.hvals(`metrics:${minute}:success`),
      ]);
      
      totalRequests += requests.reduce((sum, val) => sum + Number(val), 0);
      successfulRequests += success.reduce((sum, val) => sum + Number(val), 0);
    }
    
    return totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
  }
  
  private async calculateLatencyPercentiles(
    startTime: number,
    endTime: number
  ): Promise<{ p95: number; p99: number }> {
    const buckets = {
      '0-100': 0,
      '100-300': 0,
      '300-500': 0,
      '500-1000': 0,
      '1000-3000': 0,
      '3000+': 0,
    };
    
    for (let time = startTime; time <= endTime; time += 60) {
      const minute = Math.floor(time / 60) * 60;
      
      for (const bucket of Object.keys(buckets)) {
        const values = await redis.hvals(`metrics:${minute}:latency:${bucket}`);
        buckets[bucket as keyof typeof buckets] += values.reduce(
          (sum, val) => sum + Number(val),
          0
        );
      }
    }
    
    // Calculate percentiles from buckets
    const total = Object.values(buckets).reduce((sum, val) => sum + val, 0);
    if (total === 0) return { p95: 0, p99: 0 };
    
    let cumulative = 0;
    let p95 = 0;
    let p99 = 0;
    
    for (const [bucket, count] of Object.entries(buckets)) {
      cumulative += count;
      const percentage = (cumulative / total) * 100;
      
      if (percentage >= 95 && p95 === 0) {
        p95 = this.getBucketMidpoint(bucket);
      }
      if (percentage >= 99 && p99 === 0) {
        p99 = this.getBucketMidpoint(bucket);
      }
    }
    
    return { p95, p99 };
  }
  
  private getBucketMidpoint(bucket: string): number {
    const bucketMap: Record<string, number> = {
      '0-100': 50,
      '100-300': 200,
      '300-500': 400,
      '500-1000': 750,
      '1000-3000': 2000,
      '3000+': 5000,
    };
    return bucketMap[bucket] || 0;
  }
  
  private async calculateErrorRate(startTime: number, endTime: number): Promise<number> {
    let totalRequests = 0;
    let errorRequests = 0;
    
    for (let time = startTime; time <= endTime; time += 60) {
      const minute = Math.floor(time / 60) * 60;
      const [requests, errors] = await Promise.all([
        redis.hvals(`metrics:${minute}:requests`),
        redis.hvals(`metrics:${minute}:errors`),
      ]);
      
      totalRequests += requests.reduce((sum, val) => sum + Number(val), 0);
      errorRequests += errors.reduce((sum, val) => sum + Number(val), 0);
    }
    
    return totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
  }
  
  private async calculateApdex(startTime: number, endTime: number): Promise<number> {
    // Apdex = (Satisfied + Tolerating/2) / Total
    // Satisfied: < 500ms, Tolerating: 500-2000ms, Frustrated: > 2000ms
    let satisfied = 0;
    let tolerating = 0;
    let total = 0;
    
    for (let time = startTime; time <= endTime; time += 60) {
      const minute = Math.floor(time / 60) * 60;
      
      const [fast1, fast2, medium1, medium2, slow] = await Promise.all([
        redis.hvals(`metrics:${minute}:latency:0-100`),
        redis.hvals(`metrics:${minute}:latency:100-300`),
        redis.hvals(`metrics:${minute}:latency:300-500`),
        redis.hvals(`metrics:${minute}:latency:500-1000`),
        redis.hvals(`metrics:${minute}:latency:1000-3000`),
      ]);
      
      satisfied += [...fast1, ...fast2, ...medium1].reduce(
        (sum, val) => sum + Number(val),
        0
      );
      tolerating += [...medium2, ...slow].reduce((sum, val) => sum + Number(val), 0);
      
      const allBuckets = await Promise.all(
        Object.keys(this.getBucketMidpoint).map(bucket =>
          redis.hvals(`metrics:${minute}:latency:${bucket}`)
        )
      );
      
      total += allBuckets.flat().reduce((sum, val) => sum + Number(val), 0);
    }
    
    return total > 0 ? ((satisfied + tolerating / 2) / total) : 1;
  }
  
  async getCurrentSLIs(): Promise<SLI[]> {
    const [availability, p95, p99, errorRate, apdex] = await Promise.all([
      redis.get(SLI_KEYS.AVAILABILITY),
      redis.get(SLI_KEYS.LATENCY_P95),
      redis.get(SLI_KEYS.LATENCY_P99),
      redis.get(SLI_KEYS.ERROR_RATE),
      redis.get(SLI_KEYS.APDEX),
    ]);
    
    return [
      {
        name: 'Availability',
        value: Number(availability) || 100,
        target: 99.9,
        unit: '%',
        period: '5m',
      },
      {
        name: 'Latency P95',
        value: Number(p95) || 0,
        target: 500,
        unit: 'ms',
        period: '5m',
      },
      {
        name: 'Latency P99',
        value: Number(p99) || 0,
        target: 1000,
        unit: 'ms',
        period: '5m',
      },
      {
        name: 'Error Rate',
        value: Number(errorRate) || 0,
        target: 0.1,
        unit: '%',
        period: '5m',
      },
      {
        name: 'Apdex Score',
        value: Number(apdex) || 1,
        target: 0.95,
        unit: '',
        period: '5m',
      },
    ];
  }
}

export const sliCalculator = new SLICalculator();