import { Client } from '@upstash/qstash';
import { z } from 'zod';

// Initialize QStash client
const qstashClient = process.env.QSTASH_TOKEN
  ? new Client({
      token: process.env.QSTASH_TOKEN,
    })
  : null;

// Job types
export const JobType = {
  DAILY_STREAK_UPDATE: 'daily-streak-update',
  WEEKLY_SUMMARY: 'weekly-summary',
  SEND_NOTIFICATION: 'send-notification',
  CLEANUP_OLD_ENTRIES: 'cleanup-old-entries',
} as const;

export type JobType = typeof JobType[keyof typeof JobType];

// Job payload schemas
export const dailyStreakUpdateSchema = z.object({
  type: z.literal(JobType.DAILY_STREAK_UPDATE),
  userId: z.string().optional(),
});

export const weeklySummarySchema = z.object({
  type: z.literal(JobType.WEEKLY_SUMMARY),
  userId: z.string(),
});

export const sendNotificationSchema = z.object({
  type: z.literal(JobType.SEND_NOTIFICATION),
  userId: z.string(),
  notificationType: z.string(),
  data: z.record(z.any()),
});

export const cleanupOldEntriesSchema = z.object({
  type: z.literal(JobType.CLEANUP_OLD_ENTRIES),
  daysToKeep: z.number().default(90),
});

// Unified job schema
export const jobSchema = z.discriminatedUnion('type', [
  dailyStreakUpdateSchema,
  weeklySummarySchema,
  sendNotificationSchema,
  cleanupOldEntriesSchema,
]);

export type JobPayload = z.infer<typeof jobSchema>;

// QStash service
export class QStashService {
  private client: Client | null;
  private baseUrl: string;

  constructor() {
    this.client = qstashClient;
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  async enqueue(payload: JobPayload, options?: {
    delay?: number; // Delay in seconds
    retries?: number;
    callback?: string;
  }): Promise<{ messageId: string } | null> {
    if (!this.client) {
      console.warn('QStash is not configured, skipping job:', payload.type);
      return null;
    }

    try {
      const response = await this.client.publishJSON({
        url: `${this.baseUrl}/api/jobs/process`,
        body: payload,
        delay: options?.delay,
        retries: options?.retries || 3,
        callback: options?.callback,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        },
      });

      console.log(`Job ${payload.type} enqueued with ID: ${response.messageId}`);
      return { messageId: response.messageId };
    } catch (error) {
      console.error('Failed to enqueue job:', error);
      throw error;
    }
  }

  async enqueueBatch(jobs: Array<{
    payload: JobPayload;
    options?: {
      delay?: number;
      retries?: number;
    };
  }>): Promise<Array<{ messageId: string } | null>> {
    if (!this.client) {
      console.warn('QStash is not configured, skipping batch jobs');
      return jobs.map(() => null);
    }

    const promises = jobs.map(({ payload, options }) =>
      this.enqueue(payload, options)
    );

    return Promise.all(promises);
  }

  // Schedule recurring jobs
  async scheduleRecurring(
    payload: JobPayload,
    cron: string,
    options?: {
      retries?: number;
    }
  ): Promise<{ scheduleId: string } | null> {
    if (!this.client) {
      console.warn('QStash is not configured, skipping scheduled job:', payload.type);
      return null;
    }

    try {
      const response = await this.client.schedules.create({
        destination: `${this.baseUrl}/api/jobs/process`,
        cron,
        body: JSON.stringify(payload),
        retries: options?.retries || 3,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        },
      });

      console.log(`Scheduled job ${payload.type} with ID: ${response.scheduleId}`);
      return { scheduleId: response.scheduleId };
    } catch (error) {
      console.error('Failed to schedule job:', error);
      throw error;
    }
  }

  // Cancel a scheduled job
  async cancelSchedule(scheduleId: string): Promise<void> {
    if (!this.client) {
      console.warn('QStash is not configured, cannot cancel schedule');
      return;
    }

    try {
      await this.client.schedules.delete(scheduleId);
      console.log(`Cancelled schedule: ${scheduleId}`);
    } catch (error) {
      console.error('Failed to cancel schedule:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const qstash = new QStashService();

// Helper functions for common jobs
export async function enqueueDailyStreakUpdate(userId?: string) {
  return qstash.enqueue({
    type: JobType.DAILY_STREAK_UPDATE,
    userId,
  });
}

export async function enqueueWeeklySummary(userId: string, delay?: number) {
  return qstash.enqueue({
    type: JobType.WEEKLY_SUMMARY,
    userId,
  }, { delay });
}

export async function enqueueNotification(
  userId: string,
  notificationType: string,
  data: Record<string, any>,
  delay?: number
) {
  return qstash.enqueue({
    type: JobType.SEND_NOTIFICATION,
    userId,
    notificationType,
    data,
  }, { delay });
}

export async function scheduleRecurringJobs() {
  // Schedule daily streak updates at 00:30 UTC
  await qstash.scheduleRecurring(
    { type: JobType.DAILY_STREAK_UPDATE },
    '30 0 * * *'
  );

  // Schedule weekly cleanup on Sundays at 02:00 UTC
  await qstash.scheduleRecurring(
    { type: JobType.CLEANUP_OLD_ENTRIES, daysToKeep: 90 },
    '0 2 * * 0'
  );
}