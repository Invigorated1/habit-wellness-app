import { NextRequest } from 'next/server';
import { logger } from './logger';

interface RequestLogContext {
  method: string;
  url: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

interface ResponseLogContext extends RequestLogContext {
  status: number;
  duration: number;
  error?: string;
}

/**
 * Redacts sensitive information from IP addresses
 * IPv4: 192.168.1.100 -> 192.168.x.x
 * IPv6: 2001:db8:85a3::8a2e:370:7334 -> 2001:db8:xxxx:xxxx:xxxx:xxxx:xxxx
 */
function redactIP(ip: string | null | undefined): string | undefined {
  if (!ip) return undefined;
  
  // Handle multiple IPs (x-forwarded-for can contain a list)
  const firstIP = ip.split(',')[0].trim();
  
  // IPv6
  if (firstIP.includes(':')) {
    const parts = firstIP.split(':');
    if (parts.length > 2) {
      return `${parts[0]}:${parts[1]}:xxxx:xxxx:xxxx:xxxx:xxxx`;
    }
    return 'xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx';
  }
  
  // IPv4
  const parts = firstIP.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.x.x`;
  }
  
  return 'x.x.x.x';
}

/**
 * Extracts relevant information from a request for logging
 */
export function extractRequestInfo(request: NextRequest): RequestLogContext {
  const url = new URL(request.url);
  const headers: Record<string, string> = {};
  
  // Extract important headers (excluding sensitive ones)
  const importantHeaders = [
    'content-type',
    'content-length',
    'user-agent',
  ];
  
  // Only include IP headers if not in production or if explicitly enabled
  if (process.env.NODE_ENV !== 'production' || process.env.LOG_FULL_IPS === 'true') {
    importantHeaders.push('x-forwarded-for', 'x-real-ip');
  }
  
  importantHeaders.forEach(header => {
    const value = request.headers.get(header);
    if (value) headers[header] = value;
  });

  // Extract query parameters (be careful not to log sensitive params)
  const query: Record<string, string> = {};
  const sensitiveParams = ['token', 'password', 'secret', 'key', 'auth'];
  url.searchParams.forEach((value, key) => {
    if (sensitiveParams.some(param => key.toLowerCase().includes(param))) {
      query[key] = '[REDACTED]';
    } else {
      query[key] = value;
    }
  });

  // Get IP for logging (redacted in production)
  const rawIP = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip');
  const ip = process.env.NODE_ENV === 'production' && process.env.LOG_FULL_IPS !== 'true'
    ? redactIP(rawIP)
    : rawIP || undefined;

  return {
    method: request.method,
    url: url.href,
    path: url.pathname,
    query,
    headers,
    userAgent: request.headers.get('user-agent') || undefined,
    ip,
  };
}

/**
 * Logs incoming API requests
 */
export function logRequest(info: RequestLogContext) {
  logger.info('API Request', {
    ...info,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Logs API responses
 */
export function logResponse(info: ResponseLogContext) {
  const level = info.status >= 500 ? 'error' : 
                info.status >= 400 ? 'warn' : 
                'info';
  
  logger[level]('API Response', {
    ...info,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Middleware to log requests and responses
 */
export function withRequestLogging<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    const request = args[0] as NextRequest;
    const requestInfo = extractRequestInfo(request);
    
    // Log the incoming request
    logRequest(requestInfo);
    
    try {
      const response = await handler(...args);
      const duration = Date.now() - startTime;
      
      // Log the response
      logResponse({
        ...requestInfo,
        status: response.status,
        duration,
      });
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error response
      logResponse({
        ...requestInfo,
        status: 500,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }) as T;
}