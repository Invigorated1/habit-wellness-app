/**
 * Security configuration for the application
 * Centralizes all security-related settings
 */

export const securityConfig = {
  // Environment checks
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',

  // Feature flags
  enableTestEndpoints: process.env.ENABLE_TEST_ENDPOINTS === 'true',
  enableDebugLogging: process.env.ENABLE_DEBUG_LOGGING === 'true',
  enableSecurityHeaders: process.env.ENABLE_SECURITY_HEADERS !== 'false',

  // Logging configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  logFullIPs: process.env.LOG_FULL_IPS === 'true',

  // Rate limiting
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    window: parseInt(process.env.RATE_LIMIT_WINDOW || '60', 10) * 1000, // Convert to ms
  },

  // Session configuration
  session: {
    // Use secure cookies in production
    secure: process.env.NODE_ENV === 'production',
    // SameSite configuration
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    // HttpOnly cookies (always true for security)
    httpOnly: true,
  },

  // CORS configuration
  cors: {
    // In production, be explicit about allowed origins
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.ALLOWED_ORIGINS?.split(',') || ['https://habitstory.app'])
      : true, // Allow all in development
    credentials: true,
  },

  // Content Security Policy
  csp: {
    reportOnly: process.env.CSP_REPORT_ONLY === 'true',
    reportUri: '/api/csp-report',
  },

  // Data retention
  dataRetention: {
    // Days to keep verification media
    verificationMediaDays: parseInt(process.env.VERIFICATION_RETENTION_DAYS || '30', 10),
    // Days to keep logs
    logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '90', 10),
  },

  // API Security
  api: {
    // Require API keys for certain endpoints
    requireApiKey: process.env.REQUIRE_API_KEY === 'true',
    // API key header name
    apiKeyHeader: 'x-api-key',
  },
} as const;

// Type-safe security config
export type SecurityConfig = typeof securityConfig;