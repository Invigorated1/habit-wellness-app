import { logger } from './logger';

interface PerformanceMetrics {
  route: string;
  duration: number;
  timestamp: number;
  memoryUsage?: NodeJS.MemoryUsage;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000;
  private readonly reportInterval = 60000; // 1 minute

  constructor() {
    // Report metrics periodically
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => this.reportMetrics(), this.reportInterval);
    }
  }

  recordMetric(route: string, duration: number) {
    const metric: PerformanceMetrics = {
      route,
      duration,
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow requests immediately
    if (duration > 1000) {
      logger.warn('Slow API request detected', {
        route,
        duration,
        memoryUsage: metric.memoryUsage,
      });
    }
  }

  getMetricsSummary() {
    if (this.metrics.length === 0) {
      return null;
    }

    const now = Date.now();
    const recentMetrics = this.metrics.filter(
      m => now - m.timestamp < this.reportInterval
    );

    if (recentMetrics.length === 0) {
      return null;
    }

    // Group by route
    const routeMetrics = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.route]) {
        acc[metric.route] = [];
      }
      acc[metric.route].push(metric.duration);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics per route
    const summary = Object.entries(routeMetrics).map(([route, durations]) => {
      const sorted = durations.sort((a, b) => a - b);
      const sum = durations.reduce((a, b) => a + b, 0);
      
      return {
        route,
        count: durations.length,
        avg: Math.round(sum / durations.length),
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    });

    // Overall memory usage
    const latestMemory = recentMetrics[recentMetrics.length - 1]?.memoryUsage;

    return {
      period: `${this.reportInterval / 1000}s`,
      totalRequests: recentMetrics.length,
      routes: summary,
      memory: latestMemory ? {
        heapUsed: Math.round(latestMemory.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(latestMemory.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(latestMemory.external / 1024 / 1024) + 'MB',
        rss: Math.round(latestMemory.rss / 1024 / 1024) + 'MB',
      } : null,
    };
  }

  private reportMetrics() {
    const summary = this.getMetricsSummary();
    if (summary) {
      logger.info('Performance metrics summary', summary);
    }
  }

  // Get current performance stats for monitoring endpoint
  getCurrentStats() {
    const summary = this.getMetricsSummary();
    const uptime = process.uptime();
    const memory = process.memoryUsage();

    return {
      uptime: {
        seconds: Math.floor(uptime),
        formatted: this.formatUptime(uptime),
      },
      memory: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(memory.external / 1024 / 1024) + 'MB',
        rss: Math.round(memory.rss / 1024 / 1024) + 'MB',
      },
      metrics: summary,
      timestamp: new Date().toISOString(),
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Middleware to track performance metrics
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  routeName?: string
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    const request = args[0] as Request;
    const url = new URL(request.url);
    const route = routeName || url.pathname;

    try {
      const response = await handler(...args);
      const duration = Date.now() - startTime;
      
      performanceMonitor.recordMetric(route, duration);
      
      // Add performance headers
      const headers = new Headers(response.headers);
      headers.set('X-Response-Time', `${duration}ms`);
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      performanceMonitor.recordMetric(route, duration);
      throw error;
    }
  }) as T;
}