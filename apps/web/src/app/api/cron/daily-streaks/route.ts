import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, subDays } from 'date-fns';
import { notificationService } from '@/lib/notifications/notification-service';

// This should be called by a cron service (e.g., Vercel Cron, GitHub Actions, or external service)
// Recommended schedule: Daily at 00:30 UTC
export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting daily streak update job');
    
    const jobStart = Date.now();
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);

    // Record job start
    const job = await prisma.cronJob.create({
      data: {
        name: 'daily-streak-update',
        status: 'running',
      },
    });

    try {
      // Get all active habits
      const habits = await prisma.habit.findMany({
        where: {
          isActive: true,
        },
        include: {
          entries: {
            where: {
              date: {
                gte: subDays(today, 2), // Get last 2 days of entries
              },
            },
            orderBy: {
              date: 'desc',
            },
          },
        },
      });

      console.log(`[Cron] Processing ${habits.length} active habits`);

      let updatedCount = 0;
      let brokenStreaks = 0;
      const errors: string[] = [];

      // Process each habit
      for (const habit of habits) {
        try {
          const yesterdayEntry = habit.entries.find(
            e => e.date.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]
          );
          const todayEntry = habit.entries.find(
            e => e.date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
          );

          // Check if streak should be broken (no entry yesterday or not completed)
          if (!yesterdayEntry || !yesterdayEntry.completed) {
            if (habit.streak > 0) {
              // Streak is broken
              const previousStreak = habit.streak;
              
              await prisma.habit.update({
                where: { id: habit.id },
                data: {
                  streak: 0,
                  // Don't reset lastCompletedAt or longestStreak
                },
              });

              brokenStreaks++;
              
              // Send notification about broken streak
              if (previousStreak >= 3) {
                await notificationService.sendStreakBroken(habit.id, previousStreak);
              }
              
              console.log(`[Cron] Broke streak for habit ${habit.id}: was ${previousStreak} days`);
            }
          } else {
            // Yesterday was completed, check if we need to update lastCompletedAt
            if (!habit.lastCompletedAt || habit.lastCompletedAt < yesterday) {
              await prisma.habit.update({
                where: { id: habit.id },
                data: {
                  lastCompletedAt: yesterday,
                },
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
          const errorMsg = `Failed to process habit ${habit.id}: ${error}`;
          console.error(`[Cron] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      // Send daily reminders to users with notification preferences
      const usersWithReminders = await prisma.notificationPreference.findMany({
        where: {
          habitReminders: true,
          pushEnabled: true,
        },
        include: {
          user: {
            include: {
              habits: {
                where: {
                  isActive: true,
                },
              },
            },
          },
        },
      });

      console.log(`[Cron] Sending reminders to ${usersWithReminders.length} users`);

      for (const pref of usersWithReminders) {
        if (pref.user.habits.length > 0) {
          // Schedule reminders for the user's preferred time
          // This is a simplified version - in production, you'd want to handle timezones
          for (const habit of pref.user.habits) {
            await notificationService.sendHabitReminder(habit.id);
          }
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
            processed: habits.length,
            updated: updatedCount,
            brokenStreaks,
            errors: errors.length,
            duration,
          },
        },
      });

      console.log(`[Cron] Job completed in ${duration}ms`);

      return NextResponse.json({
        success: true,
        processed: habits.length,
        updated: updatedCount,
        brokenStreaks,
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
    console.error('[Cron] Daily streak update failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update streaks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Health check endpoint for the cron job
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}