import { z } from 'zod';

// Notification type enum
export const notificationTypeSchema = z.enum([
  'habit_reminder',
  'streak_milestone',
  'streak_broken',
  'achievement_unlocked',
  'share_received',
  'weekly_summary',
]);

// Notification schema
export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: z.record(z.any()).optional(),
  read: z.boolean().default(false),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

// Push notification subscription
export const pushSubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  platform: z.enum(['web', 'ios', 'android']),
  token: z.string(),
  deviceId: z.string().optional(),
  active: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Notification preferences
export const notificationPreferencesSchema = z.object({
  userId: z.string(),
  habitReminders: z.boolean().default(true),
  reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('09:00'),
  streakMilestones: z.boolean().default(true),
  achievements: z.boolean().default(true),
  weeklySummary: z.boolean().default(true),
  pushEnabled: z.boolean().default(true),
  emailEnabled: z.boolean().default(false),
});

// Types
export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type PushSubscription = z.infer<typeof pushSubscriptionSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;