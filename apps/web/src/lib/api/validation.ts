import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Constants
const MAX_REQUEST_SIZE = 10 * 1024; // 10KB
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [];

// Error response helper
export function errorResponse(
  message: string,
  status: number,
  details?: any
): NextResponse {
  const response = {
    error: message,
    ...(process.env.NODE_ENV === 'development' && details && { details }),
  };

  return NextResponse.json(response, { status });
}

// Secure response helper
export function secureResponse(
  data: any,
  options?: ResponseInit
): NextResponse {
  const response = NextResponse.json(data, options);
  
  // Set security headers
  response.headers.set('Cache-Control', 'no-store, private');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  return response;
}

// Validate request origin and method
export async function validateRequest(
  request: NextRequest,
  options?: {
    allowedMethods?: string[];
    requireOrigin?: boolean;
  }
): Promise<{ error?: NextResponse }> {
  const { allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], requireOrigin = true } = options || {};

  // Check method
  if (!allowedMethods.includes(request.method)) {
    return {
      error: errorResponse('Method not allowed', 405),
    };
  }

  // Check origin for state-changing requests
  if (requireOrigin && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    if (!origin || !host) {
      return {
        error: errorResponse('Missing origin or host header', 403),
      };
    }

    // In production, check against allowed origins
    if (process.env.NODE_ENV === 'production') {
      const isAllowedOrigin = ALLOWED_ORIGINS.length === 0 || 
        ALLOWED_ORIGINS.includes(origin) ||
        origin.includes(host);
      
      if (!isAllowedOrigin) {
        return {
          error: errorResponse('Invalid origin', 403),
        };
      }
    }
  }

  return {};
}

// Parse and validate request body
export async function parseBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data?: T; error?: NextResponse }> {
  try {
    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return {
        error: errorResponse('Content-Type must be application/json', 400),
      };
    }

    // Read body with size limit
    const bodyText = await request.text();
    
    if (bodyText.length > MAX_REQUEST_SIZE) {
      return {
        error: errorResponse('Request body too large', 413),
      };
    }

    // Parse JSON
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return {
        error: errorResponse('Invalid JSON', 400),
      };
    }

    // Validate with schema
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return {
        error: errorResponse(
          'Validation failed',
          400,
          result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        ),
      };
    }

    return { data: result.data };
  } catch (error) {
    console.error('Error parsing body:', error);
    return {
      error: errorResponse('Failed to parse request body', 500),
    };
  }
}

// Sanitize string input
export function sanitizeInput(input: string): string {
  // Basic sanitization - remove HTML tags and trim whitespace
  const cleaned = input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
  
  return cleaned;
}

// Validate query parameters
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { data?: T; error?: NextResponse } {
  const params: Record<string, any> = {};
  
  searchParams.forEach((value, key) => {
    // Handle arrays (e.g., ?tags=a&tags=b)
    if (params[key]) {
      if (Array.isArray(params[key])) {
        params[key].push(value);
      } else {
        params[key] = [params[key], value];
      }
    } else {
      params[key] = value;
    }
  });

  const result = schema.safeParse(params);
  
  if (!result.success) {
    return {
      error: errorResponse(
        'Invalid query parameters',
        400,
        result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      ),
    };
  }

  return { data: result.data };
}

// Validate pagination parameters
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1)).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
  sort: z.enum(['createdAt', 'updatedAt', 'name']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type PaginationParams = z.infer<typeof paginationSchema>;