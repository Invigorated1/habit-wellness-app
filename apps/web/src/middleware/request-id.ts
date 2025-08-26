import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export function withRequestId(request: NextRequest) {
  // Get or generate request ID
  const requestId = request.headers.get('x-request-id') || 
    request.headers.get('cf-ray') || // Cloudflare Ray ID
    request.headers.get('x-vercel-id') || // Vercel request ID
    crypto.randomUUID();

  // Create response with request ID header
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });
  
  response.headers.set('x-request-id', requestId);

  // Log request
  const startTime = Date.now();
  const method = request.method;
  const url = request.url;
  const userId = request.headers.get('x-user-id');

  logger.info('Incoming request', {
    requestId,
    method,
    url,
    userId,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
  });

  // Add timing header
  response.headers.set('x-response-time', `${Date.now() - startTime}ms`);

  return { response, requestId };
}