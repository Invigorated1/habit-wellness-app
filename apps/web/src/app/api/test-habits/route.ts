import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { withErrorHandler, successResponse } from '@/lib/api-handler';

// This is a test endpoint to verify habits CRUD operations
export const GET = withErrorHandler(async () => {
  const user = await getOrCreateUser();
  
  logger.info('Running habit CRUD tests', { userId: user.id });
    
    // Create a test habit
    const testHabit = await prisma.habit.create({
      data: {
        name: 'Test Habit - ' + new Date().toISOString(),
        description: 'This is a test habit created automatically',
        userId: user.id,
      },
    });

    // Fetch all habits
    const allHabits = await prisma.habit.findMany({
      where: { userId: user.id },
    });

    // Update the test habit
    const updatedHabit = await prisma.habit.update({
      where: { id: testHabit.id },
      data: { 
        name: 'Updated Test Habit',
        streak: 7,
      },
    });

    // Delete the test habit
    await prisma.habit.delete({
      where: { id: testHabit.id },
    });

    logger.info('All CRUD tests passed', { userId: user.id });
    
    return successResponse({
      message: 'All CRUD operations tested successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tests: {
        created: testHabit,
        totalHabits: allHabits.length,
        updated: updatedHabit,
        deleted: true,
      },
    });
});