import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { toggleHabitCompletion } from '@/lib/streak';
import { z } from 'zod';

const completeHabitSchema = z.object({
  completed: z.boolean().optional(),
  date: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = completeHabitSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { completed, date, notes } = validationResult.data;

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if habit exists and belongs to user
    const habit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    // Toggle completion
    const entry = await toggleHabitCompletion(
      params.id,
      date ? new Date(date) : new Date(),
      completed,
      notes
    );

    // Get updated habit with new streak
    const updatedHabit = await prisma.habit.findUnique({
      where: { id: params.id },
      include: {
        entries: {
          where: {
            date: entry.date,
          },
        },
      },
    });

    return NextResponse.json({
      habit: updatedHabit,
      entry,
    });
  } catch (error) {
    console.error('Error toggling habit completion:', error);
    return NextResponse.json(
      { error: 'Failed to update habit completion' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if habit exists and belongs to user
    const habit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    // Get entries for the specified date or today
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const entry = await prisma.habitEntry.findUnique({
      where: {
        habitId_date: {
          habitId: params.id,
          date: targetDate,
        },
      },
    });

    return NextResponse.json({
      habit,
      entry: entry || null,
    });
  } catch (error) {
    console.error('Error fetching habit completion:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit completion' },
      { status: 500 }
    );
  }
}