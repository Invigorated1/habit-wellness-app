import { NextResponse } from 'next/server';

// Test endpoint to manually trigger cron jobs during development
export async function POST(request: Request) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Not available in production' },
        { status: 403 }
      );
    }

    const { job } = await request.json();
    
    if (!job || !['daily-streaks', 'weekly-summary'].includes(job)) {
      return NextResponse.json(
        { error: 'Invalid job name' },
        { status: 400 }
      );
    }

    const cronSecret = process.env.CRON_SECRET || 'development-secret';
    
    // Call the cron job with auth header
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cron/${job}`,
      {
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Cron job failed: ${error}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      job,
      result,
    });
  } catch (error) {
    console.error('Error testing cron job:', error);
    return NextResponse.json(
      { error: 'Failed to test cron job' },
      { status: 500 }
    );
  }
}

// Get cron job history
export async function GET() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Not available in production' },
        { status: 403 }
      );
    }

    const { prisma } = await import('@/lib/prisma');
    
    const jobs = await prisma.cronJob.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching cron history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cron history' },
      { status: 500 }
    );
  }
}