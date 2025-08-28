import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { validateCreateHabit } from '@/lib/validations/habit';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ValidationError } from '@/lib/errors';

export const GET = withErrorHandler(async () => {
  // Get the current user
  const user = await getOrCreateUser();
  
  logger.info('Fetching habits', { userId: user.id });

    // Fetch all habits for the user
    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
      },
      include: {
        entries: {
          orderBy: {
            date: 'desc',
          },
          take: 30, // Last 30 days for streak calculation
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected format
    const transformedHabits = habits.map(habit => ({
      id: habit.id,
      name: habit.name,
      description: habit.description,
      streak: habit.streak,
      isActive: habit.isActive,
      createdAt: habit.createdAt.toISOString(),
      updatedAt: habit.updatedAt.toISOString(),
    }));

    logger.info('Habits fetched successfully', { userId: user.id, count: habits.length });
    return successResponse(transformedHabits);
});

export const POST = withErrorHandler(async (request: Request) => {
  // Get the current user
  const user = await getOrCreateUser();
  
  const body = await request.json();
  
  logger.info('Creating habit', { userId: user.id, body });
  
  // Validate input
  const validation = validateCreateHabit(body);
  if (!validation.isValid) {
    throw new ValidationError(validation.errors);
  }
  
  const { name, description } = validation.data!;

    // Create the habit
    const newHabit = await prisma.habit.create({
      data: {
        name,
        description,
        userId: user.id,
      },
    });

    logger.info('Habit created successfully', { userId: user.id, habitId: newHabit.id });
    
    // Return the created habit
    return successResponse({
      id: newHabit.id,
      name: newHabit.name,
      description: newHabit.description,
      streak: newHabit.streak,
      isActive: newHabit.isActive,
      createdAt: newHabit.createdAt.toISOString(),
      updatedAt: newHabit.updatedAt.toISOString(),
    }, 201);
});