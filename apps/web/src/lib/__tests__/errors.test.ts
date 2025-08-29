import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from '../errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError(400, 'Test error');
      
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Test error');
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should allow custom isOperational flag', () => {
      const error = new AppError(500, 'System error', false);
      expect(error.isOperational).toBe(false);
    });
  });

  describe('ValidationError', () => {
    it('should format multiple errors', () => {
      const errors = ['Field 1 is required', 'Field 2 is invalid'];
      const error = new ValidationError(errors);
      
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Field 1 is required, Field 2 is invalid');
      expect(error.name).toBe('ValidationError');
    });

    it('should handle single error', () => {
      const error = new ValidationError(['Single error']);
      expect(error.message).toBe('Single error');
    });
  });

  describe('UnauthorizedError', () => {
    it('should use default message', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should accept custom message', () => {
      const error = new UnauthorizedError('Custom auth error');
      expect(error.message).toBe('Custom auth error');
    });
  });

  describe('NotFoundError', () => {
    it('should use default message', () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
      expect(error.name).toBe('NotFoundError');
    });

    it('should accept custom message', () => {
      const error = new NotFoundError('Habit not found');
      expect(error.message).toBe('Habit not found');
    });
  });

  describe('ConflictError', () => {
    it('should handle conflict errors', () => {
      const error = new ConflictError('Duplicate entry');
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Duplicate entry');
      expect(error.name).toBe('ConflictError');
    });
  });

  describe('InternalServerError', () => {
    it('should handle server errors', () => {
      const error = new InternalServerError();
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Internal server error');
      expect(error.name).toBe('InternalServerError');
    });
  });
});