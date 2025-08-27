import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';

export async function GET() {
  try {
    // Get the current user
    const user = await getOrCreateUser();

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

    return NextResponse.json(transformedHabits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get the current user
    const user = await getOrCreateUser();
    
    const body = await request.json();
    const { name, description } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Create the habit
    const newHabit = await prisma.habit.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: user.id,
      },
    });

    // Return the created habit
    return NextResponse.json({
      id: newHabit.id,
      name: newHabit.name,
      description: newHabit.description,
      streak: newHabit.streak,
      isActive: newHabit.isActive,
      createdAt: newHabit.createdAt.toISOString(),
      updatedAt: newHabit.updatedAt.toISOString(),
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating habit:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    );
  }
}