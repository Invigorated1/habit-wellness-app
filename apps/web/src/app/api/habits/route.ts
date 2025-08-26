import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { startOfDay } from 'date-fns';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user from our database using Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const today = startOfDay(new Date());

    // Get all habits for the authenticated user with today's entries
    // This avoids N+1 queries by fetching related data in one query
    const habits = await prisma.habit.findMany({
      where: { userId: user.id },
      include: {
        entries: {
          where: {
            date: today,
          },
          take: 1,
        },
        _count: {
          select: {
            entries: {
              where: {
                completed: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform the data to include today's completion status
    const habitsWithStatus = habits.map(habit => ({
      ...habit,
      todayEntry: habit.entries[0] || null,
      completedCount: habit._count.entries,
      entries: undefined, // Remove the entries array from response
      _count: undefined, // Remove the count object from response
    }));

    return NextResponse.json(habitsWithStatus);
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
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Get the user from our database using Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create a new habit for the authenticated user
    const newHabit = await prisma.habit.create({
      data: {
        name,
        description: description || null,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    // Return habit with additional fields for consistency
    const habitWithStatus = {
      ...newHabit,
      todayEntry: null,
      completedCount: 0,
      _count: undefined,
    };

    return NextResponse.json(habitWithStatus, { status: 201 });
  } catch (error) {
    console.error('Error creating habit:', error);
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    );
  }
}