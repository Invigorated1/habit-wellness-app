import { z } from 'zod';

// Core event categories
export const EventCategory = {
  USER: 'user',
  HABIT: 'habit',
  ENGAGEMENT: 'engagement',
  PERFORMANCE: 'performance',
  REVENUE: 'revenue',
} as const;

// User lifecycle events
export const UserEvents = {
  // Acquisition
  SIGN_UP_STARTED: 'user.sign_up_started',
  SIGN_UP_COMPLETED: 'user.sign_up_completed',
  SIGN_IN: 'user.sign_in',
  SIGN_OUT: 'user.sign_out',
  
  // Activation
  FIRST_HABIT_CREATED: 'user.first_habit_created',
  FIRST_HABIT_COMPLETED: 'user.first_habit_completed',
  ACTIVATED: 'user.activated', // When user completes activation criteria
  
  // Retention
  RETURNED: 'user.returned',
  CHURNED: 'user.churned',
  REACTIVATED: 'user.reactivated',
} as const;

// Habit events
export const HabitEvents = {
  CREATED: 'habit.created',
  UPDATED: 'habit.updated',
  DELETED: 'habit.deleted',
  COMPLETED: 'habit.completed',
  UNCOMPLETED: 'habit.uncompleted',
  STREAK_MILESTONE: 'habit.streak_milestone',
  STREAK_BROKEN: 'habit.streak_broken',
  SHARED: 'habit.shared',
} as const;

// Engagement events
export const EngagementEvents = {
  PAGE_VIEWED: 'engagement.page_viewed',
  FEATURE_USED: 'engagement.feature_used',
  SESSION_STARTED: 'engagement.session_started',
  SESSION_ENDED: 'engagement.session_ended',
  NOTIFICATION_RECEIVED: 'engagement.notification_received',
  NOTIFICATION_CLICKED: 'engagement.notification_clicked',
} as const;

// Performance events
export const PerformanceEvents = {
  API_LATENCY: 'performance.api_latency',
  PAGE_LOAD: 'performance.page_load',
  ERROR_OCCURRED: 'performance.error_occurred',
} as const;

// Revenue events (for future monetization)
export const RevenueEvents = {
  TRIAL_STARTED: 'revenue.trial_started',
  TRIAL_CONVERTED: 'revenue.trial_converted',
  SUBSCRIPTION_CREATED: 'revenue.subscription_created',
  SUBSCRIPTION_CANCELLED: 'revenue.subscription_cancelled',
  PAYMENT_SUCCEEDED: 'revenue.payment_succeeded',
  PAYMENT_FAILED: 'revenue.payment_failed',
} as const;

// Event property schemas
export const userPropertiesSchema = z.object({
  user_id: z.string(),
  email: z.string().email().optional(),
  created_at: z.string().datetime(),
  cohort: z.string().optional(),
  platform: z.enum(['web', 'ios', 'android']),
  app_version: z.string().optional(),
});

export const habitPropertiesSchema = z.object({
  habit_id: z.string(),
  habit_name: z.string(),
  has_description: z.boolean(),
  streak: z.number().int().min(0),
  longest_streak: z.number().int().min(0),
  completion_rate: z.number().min(0).max(100),
});

export const sessionPropertiesSchema = z.object({
  session_id: z.string(),
  duration_ms: z.number().int().min(0),
  page_views: z.number().int().min(0),
  actions_count: z.number().int().min(0),
});

// Combined event schema
export const analyticsEventSchema = z.object({
  event: z.string(),
  user_id: z.string().optional(),
  anonymous_id: z.string().optional(),
  session_id: z.string().optional(),
  timestamp: z.string().datetime(),
  properties: z.record(z.any()),
  context: z.object({
    page: z.object({
      path: z.string(),
      title: z.string().optional(),
      url: z.string().optional(),
    }).optional(),
    device: z.object({
      type: z.enum(['mobile', 'tablet', 'desktop']),
      os: z.string().optional(),
      browser: z.string().optional(),
    }).optional(),
    campaign: z.object({
      source: z.string().optional(),
      medium: z.string().optional(),
      name: z.string().optional(),
    }).optional(),
  }).optional(),
});

// KPI definitions
export const KPIDefinitions = {
  // North Star Metric
  WAU: {
    name: 'Weekly Active Users',
    description: 'Users who completed at least one habit in the last 7 days',
    query: 'unique_users_with_habit_completion_last_7_days',
  },
  
  // Activation metrics
  ACTIVATION_RATE: {
    name: 'Activation Rate',
    description: 'Users who created first habit within 24h of signup',
    query: 'users_with_first_habit_within_24h / total_signups',
  },
  
  // Retention metrics
  D7_RETENTION: {
    name: 'Day 7 Retention',
    description: 'Users active on day 7 after signup',
    query: 'users_active_on_day_7 / cohort_size',
  },
  
  D30_RETENTION: {
    name: 'Day 30 Retention',
    description: 'Users active on day 30 after signup',
    query: 'users_active_on_day_30 / cohort_size',
  },
  
  // Engagement metrics
  HABITS_PER_USER: {
    name: 'Average Habits per User',
    description: 'Average number of active habits per user',
    query: 'total_active_habits / total_active_users',
  },
  
  COMPLETION_RATE: {
    name: 'Daily Completion Rate',
    description: 'Percentage of habits completed daily',
    query: 'completed_habits_today / total_habits_due_today',
  },
  
  STREAK_RETENTION: {
    name: 'Streak Retention',
    description: 'Users maintaining 7+ day streaks',
    query: 'users_with_7_day_streak / total_active_users',
  },
};

// Helper to get all events
export const AllEvents = {
  ...UserEvents,
  ...HabitEvents,
  ...EngagementEvents,
  ...PerformanceEvents,
  ...RevenueEvents,
} as const;

export type AnalyticsEvent = typeof AllEvents[keyof typeof AllEvents];
export type UserProperties = z.infer<typeof userPropertiesSchema>;
export type HabitProperties = z.infer<typeof habitPropertiesSchema>;
export type SessionProperties = z.infer<typeof sessionPropertiesSchema>;