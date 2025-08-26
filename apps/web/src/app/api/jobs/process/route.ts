import { NextRequest, NextResponse } from 'next/server';
import { verifySignature } from '@upstash/qstash/nextjs';
import { jobSchema, JobType } from '@/lib/qstash';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/notifications/notification-service';
import { startOfDay, subDays } from 'date-fns';
import { logger } from '@/lib/logger';

// Verify QStash signature
async function verifyQStashSignature(request: NextRequest): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    // In development, check for cron secret
    const authHeader = request.headers.get('authorization');
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
  }

  // In production, verify QStash signature
  try {
    await verifySignature(request);
    return true;
  } catch (error) {
    logger.error('QStash signature verification failed', { error });
    return false;
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  
  try {
    // Verify signature
    const isValid = await verifyQStashSignature(request);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate job payload
    const body = await request.json();
    const result = jobSchema.safeParse(body);

    if (!result.success) {
      logger.error('Invalid job payload', {
        requestId,
        errors: result.error.errors,
      });
      return NextResponse.json(
        { error: 'Invalid job payload' },
        { status: 400 }
      );
    }

    const job = result.data;
    logger.info('Processing job', { requestId, jobType: job.type });

    // Process job based on type
    switch (job.type) {
      case JobType.DAILY_STREAK_UPDATE:
        await processDailyStreakUpdate(job.userId, requestId);
        break;

      case JobType.WEEKLY_SUMMARY:
        await processWeeklySummary(job.userId, requestId);
        break;

      case JobType.SEND_NOTIFICATION:
        await processSendNotification(job, requestId);
        break;

      case JobType.CLEANUP_OLD_ENTRIES:
        await processCleanupOldEntries(job.daysToKeep, requestId);
        break;

      default:
        logger.error('Unknown job type', { requestId, job });
        return NextResponse.json(
          { error: 'Unknown job type' },
          { status: 400 }
        );
    }

    logger.info('Job processed successfully', { requestId, jobType: job.type });
    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Job processing failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Job processing failed' },
      { status: 500 }
    );
  }
}

// Process daily streak updates
async function processDailyStreakUpdate(userId: string | undefined, requestId: string) {
  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);

  // Get habits to process
  const habits = await prisma.habit.findMany({
    where: {
      isActive: true,
      ...(userId && { user: { clerkId: userId } }),
    },
    include: {
      entries: {
        where: {
          date: {
            gte: subDays(today, 2),
          },
        },
        orderBy: {
          date: 'desc',
        },
      },
    },
  });

  logger.info('Processing streak updates', {
    requestId,
    habitCount: habits.length,
    userId,
  });

  let updatedCount = 0;
  let brokenStreaks = 0;

  for (const habit of habits) {
    try {
      const yesterdayEntry = habit.entries.find(
        e => e.date.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]
      );
      const todayEntry = habit.entries.find(
        e => e.date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
      );

      // Check if streak should be broken
      if (!yesterdayEntry || !yesterdayEntry.completed) {
        if (habit.streak > 0) {
          const previousStreak = habit.streak;
          
          await prisma.habit.update({
            where: { id: habit.id },
            data: { streak: 0 },
          });

          brokenStreaks++;
          
          // Send notification for broken streak
          if (previousStreak >= 3) {
            await notificationService.sendStreakBroken(habit.id, previousStreak);
          }
          
          logger.info('Broke streak', {
            requestId,
            habitId: habit.id,
            previousStreak,
          });
        }
      } else {
        // Update lastCompletedAt if needed
        if (!habit.lastCompletedAt || habit.lastCompletedAt < yesterday) {
          await prisma.habit.update({
            where: { id: habit.id },
            data: { lastCompletedAt: yesterday },
          });
          updatedCount++;
        }
      }

      // Create today's entry if it doesn't exist
      if (!todayEntry) {
        await prisma.habitEntry.create({
          data: {
            habitId: habit.id,
            date: today,
            completed: false,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to process habit', {
        requestId,
        habitId: habit.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  logger.info('Streak update completed', {
    requestId,
    processed: habits.length,
    updated: updatedCount,
    brokenStreaks,
  });
}

// Process weekly summary
async function processWeeklySummary(userId: string, requestId: string) {
  logger.info('Sending weekly summary', { requestId, userId });
  
  try {
    await notificationService.sendWeeklySummary(userId);
    logger.info('Weekly summary sent', { requestId, userId });
  } catch (error) {
    logger.error('Failed to send weekly summary', {
      requestId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Process notification sending
async function processSendNotification(
  job: { userId: string; notificationType: string; data: Record<string, any> },
  requestId: string
) {
  logger.info('Sending notification', {
    requestId,
    userId: job.userId,
    type: job.notificationType,
  });

  try {
    // Route to appropriate notification method based on type
    switch (job.notificationType) {
      case 'habit-reminder':
        await notificationService.sendHabitReminder(job.data.habitId);
        break;
      case 'streak-milestone':
        await notificationService.sendStreakMilestone(job.data.habitId, job.data.milestone);
        break;
      default:
        logger.warn('Unknown notification type', {
          requestId,
          type: job.notificationType,
        });
    }
  } catch (error) {
    logger.error('Failed to send notification', {
      requestId,
      userId: job.userId,
      type: job.notificationType,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Process cleanup of old entries
async function processCleanupOldEntries(daysToKeep: number, requestId: string) {
  const cutoffDate = subDays(new Date(), daysToKeep);
  
  logger.info('Cleaning up old entries', {
    requestId,
    daysToKeep,
    cutoffDate,
  });

  try {
    // Delete old habit entries
    const deletedEntries = await prisma.habitEntry.deleteMany({
      where: {
        date: {
          lt: cutoffDate,
        },
      },
    });

    // Delete old notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        read: true,
      },
    });

    logger.info('Cleanup completed', {
      requestId,
      deletedEntries: deletedEntries.count,
      deletedNotifications: deletedNotifications.count,
    });
  } catch (error) {
    logger.error('Failed to cleanup old entries', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}