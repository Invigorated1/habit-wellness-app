import { z } from 'zod';

// Base habit schema
export const habitSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  streak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  lastCompletedAt: z.string().datetime().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  userId: z.string(),
});

// Input schemas
export const createHabitSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

export const updateHabitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

// Habit entry schema
export const habitEntrySchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: z.string(),
  completed: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Sharing schemas
export const habitShareSchema = z.object({
  habitId: z.string(),
  shareType: z.enum(['progress', 'achievement', 'milestone']),
  message: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export const sharedHabitSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  userId: z.string(),
  shareType: z.string(),
  message: z.string().nullable(),
  isPublic: z.boolean(),
  viewCount: z.number().int().default(0),
  shareUrl: z.string(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

// Types
export type Habit = z.infer<typeof habitSchema>;
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type HabitEntry = z.infer<typeof habitEntrySchema>;
export type HabitShare = z.infer<typeof habitShareSchema>;
export type SharedHabit = z.infer<typeof sharedHabitSchema>;