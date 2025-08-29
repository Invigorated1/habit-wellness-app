import { describe, it, expect } from 'vitest';
import { validateCreateHabit, validateUpdateHabit } from '../validations/habit';

describe('Habit Validations', () => {
  describe('validateCreateHabit', () => {
    it('should validate a valid habit', () => {
      const result = validateCreateHabit({
        name: 'Exercise',
        description: 'Daily workout',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({
        name: 'Exercise',
        description: 'Daily workout',
      });
    });

    it('should trim whitespace', () => {
      const result = validateCreateHabit({
        name: '  Exercise  ',
        description: '  Daily workout  ',
      });

      expect(result.isValid).toBe(true);
      expect(result.data?.name).toBe('Exercise');
      expect(result.data?.description).toBe('Daily workout');
    });

    it('should reject empty name', () => {
      const result = validateCreateHabit({
        name: '',
        description: 'Description',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name cannot be empty');
    });

    it('should reject missing name', () => {
      const result = validateCreateHabit({
        description: 'Description',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    it('should reject name that is too long', () => {
      const result = validateCreateHabit({
        name: 'a'.repeat(101),
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name must be less than 100 characters');
    });

    it('should handle null description', () => {
      const result = validateCreateHabit({
        name: 'Exercise',
        description: null,
      });

      expect(result.isValid).toBe(true);
      expect(result.data?.description).toBe(null);
    });
  });

  describe('validateUpdateHabit', () => {
    it('should validate partial updates', () => {
      const result = validateUpdateHabit({
        name: 'Updated Exercise',
      });

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({
        name: 'Updated Exercise',
      });
    });

    it('should validate boolean isActive', () => {
      const result = validateUpdateHabit({
        isActive: false,
      });

      expect(result.isValid).toBe(true);
      expect(result.data?.isActive).toBe(false);
    });

    it('should validate streak number', () => {
      const result = validateUpdateHabit({
        streak: 10,
      });

      expect(result.isValid).toBe(true);
      expect(result.data?.streak).toBe(10);
    });

    it('should reject negative streak', () => {
      const result = validateUpdateHabit({
        streak: -1,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Streak must be non-negative');
    });

    it('should reject non-integer streak', () => {
      const result = validateUpdateHabit({
        streak: 3.14,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Streak must be an integer');
    });

    it('should allow empty object (no updates)', () => {
      const result = validateUpdateHabit({});

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({});
    });
  });
});