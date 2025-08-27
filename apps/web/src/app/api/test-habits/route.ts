import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';

// This is a test endpoint to verify habits CRUD operations
export async function GET() {
  try {
    const user = await getOrCreateUser();
    
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

    return NextResponse.json({
      success: true,
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
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}