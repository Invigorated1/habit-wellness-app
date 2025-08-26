import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { updateAllStreaks } from '@/lib/streak';
import { logJobExecution, cleanupOldJobs, getJobStats } from '@/lib/cron';

// Vercel Cron will call this endpoint daily
export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    // Verify the request is from Vercel Cron
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if job is already running (idempotency)
    const jobName = 'update-streaks';
    const existingJob = await prisma.cronJob.findUnique({
      where: { name: jobName },
    });

    // If job ran in the last 23 hours, skip (idempotency safeguard)
    if (existingJob?.lastRunAt) {
      const hoursSinceLastRun = 
        (Date.now() - existingJob.lastRunAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastRun < 23) {
        return NextResponse.json({
          message: 'Job already ran recently',
          lastRunAt: existingJob.lastRunAt,
          hoursSinceLastRun,
        });
      }
    }

    // Create or update job record
    const job = await prisma.cronJob.upsert({
      where: { name: jobName },
      create: {
        name: jobName,
        status: 'running',
      },
      update: {
        status: 'running',
        error: null,
        result: null,
      },
    });

    try {
      // Run the streak update with retry logic and observability
      const jobResult = await logJobExecution(jobName, async () => {
        const result = await updateAllStreaks();
        
        // Clean up old job records
        await cleanupOldJobs(jobName, 30);
        
        return result;
      });

      // Update job record with result
      await prisma.cronJob.update({
        where: { id: job.id },
        data: {
          status: jobResult.success ? 'completed' : 'failed',
          lastRunAt: new Date(),
          result: jobResult as any,
          error: jobResult.error || null,
        },
      });

      if (!jobResult.success) {
        throw new Error(jobResult.error || 'Job failed');
      }

      return NextResponse.json({
        success: true,
        jobId: job.id,
        result: jobResult,
      });
    } catch (error) {
      // Update job record with failure
      await prisma.cronJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          lastRunAt: new Date(),
        },
      });

      throw error;
    }
  } catch (error) {
    console.error('[Cron] Error updating streaks:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update streaks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Health check endpoint for monitoring
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // Get job statistics
    const stats = await getJobStats('update-streaks', days);

    return NextResponse.json({
      status: stats.failed > stats.successful ? 'unhealthy' : 'healthy',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}