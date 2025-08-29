/**
 * HabitStory Task Scheduling Engine
 * 
 * Generates personalized task schedules based on archetype and preferences
 */

import { prisma } from '@/lib/prisma';
import { 
  House, 
  HouseClass,
  TaskModality,
  TaskPersonalization 
} from '@/lib/archetype/types';
import { logger } from '@/lib/logger';
import { addDays, addHours, format, isWithinInterval, parseISO, setHours, setMinutes } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import archetypeConfig from '@/lib/archetype/config.json';

interface ScheduleWindow {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

interface UserSchedulePreferences {
  timezone: string;
  morningWindow?: ScheduleWindow;
  middayWindow?: ScheduleWindow;
  eveningWindow?: ScheduleWindow;
  dndWindows?: ScheduleWindow[];
}

interface ScheduleOptions {
  userId: string;
  startDate: Date;
  days: number;
  force?: boolean; // Force regeneration
}

export class TaskScheduler {
  /**
   * Generate task schedule for a user
   */
  async generateSchedule(options: ScheduleOptions): Promise<void> {
    const { userId, startDate, days, force = false } = options;
    
    logger.info('Generating task schedule', { userId, startDate, days });

    try {
      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          assignments: {
            where: { active: true },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          goals: {
            where: { active: true }
          }
        }
      });

      if (!user || !user.assignments[0]) {
        throw new Error('User or active assignment not found');
      }

      const assignment = user.assignments[0];
      const profile = user.profile;
      
      // Get schedule preferences
      const preferences = this.parsePreferences(profile);
      
      // Generate tasks for each day
      for (let day = 0; day < days; day++) {
        const targetDate = addDays(startDate, day);
        
        // Check if tasks already exist (unless forced)
        if (!force) {
          const existingTasks = await prisma.taskInstance.count({
            where: {
              userId,
              scheduledAt: {
                gte: targetDate,
                lt: addDays(targetDate, 1)
              }
            }
          });
          
          if (existingTasks > 0) {
            logger.debug('Tasks already exist for date', { userId, date: targetDate });
            continue;
          }
        }
        
        // Generate tasks for this day
        await this.generateDayTasks(
          userId,
          assignment.house as House,
          assignment.class as HouseClass,
          targetDate,
          preferences
        );
      }
      
      logger.info('Schedule generation complete', { userId });
      
    } catch (error) {
      logger.error('Failed to generate schedule', { error, userId });
      throw error;
    }
  }

  /**
   * Generate tasks for a single day
   */
  private async generateDayTasks(
    userId: string,
    house: House,
    houseClass: HouseClass,
    date: Date,
    preferences: UserSchedulePreferences
  ): Promise<void> {
    // Get house configuration
    const houseConfig = archetypeConfig.houses.find(h => h.house === house);
    const classConfig = archetypeConfig.classes.find(c => c.class === houseClass);
    
    if (!houseConfig) {
      throw new Error(`House configuration not found: ${house}`);
    }

    // Determine tasks for each time slot
    const tasks: Array<{
      templateKey: string;
      window: 'morning' | 'midday' | 'evening';
    }> = [];

    // Morning tasks
    if (preferences.morningWindow && houseConfig.schedule.morning) {
      const morningTask = classConfig?.defaults.morning || houseConfig.schedule.morning[0];
      if (morningTask) {
        tasks.push({ templateKey: morningTask, window: 'morning' });
      }
    }

    // Midday tasks
    if (preferences.middayWindow && houseConfig.schedule.midday) {
      const middayTask = classConfig?.defaults.midday || houseConfig.schedule.midday[0];
      if (middayTask) {
        tasks.push({ templateKey: middayTask, window: 'midday' });
      }
    }

    // Evening tasks
    if (preferences.eveningWindow && houseConfig.schedule.evening) {
      const eveningTask = classConfig?.defaults.evening || houseConfig.schedule.evening[0];
      if (eveningTask) {
        tasks.push({ templateKey: eveningTask, window: 'evening' });
      }
    }

    // Create task instances
    for (const task of tasks) {
      await this.createTaskInstance(
        userId,
        task.templateKey,
        date,
        task.window,
        preferences
      );
    }
  }

  /**
   * Create a single task instance
   */
  private async createTaskInstance(
    userId: string,
    templateKey: string,
    date: Date,
    window: 'morning' | 'midday' | 'evening',
    preferences: UserSchedulePreferences
  ): Promise<void> {
    // Get template
    const template = await prisma.taskTemplate.findUnique({
      where: { key: templateKey }
    });

    if (!template) {
      logger.warn('Task template not found', { templateKey });
      return;
    }

    // Calculate scheduled time
    const scheduledAt = this.calculateScheduledTime(
      date,
      window,
      preferences
    );

    // Skip if in DND window
    if (this.isInDndWindow(scheduledAt, preferences)) {
      logger.debug('Skipping task in DND window', { templateKey, scheduledAt });
      return;
    }

    // Create personalization params
    const params = this.generatePersonalizationParams(template, userId);

    // Create task instance
    await prisma.taskInstance.create({
      data: {
        userId,
        templateId: template.id,
        scheduledAt,
        scheduledEndAt: addHours(scheduledAt, 1), // 1 hour window
        durationSec: template.minDuration,
        params,
        status: 'SCHEDULED'
      }
    });

    logger.debug('Task instance created', { 
      userId, 
      templateKey, 
      scheduledAt 
    });
  }

  /**
   * Calculate the scheduled time for a task
   */
  private calculateScheduledTime(
    date: Date,
    window: 'morning' | 'midday' | 'evening',
    preferences: UserSchedulePreferences
  ): Date {
    const windowConfig = preferences[`${window}Window`];
    if (!windowConfig) {
      // Default times
      const defaults = {
        morning: { start: '07:00', end: '09:00' },
        midday: { start: '12:00', end: '14:00' },
        evening: { start: '18:00', end: '20:00' }
      };
      windowConfig = defaults[window];
    }

    // Parse start time
    const [hours, minutes] = windowConfig.start.split(':').map(Number);
    let scheduledTime = setMinutes(setHours(date, hours), minutes);

    // Convert to UTC for storage
    scheduledTime = zonedTimeToUtc(scheduledTime, preferences.timezone);

    return scheduledTime;
  }

  /**
   * Check if time falls within DND windows
   */
  private isInDndWindow(
    time: Date,
    preferences: UserSchedulePreferences
  ): boolean {
    if (!preferences.dndWindows || preferences.dndWindows.length === 0) {
      return false;
    }

    // Convert to user's timezone for comparison
    const userTime = utcToZonedTime(time, preferences.timezone);
    const timeStr = format(userTime, 'HH:mm');

    return preferences.dndWindows.some(window => {
      // Handle overnight windows (e.g., 22:00 - 06:00)
      if (window.start > window.end) {
        return timeStr >= window.start || timeStr <= window.end;
      }
      return timeStr >= window.start && timeStr <= window.end;
    });
  }

  /**
   * Parse user preferences from profile
   */
  private parsePreferences(profile: any): UserSchedulePreferences {
    const preferences: UserSchedulePreferences = {
      timezone: profile?.timezone || 'UTC'
    };

    // Parse window preferences from JSON
    if (profile?.dndWindows) {
      try {
        const dndData = typeof profile.dndWindows === 'string' 
          ? JSON.parse(profile.dndWindows) 
          : profile.dndWindows;
        
        preferences.dndWindows = Array.isArray(dndData) ? dndData : [];
        
        // Extract schedule windows if stored in same field
        if (dndData.morning) preferences.morningWindow = dndData.morning;
        if (dndData.midday) preferences.middayWindow = dndData.midday;
        if (dndData.evening) preferences.eveningWindow = dndData.evening;
        
      } catch (error) {
        logger.error('Failed to parse DND windows', { error });
      }
    }

    // Set defaults if not specified
    if (!preferences.morningWindow) {
      preferences.morningWindow = { start: '07:00', end: '09:00' };
    }
    if (!preferences.eveningWindow) {
      preferences.eveningWindow = { start: '18:00', end: '20:00' };
    }

    return preferences;
  }

  /**
   * Generate personalization parameters for a task
   */
  private generatePersonalizationParams(
    template: any,
    userId: string
  ): TaskPersonalization {
    // Start with defaults
    const params: TaskPersonalization = {
      duration: template.minDuration,
      intensity: 'moderate',
      guidance: 'detailed',
      music: 'ambient',
      voice: 'neutral'
    };

    // TODO: Customize based on user preferences and progress
    // This would involve looking at:
    // - User's experience level
    // - Previous task completions
    // - Feedback ratings
    // - Time of day
    // - Current streak

    return params;
  }

  /**
   * Get upcoming tasks for a user
   */
  async getUpcomingTasks(userId: string, days: number = 1) {
    const now = new Date();
    const endDate = addDays(now, days);

    const tasks = await prisma.taskInstance.findMany({
      where: {
        userId,
        scheduledAt: {
          gte: now,
          lt: endDate
        },
        status: {
          in: ['SCHEDULED', 'NOTIFIED']
        }
      },
      include: {
        template: true
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    return tasks;
  }

  /**
   * Mark task as started
   */
  async startTask(taskId: string, userId: string) {
    const task = await prisma.taskInstance.findFirst({
      where: {
        id: taskId,
        userId
      }
    });

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.status !== 'SCHEDULED' && task.status !== 'NOTIFIED') {
      throw new Error('Task cannot be started');
    }

    await prisma.taskInstance.update({
      where: { id: taskId },
      data: {
        status: 'STARTED',
        startedAt: new Date()
      }
    });

    logger.info('Task started', { taskId, userId });
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskId: string, userId: string) {
    const task = await prisma.taskInstance.findFirst({
      where: {
        id: taskId,
        userId
      }
    });

    if (!task) {
      throw new Error('Task not found');
    }

    await prisma.taskInstance.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // TODO: Update streaks, analytics, etc.

    logger.info('Task completed', { taskId, userId });
  }
}

// Export singleton instance
export const taskScheduler = new TaskScheduler();