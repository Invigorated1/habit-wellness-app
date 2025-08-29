import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security headers to protect against common attacks
 */
const securityHeaders = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable browser XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  
  // Strict Transport Security (HSTS)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Content Security Policy
  'Content-Security-Policy': generateCSP(),
};

/**
 * Generate Content Security Policy directives
 */
function generateCSP(): string {
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Next.js requires this for now
      "'unsafe-eval'", // Required for development
      'https://clerk.com',
      'https://*.clerk.com',
      'https://challenges.cloudflare.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind/emotion
      'https://fonts.googleapis.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:',
    ],
    'connect-src': [
      "'self'",
      'https://clerk.com',
      'https://*.clerk.com',
      'https://api.clerk.com',
      'wss://*.clerk.com',
      process.env.NODE_ENV === 'development' ? 'ws://localhost:*' : '',
    ].filter(Boolean),
    'frame-src': [
      "'self'",
      'https://challenges.cloudflare.com',
      'https://clerk.com',
      'https://*.clerk.com',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  };

  // In production, remove unsafe-eval
  if (process.env.NODE_ENV === 'production') {
    directives['script-src'] = directives['script-src'].filter(
      src => src !== "'unsafe-eval'"
    );
  }

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Security middleware
 */
export function securityMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  
  // Apply security headers
  applySecurityHeaders(response);
  
  // Additional security checks can go here
  // e.g., rate limiting, IP blocking, etc.
  
  return response;
}