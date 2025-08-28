import { NextResponse } from 'next/server';
import { logger } from './logger';
import { AppError } from './errors';
import { ZodError } from 'zod';
import { withRateLimit } from './rate-limit';
import { auth } from '@clerk/nextjs/server';

type Handler = (...args: any[]) => Promise<NextResponse>;

interface HandlerOptions {
  rateLimit?: boolean;
  requireAuth?: boolean;
}

/**
 * Wraps API route handlers with error handling, logging, and optional rate limiting
 */
export function withErrorHandler(handler: Handler, options: HandlerOptions = {}): Handler {
  const { rateLimit = true, requireAuth = true } = options;
  
  return async (...args: any[]) => {
    const request = args[0] as Request;
    
    try {
      // Rate limiting
      if (rateLimit) {
        const { userId } = await auth();
        const identifier = userId || request.headers.get('x-forwarded-for') || 'anonymous';
        const { success, headers } = await withRateLimit(request, identifier);
        
        if (!success) {
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { 
              status: 429,
              headers,
            }
          );
        }
      }
      
      const result = await handler(...args);
      return result;
    } catch (error) {
      // Log the error
      logger.error('API Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        path: args[0]?.url || 'unknown',
      });

      // Handle known errors
      if (error instanceof AppError) {
        return NextResponse.json(
          { 
            error: error.message,
            statusCode: error.statusCode,
          },
          { status: error.statusCode }
        );
      }

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
            statusCode: 400,
          },
          { status: 400 }
        );
      }

      // Handle Prisma errors
      if (error instanceof Error && error.message.includes('P2002')) {
        return NextResponse.json(
          { 
            error: 'A record with this data already exists',
            statusCode: 409,
          },
          { status: 409 }
        );
      }

      // Default error response
      return NextResponse.json(
        { 
          error: 'Internal server error',
          statusCode: 500,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Standard API response format
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}