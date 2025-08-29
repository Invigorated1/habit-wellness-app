import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { UpdateHabitSchema, HabitIdSchema, HabitWithEntriesSchema } from '@/lib/validations/habit.zod';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { z } from 'zod';
import { requireHabitOwnership } from '@/lib/auth/permissions';
import { invalidateHabitCache } from '@/lib/redis';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET a single habit
export const GET = withErrorHandler(async (request: Request, { params }: RouteParams) => {
  const { id } = await params;
  const user = await getOrCreateUser();
  
  // Validate ID format
  const validatedId = HabitIdSchema.parse(id);
  
  logger.info('Fetching habit', { userId: user.id, habitId: validatedId });

    // Check authorization
    await requireHabitOwnership(user.id, validatedId);

    const habit = await prisma.habit.findUnique({
      where: {
        id: validatedId,
      },
      include: {
        entries: {
          orderBy: {
            date: 'desc',
          },
          take: 30,
        },
      },
    });

    if (!habit) {
      throw new NotFoundError('Habit not found');
    }

    return successResponse({
      id: habit.id,
      name: habit.name,
      description: habit.description,
      streak: habit.streak,
      isActive: habit.isActive,
      createdAt: habit.createdAt.toISOString(),
      updatedAt: habit.updatedAt.toISOString(),
      entries: habit.entries.map(entry => ({
        id: entry.id,
        date: entry.date.toISOString(),
        completed: entry.completed,
        notes: entry.notes,
      })),
    });
});

// UPDATE a habit
export const PATCH = withErrorHandler(async (request: Request, { params }: RouteParams) => {
  const { id } = await params;
  const user = await getOrCreateUser();
  const body = await request.json();
  
  // Validate ID and body
  const validatedId = HabitIdSchema.parse(id);
  const validatedData = UpdateHabitSchema.parse(body);
  
  logger.info('Updating habit', { userId: user.id, habitId: validatedId, body: validatedData });

    // First check if the habit belongs to the user
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: validatedId,
        userId: user.id,
      },
    });

    if (!existingHabit) {
      throw new NotFoundError('Habit not found');
    }

    // Update the habit
    const updatedHabit = await prisma.habit.update({
      where: { id: validatedId },
      data: validatedData,
    });

    logger.info('Habit updated successfully', { userId: user.id, habitId: id });
    
    return successResponse({
      id: updatedHabit.id,
      name: updatedHabit.name,
      description: updatedHabit.description,
      streak: updatedHabit.streak,
      isActive: updatedHabit.isActive,
      createdAt: updatedHabit.createdAt.toISOString(),
      updatedAt: updatedHabit.updatedAt.toISOString(),
    });
});

// DELETE a habit
export const DELETE = withErrorHandler(async (request: Request, { params }: RouteParams) => {
  const { id } = await params;
  const user = await getOrCreateUser();
  
  // Validate ID
  const validatedId = HabitIdSchema.parse(id);
  
  logger.info('Deleting habit', { userId: user.id, habitId: validatedId });

  // First check if the habit belongs to the user
  const existingHabit = await prisma.habit.findFirst({
    where: {
      id: validatedId,
      userId: user.id,
    },
  });

  if (!existingHabit) {
    throw new NotFoundError('Habit not found');
  }

  // Delete the habit (cascading delete will remove entries)
  await prisma.habit.delete({
    where: { id: validatedId },
  });
  
  logger.info('Habit deleted successfully', { userId: user.id, habitId: id });

  return successResponse({ message: 'Habit deleted successfully' });
});