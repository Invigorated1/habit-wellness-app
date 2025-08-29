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
 * Extracts relevant information from a request for logging
 */
export function extractRequestInfo(request: NextRequest): RequestLogContext {
  const url = new URL(request.url);
  const headers: Record<string, string> = {};
  
  // Extract important headers
  const importantHeaders = [
    'content-type',
    'content-length',
    'x-forwarded-for',
    'x-real-ip',
    'user-agent',
  ];
  
  importantHeaders.forEach(header => {
    const value = request.headers.get(header);
    if (value) headers[header] = value;
  });

  // Extract query parameters
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return {
    method: request.method,
    url: url.href,
    path: url.pathname,
    query,
    headers,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        undefined,
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