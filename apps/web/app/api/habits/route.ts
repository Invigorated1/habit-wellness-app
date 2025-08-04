import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // For now, return mock data - will be replaced with Prisma queries
    const habits = [
      {
        id: 1,
        name: 'Meditation',
        description: 'Daily meditation practice',
        streak: 5,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Exercise',
        description: 'Daily workout routine',
        streak: 3,
        createdAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json(habits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Mock response - will be replaced with Prisma creation
    const newHabit = {
      id: Date.now(),
      name,
      description: description || '',
      streak: 0,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(newHabit, { status: 201 });
  } catch (error) {
    console.error('Error creating habit:', error);
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    );
  }
}