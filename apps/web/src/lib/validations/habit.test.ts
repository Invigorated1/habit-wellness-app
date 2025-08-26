import { describe, it, expect } from 'vitest';
import { createHabitSchema, updateHabitSchema } from './habit';

describe('Habit Validation Schemas', () => {
  describe('createHabitSchema', () => {
    it('validates valid input', () => {
      const validInput = {
        name: 'Morning Meditation',
        description: 'Daily 10-minute meditation',
      };

      const result = createHabitSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validInput);
    });

    it('validates input without description', () => {
      const validInput = {
        name: 'Morning Meditation',
      };

      const result = createHabitSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validInput);
    });

    it('rejects empty name', () => {
      const invalidInput = {
        name: '',
        description: 'Some description',
      };

      const result = createHabitSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Name is required');
    });

    it('rejects missing name', () => {
      const invalidInput = {
        description: 'Some description',
      };

      const result = createHabitSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('rejects name longer than 100 characters', () => {
      const invalidInput = {
        name: 'a'.repeat(101),
      };

      const result = createHabitSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Name must be less than 100 characters');
    });

    it('rejects description longer than 500 characters', () => {
      const invalidInput = {
        name: 'Valid Name',
        description: 'a'.repeat(501),
      };

      const result = createHabitSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Description must be less than 500 characters');
    });
  });

  describe('updateHabitSchema', () => {
    it('validates partial update with name only', () => {
      const validInput = {
        name: 'Updated Name',
      };

      const result = updateHabitSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validInput);
    });

    it('validates partial update with description only', () => {
      const validInput = {
        description: 'Updated description',
      };

      const result = updateHabitSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validInput);
    });

    it('validates partial update with isActive only', () => {
      const validInput = {
        isActive: false,
      };

      const result = updateHabitSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validInput);
    });

    it('validates full update', () => {
      const validInput = {
        name: 'Updated Name',
        description: 'Updated description',
        isActive: false,
      };

      const result = updateHabitSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validInput);
    });

    it('validates empty update', () => {
      const validInput = {};

      const result = updateHabitSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validInput);
    });

    it('allows null description', () => {
      const validInput = {
        description: null,
      };

      const result = updateHabitSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validInput);
    });

    it('rejects empty name when provided', () => {
      const invalidInput = {
        name: '',
      };

      const result = updateHabitSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Name is required');
    });
  });
});