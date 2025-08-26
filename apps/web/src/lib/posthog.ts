import posthog from 'posthog-js';
import { PostHogConfig } from 'posthog-js';

export const initPostHog = () => {
  if (typeof window === 'undefined') return;
  
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
  
  if (!posthogKey) {
    console.warn('PostHog key not found, analytics disabled');
    return;
  }

  const config: Partial<PostHogConfig> = {
    api_host: posthogHost,
    
    // Privacy settings
    autocapture: false, // We'll manually track events
    capture_pageview: false, // We'll manually track page views
    disable_session_recording: process.env.NODE_ENV === 'development',
    
    // Performance
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        // Disable in development
        posthog.opt_out_capturing();
      }
    },
    
    // Feature flags
    bootstrap: {
      featureFlags: {},
    },
  };

  posthog.init(posthogKey, config);
};

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
  
  // Feature usage
  FEATURE_USED: 'feature_used',
} as const;

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

// Helper functions
export const trackEvent = (
  event: AnalyticsEvent,
  properties?: Record<string, any>
) => {
  if (typeof window === 'undefined') return;
  
  // Add common properties
  const enrichedProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };
  
  posthog.capture(event, enrichedProperties);
};

export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  trackEvent(AnalyticsEvents.PAGE_VIEWED, {
    page_name: pageName,
    page_url: window.location.href,
    page_path: window.location.pathname,
    ...properties,
  });
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (typeof window === 'undefined') return;
  
  posthog.identify(userId, {
    ...traits,
    identified_at: new Date().toISOString(),
  });
};

export const resetUser = () => {
  if (typeof window === 'undefined') return;
  posthog.reset();
};

export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window === 'undefined') return;
  posthog.people.set(properties);
};

// Feature flag helpers
export const isFeatureEnabled = (flagName: string): boolean => {
  if (typeof window === 'undefined') return false;
  return posthog.isFeatureEnabled(flagName) || false;
};

export const getFeatureFlagPayload = (flagName: string): any => {
  if (typeof window === 'undefined') return null;
  return posthog.getFeatureFlagPayload(flagName);
};

// Opt out helpers
export const optOut = () => {
  if (typeof window === 'undefined') return;
  posthog.opt_out_capturing();
};

export const optIn = () => {
  if (typeof window === 'undefined') return;
  posthog.opt_in_capturing();
};

export const hasOptedOut = (): boolean => {
  if (typeof window === 'undefined') return true;
  return posthog.has_opted_out_capturing();
};