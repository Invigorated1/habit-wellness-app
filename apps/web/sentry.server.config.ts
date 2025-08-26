import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  environment: process.env.NODE_ENV,
  
  // Integrations
  integrations: [
    // Automatically instrument Node.js libraries
    Sentry.prismaIntegration(),
  ],
  
  // Filtering
  beforeSend(event, hint) {
    // Filter out health check requests
    if (event.request?.url?.includes('/api/health')) {
      return null;
    }
    
    // Remove sensitive data
    if (event.request?.data) {
      // Remove passwords and tokens
      const data = event.request.data;
      if (typeof data === 'object') {
        for (const key in data) {
          if (key.toLowerCase().includes('password') || 
              key.toLowerCase().includes('token') ||
              key.toLowerCase().includes('secret')) {
            data[key] = '[Filtered]';
          }
        }
      }
    }
    
    return event;
  },
  
  // Capture console errors
  beforeBreadcrumb(breadcrumb) {
    // Filter out noisy console logs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null;
    }
    return breadcrumb;
  },
});