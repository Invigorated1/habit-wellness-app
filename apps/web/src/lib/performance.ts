import * as Sentry from '@sentry/nextjs';
import React from 'react';

interface PerformanceMetrics {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private metrics: PerformanceMetrics[] = [];

  // Start measuring
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  // End measuring and record
  measure(name: string, metadata?: Record<string, any>): PerformanceMetrics | null {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No mark found for ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetrics = {
      name,
      duration,
      startTime,
      endTime,
      metadata,
    };

    this.metrics.push(metric);
    this.marks.delete(name);

    // Send to Sentry if duration exceeds threshold
    if (duration > 1000) {
      Sentry.captureMessage(`Slow operation: ${name}`, {
        level: 'warning',
        extra: metric,
      });
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`, metadata);
    }

    return metric;
  }

  // Get all metrics
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  // Clear metrics
  clear(): void {
    this.marks.clear();
    this.metrics = [];
  }

  // Report metrics to analytics
  report(): void {
    const metrics = this.getMetrics();
    if (metrics.length === 0) return;

    // Group by operation name
    const grouped = metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = {
          count: 0,
          totalDuration: 0,
          avgDuration: 0,
          minDuration: Infinity,
          maxDuration: 0,
        };
      }

      const group = acc[metric.name];
      group.count++;
      group.totalDuration += metric.duration;
      group.minDuration = Math.min(group.minDuration, metric.duration);
      group.maxDuration = Math.max(group.maxDuration, metric.duration);
      group.avgDuration = group.totalDuration / group.count;

      return acc;
    }, {} as Record<string, any>);

    // Send to Sentry
    Sentry.captureMessage('Performance Report', {
      level: 'info',
      extra: { metrics: grouped },
    });

    this.clear();
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

// Utility functions
export function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  perfMonitor.mark(name);
  
  return fn()
    .then(result => {
      perfMonitor.measure(name, { ...metadata, status: 'success' });
      return result;
    })
    .catch(error => {
      perfMonitor.measure(name, { ...metadata, status: 'error', error: error.message });
      throw error;
    });
}

export function measureSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  perfMonitor.mark(name);
  
  try {
    const result = fn();
    perfMonitor.measure(name, { ...metadata, status: 'success' });
    return result;
  } catch (error) {
    perfMonitor.measure(name, { 
      ...metadata, 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

// React hook for component render performance
export function useRenderPerformance(componentName: string) {
  const renderCount = React.useRef(0);
  const renderStart = React.useRef(0);

  React.useEffect(() => {
    renderCount.current++;
    renderStart.current = performance.now();
    
    return () => {
      const renderDuration = performance.now() - renderStart.current;
      
      if (renderDuration > 16.67) { // More than one frame (60fps)
        console.warn(`[Performance] Slow render in ${componentName}: ${renderDuration.toFixed(2)}ms`);
      }
      
      if (renderCount.current > 10) {
        console.warn(`[Performance] Excessive re-renders in ${componentName}: ${renderCount.current} renders`);
      }
    };
  });
}

// Web Vitals monitoring
export function reportWebVitals(metric: any) {
  const { name, value, id } = metric;
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${name}: ${value}`);
  }
  
  // Send to Sentry
  Sentry.captureMessage(`Web Vital: ${name}`, {
    level: 'info',
    extra: {
      metric: name,
      value,
      id,
    },
  });
  
  // Define thresholds
  const thresholds: Record<string, number> = {
    FCP: 1800, // First Contentful Paint
    LCP: 2500, // Largest Contentful Paint  
    CLS: 0.1,  // Cumulative Layout Shift
    FID: 100,  // First Input Delay
    TTFB: 800, // Time to First Byte
  };
  
  // Alert if threshold exceeded
  if (thresholds[name] && value > thresholds[name]) {
    Sentry.captureMessage(`Poor Web Vital: ${name}`, {
      level: 'warning',
      extra: {
        metric: name,
        value,
        threshold: thresholds[name],
        exceeded: value - thresholds[name],
      },
    });
  }
}