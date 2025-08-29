import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { withErrorHandler, successResponse, errorResponse } from '../api-handler';
import { AppError, ValidationError } from '../errors';
import { ZodError } from 'zod';

// Mock dependencies
vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('../rate-limit', () => ({
  withRateLimit: vi.fn().mockResolvedValue({
    success: true,
    headers: {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '99',
      'X-RateLimit-Reset': new Date().toISOString(),
    },
  }),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-user' }),
}));

describe('API Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withErrorHandler', () => {
    it('should handle successful requests', async () => {
      const handler = vi.fn().mockResolvedValue(
        NextResponse.json({ data: 'success' })
      );
      
      const wrapped = withErrorHandler(handler);
      const mockRequest = new Request('http://localhost/api/test');
      const result = await wrapped(mockRequest);
      
      expect(handler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should handle AppError instances', async () => {
      const handler = vi.fn().mockRejectedValue(
        new AppError(400, 'Bad request')
      );
      
      const wrapped = withErrorHandler(handler);
      const mockRequest = new Request('http://localhost/api/test');
      const result = await wrapped(mockRequest);
      
      const body = await result.json();
      expect(result.status).toBe(400);
      expect(body.error).toBe('Bad request');
      expect(body.statusCode).toBe(400);
    });

    it('should handle ValidationError', async () => {
      const handler = vi.fn().mockRejectedValue(
        new ValidationError(['Field is required'])
      );
      
      const wrapped = withErrorHandler(handler);
      const mockRequest = new Request('http://localhost/api/test');
      const result = await wrapped(mockRequest);
      
      const body = await result.json();
      expect(result.status).toBe(400);
      expect(body.error).toBe('Field is required');
    });

    it('should handle ZodError', async () => {
      const zodError = new ZodError([
        {
          path: ['name'],
          message: 'Required',
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
        },
      ]);
      
      const handler = vi.fn().mockRejectedValue(zodError);
      const wrapped = withErrorHandler(handler);
      const mockRequest = new Request('http://localhost/api/test');
      const result = await wrapped(mockRequest);
      
      const body = await result.json();
      expect(result.status).toBe(400);
      expect(body.error).toBe('Validation failed');
      expect(body.errors).toContain('name: Required');
    });

    it('should handle rate limiting', async () => {
      const { withRateLimit } = await import('../rate-limit');
      (withRateLimit as any).mockResolvedValueOnce({
        success: false,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date().toISOString(),
        },
      });
      
      const handler = vi.fn();
      const wrapped = withErrorHandler(handler);
      const mockRequest = new Request('http://localhost/api/test');
      const result = await wrapped(mockRequest);
      
      const body = await result.json();
      expect(result.status).toBe(429);
      expect(body.error).toBe('Too many requests. Please try again later.');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle unknown errors', async () => {
      const handler = vi.fn().mockRejectedValue(
        new Error('Unknown error')
      );
      
      const wrapped = withErrorHandler(handler);
      const mockRequest = new Request('http://localhost/api/test');
      const result = await wrapped(mockRequest);
      
      const body = await result.json();
      expect(result.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });

    it('should disable rate limiting when option is false', async () => {
      const handler = vi.fn().mockResolvedValue(
        NextResponse.json({ data: 'success' })
      );
      
      const wrapped = withErrorHandler(handler, { rateLimit: false });
      const mockRequest = new Request('http://localhost/api/test');
      await wrapped(mockRequest);
      
      const { withRateLimit } = await import('../rate-limit');
      expect(withRateLimit).not.toHaveBeenCalled();
    });
  });

  describe('successResponse', () => {
    it('should create success response with default status', () => {
      const response = successResponse({ message: 'Created' });
      
      expect(response.status).toBe(200);
      response.json().then(body => {
        expect(body.success).toBe(true);
        expect(body.data).toEqual({ message: 'Created' });
      });
    });

    it('should create success response with custom status', () => {
      const response = successResponse({ id: '123' }, 201);
      
      expect(response.status).toBe(201);
      response.json().then(body => {
        expect(body.success).toBe(true);
        expect(body.data).toEqual({ id: '123' });
      });
    });
  });

  describe('errorResponse', () => {
    it('should create error response with default status', () => {
      const response = errorResponse('Bad request');
      
      expect(response.status).toBe(400);
      response.json().then(body => {
        expect(body.success).toBe(false);
        expect(body.error).toBe('Bad request');
      });
    });

    it('should create error response with custom status', () => {
      const response = errorResponse('Not found', 404);
      
      expect(response.status).toBe(404);
      response.json().then(body => {
        expect(body.success).toBe(false);
        expect(body.error).toBe('Not found');
      });
    });
  });
});