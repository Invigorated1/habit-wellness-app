import { z } from 'zod';

// Base schemas
export const HabitIdSchema = z.string().cuid();

export const CreateHabitSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .nullable()
    .optional()
    .transform(val => val || null),
});

export const UpdateHabitSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
  streak: z
    .number()
    .int('Streak must be an integer')
    .min(0, 'Streak must be non-negative')
    .optional(),
});

// Response schemas
export const HabitResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  streak: z.number(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const HabitWithEntriesSchema = HabitResponseSchema.extend({
  entries: z.array(z.object({
    id: z.string(),
    date: z.string().datetime(),
    completed: z.boolean(),
    notes: z.string().nullable(),
  })),
});

// Type inference
export type CreateHabitInput = z.infer<typeof CreateHabitSchema>;
export type UpdateHabitInput = z.infer<typeof UpdateHabitSchema>;
export type HabitResponse = z.infer<typeof HabitResponseSchema>;
export type HabitWithEntries = z.infer<typeof HabitWithEntriesSchema>;

// API response envelopes
export const SuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.array(z.string()).optional(),
});

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  SuccessResponseSchema(
    z.object({
      items: z.array(itemSchema),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
      }),
    })
  );