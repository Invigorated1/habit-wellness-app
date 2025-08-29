/**
 * Cron job to generate daily task schedules
 * Runs every hour to catch users in different timezones
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { taskScheduler } from '@/lib/scheduler/task-scheduler';
import { logger } from '@/lib/logger';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { addDays, startOfDay, subHours } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

// Vercel Cron configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export const GET = withErrorHandler(async (request: Request) => {
  // Verify cron secret (for Vercel Cron)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn('Unauthorized cron request');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  logger.info('Starting scheduled task generation');

  try {
    // Get current time
    const now = new Date();
    
    // Find users who need tasks scheduled
    // We look for users whose local time is between 10 PM and 2 AM
    // This gives us time to schedule tomorrow's tasks
    const usersToSchedule = await findUsersForScheduling(now);
    
    logger.info('Users to schedule', { count: usersToSchedule.length });

    // Process each user
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const user of usersToSchedule) {
      try {
        // Generate schedule for next 3 days
        await taskScheduler.generateSchedule({
          userId: user.id,
          startDate: startOfDay(addDays(now, 1)), // Start from tomorrow
          days: 3
        });
        
        results.success++;
      } catch (error) {
        logger.error('Failed to schedule for user', { 
          userId: user.id, 
          error 
        });
        results.failed++;
        results.errors.push(`User ${user.id}: ${error}`);
      }
    }

    logger.info('Task scheduling complete', results);

    return successResponse({
      scheduled: results.success,
      failed: results.failed,
      timestamp: now.toISOString()
    });

  } catch (error) {
    logger.error('Cron job failed', { error });
    throw error;
  }
});

/**
 * Find users who should have tasks scheduled
 */
async function findUsersForScheduling(now: Date) {
  // Get all active users with profiles
  const users = await prisma.user.findMany({
    where: {
      profile: {
        isNot: null
      },
      assignments: {
        some: {
          active: true
        }
      }
    },
    include: {
      profile: true,
      taskInstances: {
        where: {
          scheduledAt: {
            gte: addDays(now, 1),
            lt: addDays(now, 2)
          }
        },
        select: {
          id: true
        }
      }
    }
  });

  // Filter users based on their local time
  return users.filter(user => {
    // Skip if already has tasks for tomorrow
    if (user.taskInstances.length > 0) {
      return false;
    }

    // Check if it's scheduling time in user's timezone
    const timezone = user.profile?.timezone || 'UTC';
    const userTime = utcToZonedTime(now, timezone);
    const hour = userTime.getHours();
    
    // Schedule between 10 PM and 2 AM local time
    return hour >= 22 || hour <= 2;
  });
}

// Cron job configuration for vercel.json
export const config = {
  // Run every hour
  schedule: '0 * * * *'
};