import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/notifications/notification-service';
import { subDays } from 'date-fns';

// This should be called weekly (e.g., Monday at 9 AM UTC)
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting weekly summary job');
    
    const jobStart = Date.now();

    // Record job start
    const job = await prisma.cronJob.create({
      data: {
        name: 'weekly-summary',
        status: 'running',
      },
    });

    try {
      // Get users who want weekly summaries
      const usersWithSummaries = await prisma.notificationPreference.findMany({
        where: {
          weeklySummary: true,
          pushEnabled: true,
        },
        include: {
          user: true,
        },
      });

      console.log(`[Cron] Sending summaries to ${usersWithSummaries.length} users`);

      let sentCount = 0;
      const errors: string[] = [];

      for (const pref of usersWithSummaries) {
        try {
          await notificationService.sendWeeklySummary(pref.userId);
          sentCount++;
        } catch (error) {
          const errorMsg = `Failed to send summary to user ${pref.userId}: ${error}`;
          console.error(`[Cron] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      const duration = Date.now() - jobStart;
      
      // Update job as completed
      await prisma.cronJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          lastRunAt: new Date(),
          result: {
            processed: usersWithSummaries.length,
            sent: sentCount,
            errors: errors.length,
            duration,
          },
        },
      });

      console.log(`[Cron] Weekly summary job completed in ${duration}ms`);

      return NextResponse.json({
        success: true,
        processed: usersWithSummaries.length,
        sent: sentCount,
        errors,
        duration,
      });
    } catch (error) {
      // Update job as failed
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
    console.error('[Cron] Weekly summary failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send weekly summaries',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}