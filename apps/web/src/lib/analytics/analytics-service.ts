import posthog from 'posthog-js';
import * as Sentry from '@sentry/nextjs';
import { 
  AllEvents, 
  analyticsEventSchema,
  UserProperties,
  HabitProperties,
  SessionProperties,
  UserEvents,
  HabitEvents,
  EngagementEvents,
} from '@habit-app/shared/src/analytics/events';

interface AnalyticsContext {
  userId?: string;
  sessionId?: string;
  platform: 'web' | 'ios' | 'android';
}

class AnalyticsService {
  private context: AnalyticsContext = { platform: 'web' };
  private sessionStartTime: number = Date.now();
  private pageViewCount: number = 0;
  private actionCount: number = 0;
  private eventBuffer: any[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeSession();
      this.setupFlushInterval();
      this.trackPageViews();
    }
  }

  private initializeSession() {
    this.context.sessionId = this.generateSessionId();
    this.trackEvent(EngagementEvents.SESSION_STARTED, {
      session_id: this.context.sessionId,
    });

    // Track session end on page unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent(EngagementEvents.SESSION_ENDED, {
        session_id: this.context.sessionId,
        duration_ms: Date.now() - this.sessionStartTime,
        page_views: this.pageViewCount,
        actions_count: this.actionCount,
      });
      this.flush();
    });
  }

  private setupFlushInterval() {
    // Flush events every 30 seconds
    this.flushInterval = setInterval(() => this.flush(), 30000);
  }

  private trackPageViews() {
    // Will be called by the router/navigation
    this.pageViewCount++;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setUser(userId: string, properties?: Partial<UserProperties>) {
    this.context.userId = userId;
    
    if (typeof window !== 'undefined') {
      posthog.identify(userId, properties);
      Sentry.setUser({ id: userId, ...properties });
    }
  }

  clearUser() {
    this.context.userId = undefined;
    
    if (typeof window !== 'undefined') {
      posthog.reset();
      Sentry.setUser(null);
    }
  }

  trackEvent(
    eventName: string,
    properties?: Record<string, any>,
    options?: { immediate?: boolean }
  ) {
    try {
      // Validate event name
      if (!Object.values(AllEvents).includes(eventName as any)) {
        console.warn(`Unknown event: ${eventName}`);
        if (process.env.NODE_ENV === 'development') {
          throw new Error(`Event ${eventName} not in taxonomy`);
        }
      }

      const event = {
        event: eventName,
        user_id: this.context.userId,
        session_id: this.context.sessionId,
        timestamp: new Date().toISOString(),
        properties: {
          ...properties,
          platform: this.context.platform,
        },
        context: this.getContext(),
      };

      // Validate event schema
      const validation = analyticsEventSchema.safeParse(event);
      if (!validation.success) {
        console.error('Invalid event schema:', validation.error);
        Sentry.captureException(new Error('Invalid analytics event'), {
          extra: { event, errors: validation.error.errors },
        });
        return;
      }

      // Add to buffer
      this.eventBuffer.push(event);
      this.actionCount++;

      // Send immediately if requested or buffer is full
      if (options?.immediate || this.eventBuffer.length >= 50) {
        this.flush();
      }

      // Also send to PostHog for real-time
      if (typeof window !== 'undefined') {
        posthog.capture(eventName, properties);
      }
    } catch (error) {
      console.error('Failed to track event:', error);
      Sentry.captureException(error);
    }
  }

  // Specialized tracking methods with proper typing
  trackUserLifecycle(event: keyof typeof UserEvents, properties?: Partial<UserProperties>) {
    this.trackEvent(UserEvents[event], properties);
  }

  trackHabitAction(event: keyof typeof HabitEvents, properties: HabitProperties) {
    this.trackEvent(HabitEvents[event], properties);

    // Check for milestones
    if (event === 'COMPLETED' && properties.streak > 0) {
      const milestones = [7, 30, 60, 90, 100, 365];
      if (milestones.includes(properties.streak)) {
        this.trackEvent(HabitEvents.STREAK_MILESTONE, {
          ...properties,
          milestone: properties.streak,
        });
      }
    }
  }

  trackEngagement(event: keyof typeof EngagementEvents, properties?: Record<string, any>) {
    this.trackEvent(EngagementEvents[event], properties);
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, tags?: Record<string, string>) {
    this.trackEvent('performance.metric', {
      metric_name: metric,
      value,
      unit: 'ms',
      ...tags,
    });

    // Send to Sentry for monitoring
    if (value > 1000) {
      Sentry.captureMessage(`Slow ${metric}: ${value}ms`, {
        level: 'warning',
        extra: { metric, value, tags },
      });
    }
  }

  // Get current context
  private getContext() {
    if (typeof window === 'undefined') return {};

    return {
      page: {
        path: window.location.pathname,
        title: document.title,
        url: window.location.href,
      },
      device: {
        type: this.getDeviceType(),
        os: navigator.platform,
        browser: navigator.userAgent,
      },
      campaign: this.getCampaignParams(),
    };
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getCampaignParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source') || undefined,
      medium: params.get('utm_medium') || undefined,
      name: params.get('utm_campaign') || undefined,
    };
  }

  // Flush event buffer
  private flush() {
    if (this.eventBuffer.length === 0) return;

    // In production, send to your analytics backend
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: this.eventBuffer }),
      }).catch(error => {
        console.error('Failed to send analytics:', error);
        Sentry.captureException(error);
      });
    } else {
      console.log('[Analytics] Flushing events:', this.eventBuffer);
    }

    this.eventBuffer = [];
  }

  // Feature flag integration
  isFeatureEnabled(flag: string): boolean {
    return posthog.isFeatureEnabled(flag) || false;
  }

  getFeatureFlags(): Record<string, boolean | string> {
    return posthog.getFeatureFlags() as Record<string, boolean | string>;
  }

  // A/B testing
  getExperiment(experimentKey: string): string | null {
    const variant = posthog.getFeatureFlag(experimentKey);
    if (variant) {
      this.trackEvent('experiment.viewed', {
        experiment_key: experimentKey,
        variant: variant,
      });
    }
    return variant as string | null;
  }

  // Cleanup
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();