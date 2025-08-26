import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { habitShareSchema } from '@habit-app/shared';
import { nanoid } from 'nanoid';

export async function POST(
  request: Request,
  { params }: { params: { habitId: string } }
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
    const validation = habitShareSchema.safeParse({ ...body, habitId: params.habitId });
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { habitId, shareType, message, isPublic } = validation.data;

    // Get user and verify habit ownership
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: user.id,
      },
      include: {
        entries: {
          where: {
            completed: true,
          },
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

    // Generate unique share URL
    const shareUrl = nanoid(10);

    // Create shared habit record
    const sharedHabit = await prisma.sharedHabit.create({
      data: {
        habitId,
        userId: user.id,
        shareType,
        message,
        isPublic,
        shareUrl,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Create notification for milestone shares
    if (shareType === 'milestone' || shareType === 'achievement') {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'achievement_unlocked',
          title: 'Achievement Shared!',
          body: `You shared your ${habit.name} ${shareType}!`,
          data: {
            habitId,
            shareId: sharedHabit.id,
            shareUrl: sharedHabit.shareUrl,
          },
        },
      });
    }

    const fullShareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${shareUrl}`;

    return NextResponse.json({
      ...sharedHabit,
      shareUrl: fullShareUrl,
      habit: {
        name: habit.name,
        streak: habit.streak,
        longestStreak: habit.longestStreak,
        completionRate: calculateCompletionRate(habit.entries),
      },
    });
  } catch (error) {
    console.error('Error sharing habit:', error);
    return NextResponse.json(
      { error: 'Failed to share habit' },
      { status: 500 }
    );
  }
}

function calculateCompletionRate(entries: any[]): number {
  if (entries.length === 0) return 0;
  const completed = entries.filter(e => e.completed).length;
  return Math.round((completed / 30) * 100);
}