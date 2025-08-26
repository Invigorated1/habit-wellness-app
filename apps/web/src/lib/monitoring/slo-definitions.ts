import * as Sentry from '@sentry/nextjs';

// SLO (Service Level Objective) definitions
export const SLOs = {
  // Availability SLOs
  API_AVAILABILITY: {
    name: 'API Availability',
    target: 99.9, // 99.9% uptime
    window: '30d',
    description: 'Percentage of successful API requests',
    errorBudget: 0.1, // 0.1% allowed errors
    query: 'sum(rate(http_requests_total{status!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))',
  },
  
  // Latency SLOs
  API_LATENCY_P95: {
    name: 'API Latency P95',
    target: 200, // 200ms
    window: '1h',
    description: '95th percentile API response time',
    unit: 'ms',
    query: 'histogram_quantile(0.95, http_request_duration_ms)',
  },
  
  PAGE_LOAD_P75: {
    name: 'Page Load P75',
    target: 2500, // 2.5s
    window: '1h',
    description: '75th percentile page load time',
    unit: 'ms',
    query: 'histogram_quantile(0.75, page_load_duration_ms)',
  },
  
  // Error rate SLOs
  CLIENT_ERROR_RATE: {
    name: 'Client Error Rate',
    target: 0.1, // 0.1% error rate
    window: '1h',
    description: 'Percentage of client-side errors',
    errorBudget: 0.1,
    query: 'sum(rate(client_errors_total[5m])) / sum(rate(page_views_total[5m]))',
  },
  
  // Business SLOs
  HABIT_SYNC_SUCCESS: {
    name: 'Habit Sync Success Rate',
    target: 99.5,
    window: '1h',
    description: 'Percentage of successful habit syncs',
    errorBudget: 0.5,
    query: 'sum(rate(habit_sync_success[5m])) / sum(rate(habit_sync_total[5m]))',
  },
  
  NOTIFICATION_DELIVERY: {
    name: 'Notification Delivery Rate',
    target: 95,
    window: '24h',
    description: 'Percentage of notifications delivered',
    errorBudget: 5,
    query: 'sum(rate(notifications_delivered[5m])) / sum(rate(notifications_sent[5m]))',
  },
} as const;

export type SLOKey = keyof typeof SLOs;

// Error budget tracking
interface ErrorBudgetStatus {
  slo: string;
  consumed: number; // Percentage of error budget consumed
  remaining: number; // Percentage remaining
  burnRate: number; // Current burn rate
  timeToExhaustion: number | null; // Hours until budget exhausted at current rate
}

// Alert thresholds
export const AlertThresholds = {
  ERROR_BUDGET_WARNING: 50, // Warn when 50% consumed
  ERROR_BUDGET_CRITICAL: 80, // Critical when 80% consumed
  BURN_RATE_HIGH: 2, // Alert when burning 2x faster than sustainable
  LATENCY_SPIKE: 1.5, // Alert when latency is 1.5x normal
} as const;

// Monitoring service
class MonitoringService {
  private metrics: Map<string, number[]> = new Map();
  private errorBudgets: Map<SLOKey, ErrorBudgetStatus> = new Map();
  
  // Record a metric value
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    // Store in local buffer
    const key = this.getMetricKey(name, tags);
    const values = this.metrics.get(key) || [];
    values.push(value);
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
    
    this.metrics.set(key, values);
    
    // Check SLO violations
    this.checkSLOViolations(name, value);
    
    // Send to monitoring backend
    if (process.env.NODE_ENV === 'production') {
      this.sendToBackend(name, value, tags);
    }
  }
  
  // Check if metric violates SLO
  private checkSLOViolations(metric: string, value: number) {
    Object.entries(SLOs).forEach(([key, slo]) => {
      if (this.metricMatchesSLO(metric, slo)) {
        const violation = this.isViolation(slo, value);
        
        if (violation) {
          this.handleSLOViolation(key as SLOKey, slo, value);
        }
        
        // Update error budget
        this.updateErrorBudget(key as SLOKey, violation);
      }
    });
  }
  
  private isViolation(slo: typeof SLOs[SLOKey], value: number): boolean {
    if ('errorBudget' in slo) {
      // For percentage-based SLOs
      return value > slo.errorBudget;
    } else {
      // For threshold-based SLOs (like latency)
      return value > slo.target;
    }
  }
  
  private handleSLOViolation(
    key: SLOKey,
    slo: typeof SLOs[SLOKey],
    value: number
  ) {
    const severity = this.getSeverity(key, value);
    
    // Log to Sentry
    Sentry.captureMessage(`SLO Violation: ${slo.name}`, {
      level: severity,
      extra: {
        slo: slo.name,
        target: slo.target,
        actual: value,
        window: slo.window,
      },
    });
    
    // Trigger alerts based on severity
    if (severity === 'error' || severity === 'fatal') {
      this.triggerAlert(key, slo, value, severity);
    }
  }
  
  private getSeverity(
    key: SLOKey,
    value: number
  ): Sentry.SeverityLevel {
    const budget = this.errorBudgets.get(key);
    
    if (!budget) return 'warning';
    
    if (budget.consumed >= AlertThresholds.ERROR_BUDGET_CRITICAL) {
      return 'fatal';
    } else if (budget.consumed >= AlertThresholds.ERROR_BUDGET_WARNING) {
      return 'error';
    } else if (budget.burnRate >= AlertThresholds.BURN_RATE_HIGH) {
      return 'warning';
    }
    
    return 'info';
  }
  
  private updateErrorBudget(key: SLOKey, violation: boolean) {
    const current = this.errorBudgets.get(key) || {
      slo: SLOs[key].name,
      consumed: 0,
      remaining: 100,
      burnRate: 0,
      timeToExhaustion: null,
    };
    
    // Simple error budget calculation (should be more sophisticated in production)
    if (violation) {
      current.consumed = Math.min(100, current.consumed + 0.1);
      current.remaining = 100 - current.consumed;
    }
    
    // Calculate burn rate (violations per hour)
    const recentViolations = this.getRecentViolations(key);
    current.burnRate = recentViolations.length / 1; // per hour
    
    // Calculate time to exhaustion
    if (current.burnRate > 0) {
      current.timeToExhaustion = current.remaining / current.burnRate;
    }
    
    this.errorBudgets.set(key, current);
  }
  
  private getRecentViolations(key: SLOKey): number[] {
    // In a real implementation, this would query from a time-series DB
    return [];
  }
  
  private triggerAlert(
    key: SLOKey,
    slo: typeof SLOs[SLOKey],
    value: number,
    severity: string
  ) {
    // In production, this would integrate with PagerDuty, Slack, etc.
    console.error(`[ALERT] ${severity.toUpperCase()}: ${slo.name} violation`, {
      slo: slo.name,
      target: slo.target,
      actual: value,
      severity,
    });
  }
  
  private metricMatchesSLO(metric: string, slo: typeof SLOs[SLOKey]): boolean {
    // Simple matching - in production would be more sophisticated
    return metric.toLowerCase().includes(slo.name.toLowerCase().replace(/\s+/g, '_'));
  }
  
  private getMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags) return name;
    
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    
    return `${name}{${tagStr}}`;
  }
  
  private sendToBackend(name: string, value: number, tags?: Record<string, string>) {
    // Send to metrics backend (Prometheus, DataDog, etc.)
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: name,
        value,
        tags,
        timestamp: Date.now(),
      }),
    }).catch(error => {
      console.error('Failed to send metrics:', error);
    });
  }
  
  // Get current SLO status
  getSLOStatus(): Record<SLOKey, ErrorBudgetStatus> {
    const status: Record<string, ErrorBudgetStatus> = {};
    
    (Object.keys(SLOs) as SLOKey[]).forEach(key => {
      status[key] = this.errorBudgets.get(key) || {
        slo: SLOs[key].name,
        consumed: 0,
        remaining: 100,
        burnRate: 0,
        timeToExhaustion: null,
      };
    });
    
    return status as Record<SLOKey, ErrorBudgetStatus>;
  }
  
  // Health check endpoint data
  getHealthStatus() {
    const sloStatus = this.getSLOStatus();
    const violations = Object.entries(sloStatus).filter(
      ([_, status]) => status.consumed > AlertThresholds.ERROR_BUDGET_WARNING
    );
    
    return {
      status: violations.length === 0 ? 'healthy' : 'degraded',
      slos: sloStatus,
      violations: violations.map(([key, status]) => ({
        slo: key,
        ...status,
      })),
      timestamp: new Date().toISOString(),
    };
  }
}

export const monitoring = new MonitoringService();

// React hook for monitoring
import { useEffect } from 'react';

export function useMetric(name: string, value: number, tags?: Record<string, string>) {
  useEffect(() => {
    monitoring.recordMetric(name, value, tags);
  }, [name, value, tags]);
}

// Express middleware for recording HTTP metrics
export function httpMetricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route?.path || 'unknown';
    
    monitoring.recordMetric('http_request_duration_ms', duration, {
      method: req.method,
      route,
      status: res.statusCode.toString(),
    });
    
    monitoring.recordMetric('http_requests_total', 1, {
      method: req.method,
      route,
      status: res.statusCode.toString(),
    });
  });
  
  next();
}