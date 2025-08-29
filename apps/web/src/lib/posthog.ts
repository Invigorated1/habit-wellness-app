import { PostHog } from 'posthog-node';
import posthogClient from 'posthog-js';
import { logger } from './logger';

// Server-side PostHog client - only initialize if key is available
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
export const posthogServer = posthogKey
  ? new PostHog(posthogKey, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      flushAt: 20,
      flushInterval: 10000,
    })
  : null;

// Analytics event types
export const AnalyticsEvents = {
  // User events
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  
  // Habit events
  HABIT_CREATED: 'habit_created',
  HABIT_UPDATED: 'habit_updated',
  HABIT_DELETED: 'habit_deleted',
  HABIT_COMPLETED: 'habit_completed',
  HABIT_UNCOMPLETED: 'habit_uncompleted',
  
  // Streak events
  STREAK_MILESTONE: 'streak_milestone',
  STREAK_BROKEN: 'streak_broken',
  
  // Page views
  PAGE_VIEWED: 'page_viewed',
  
  // API events
  API_ERROR: 'api_error',
  API_SLOW_RESPONSE: 'api_slow_response',
} as const;

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

// Server-side analytics helper
export function trackServerEvent(
  distinctId: string,
  event: AnalyticsEvent,
  properties?: Record<string, any>
) {
  try {
    if (!posthogServer) {
      logger.debug('PostHog not configured, skipping event', { event });
      return;
    }
    
    posthogServer.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
    });
    
    logger.debug('Analytics event tracked', { event, distinctId });
  } catch (error) {
    logger.error('Failed to track analytics event', { error, event });
  }
}

// Identify user for analytics
export function identifyUser(
  userId: string,
  properties?: {
    email?: string;
    name?: string;
    createdAt?: string;
  }
) {
  try {
    if (!posthogServer) {
      return;
    }
    
    posthogServer.identify({
      distinctId: userId,
      properties: {
        ...properties,
        environment: process.env.NODE_ENV,
      },
    });
    
    logger.debug('User identified for analytics', { userId });
  } catch (error) {
    logger.error('Failed to identify user', { error, userId });
  }
}

// Track feature usage
export function trackFeatureUsage(
  userId: string,
  feature: string,
  metadata?: Record<string, any>
) {
  trackServerEvent(userId, 'feature_used' as AnalyticsEvent, {
    feature,
    ...metadata,
  });
}

// Track API performance
export function trackAPIPerformance(
  userId: string,
  endpoint: string,
  duration: number,
  statusCode: number
) {
  const properties = {
    endpoint,
    duration,
    statusCode,
    slow: duration > 1000,
  };
  
  if (duration > 3000) {
    trackServerEvent(userId, AnalyticsEvents.API_SLOW_RESPONSE, properties);
  }
}

// Shutdown analytics on app termination
export async function shutdownAnalytics() {
  if (posthogServer) {
    await posthogServer.shutdown();
  }
}