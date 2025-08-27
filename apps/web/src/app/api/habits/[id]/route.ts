import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET a single habit
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getOrCreateUser();

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
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
  } catch (error) {
    console.error('Error fetching habit:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch habit' },
      { status: 500 }
    );
  }
}

// UPDATE a habit
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getOrCreateUser();
    const body = await request.json();

    // First check if the habit belongs to the user
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingHabit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    // Validate input
    const updates: any = {};
    
    if ('name' in body) {
      if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    if ('description' in body) {
      updates.description = body.description?.trim() || null;
    }

    if ('isActive' in body) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'isActive must be a boolean' },
          { status: 400 }
        );
      }
      updates.isActive = body.isActive;
    }

    if ('streak' in body) {
      if (typeof body.streak !== 'number' || body.streak < 0) {
        return NextResponse.json(
          { error: 'Streak must be a non-negative number' },
          { status: 400 }
        );
      }
      updates.streak = body.streak;
    }

    // Update the habit
    const updatedHabit = await prisma.habit.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({
      id: updatedHabit.id,
      name: updatedHabit.name,
      description: updatedHabit.description,
      streak: updatedHabit.streak,
      isActive: updatedHabit.isActive,
      createdAt: updatedHabit.createdAt.toISOString(),
      updatedAt: updatedHabit.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating habit:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update habit' },
      { status: 500 }
    );
  }
}

// DELETE a habit
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getOrCreateUser();

    // First check if the habit belongs to the user
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingHabit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    // Delete the habit (cascading delete will remove entries)
    await prisma.habit.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Habit deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting habit:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    );
  }
}