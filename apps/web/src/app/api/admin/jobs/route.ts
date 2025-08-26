import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getJobStats } from '@/lib/cron';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user and check if admin (you might want to add an isAdmin field)
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get stats for all job types
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const streakJobStats = await getJobStats('update-streaks', days);

    // Get recent failed jobs for debugging
    const recentFailures = await prisma.cronJob.findMany({
      where: {
        status: 'failed',
        createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      jobs: {
        'update-streaks': streakJobStats,
      },
      recentFailures: recentFailures.map(job => ({
        id: job.id,
        name: job.name,
        error: job.error,
        lastRunAt: job.lastRunAt,
        createdAt: job.createdAt,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job statistics' },
      { status: 500 }
    );
  }
}