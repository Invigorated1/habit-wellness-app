import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { validateUpdateHabit, UpdateHabitInput } from '@/lib/validations/habit';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { NotFoundError, ValidationError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET a single habit
export const GET = withErrorHandler(async (request: Request, { params }: RouteParams) => {
  const { id } = await params;
  const user = await getOrCreateUser();
  
  logger.info('Fetching habit', { userId: user.id, habitId: id });

    const habit = await prisma.habit.findFirst({
      where: {
        id,
        userId: user.id,
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
  
  logger.info('Updating habit', { userId: user.id, habitId: id, body });

    // First check if the habit belongs to the user
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingHabit) {
      throw new NotFoundError('Habit not found');
    }

    // Validate input
    const validation = validateUpdateHabit(body);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }
    
    const updates: UpdateHabitInput = validation.data!;

    // Update the habit
    const updatedHabit = await prisma.habit.update({
      where: { id },
      data: updates,
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
  
  logger.info('Deleting habit', { userId: user.id, habitId: id });

  // First check if the habit belongs to the user
  const existingHabit = await prisma.habit.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!existingHabit) {
    throw new NotFoundError('Habit not found');
  }

  // Delete the habit (cascading delete will remove entries)
  await prisma.habit.delete({
    where: { id },
  });
  
  logger.info('Habit deleted successfully', { userId: user.id, habitId: id });

  return successResponse({ message: 'Habit deleted successfully' });
});