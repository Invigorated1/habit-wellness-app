import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  
  // Environment
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  
  // Before send hook for server-side
  beforeSend(event, hint) {
    // Add user context if available
    if (!event.user && event.extra?.userId) {
      event.user = {
        id: event.extra.userId as string,
      };
    }
    
    // Filter out non-error events in development
    if (process.env.NODE_ENV === 'development' && event.level !== 'error') {
      return null;
    }
    
    return event;
  },
  
  // Server-specific options
  autoSessionTracking: false,
  
  // Integrations
  integrations: [
    // Prisma integration
    Sentry.prismaIntegration(),
  ],
});