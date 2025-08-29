/**
 * Smart Notification Types and Interfaces
 */

export enum NotificationType {
  PRACTICE_TIME = 'PRACTICE_TIME',
  STREAK_RISK = 'STREAK_RISK',
  PEER_ACTIVITY = 'PEER_ACTIVITY',
  ACHIEVEMENT_CLOSE = 'ACHIEVEMENT_CLOSE',
  HOUSE_EVENT = 'HOUSE_EVENT',
  COMEBACK = 'COMEBACK',
  MILESTONE = 'MILESTONE',
  SOCIAL_NUDGE = 'SOCIAL_NUDGE',
}

export enum NotificationChannel {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
  SMS = 'SMS',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface UserContext {
  userId: string;
  timezone: string;
  localTime: Date;
  lastActiveAt: Date;
  currentStreak: number;
  longestStreak: number;
  practiceWindows: {
    morning?: { start: string; end: string };
    midday?: { start: string; end: string };
    evening?: { start: string; end: string };
  };
  dndWindows: Array<{ start: string; end: string }>;
  house: string;
  class: string;
  preferences: {
    notificationFrequency: 'minimal' | 'balanced' | 'frequent';
    channels: NotificationChannel[];
  };
}

export interface NotificationContent {
  title: string;
  body: string;
  actionUrl?: string;
  imageUrl?: string;
  data?: Record<string, any>;
}

export interface SmartNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  channel: NotificationChannel;
  content: NotificationContent;
  scheduledFor: Date;
  expiresAt?: Date;
  context: {
    reason: string;
    userState: Partial<UserContext>;
    triggers: string[];
  };
}

export interface NotificationTemplate {
  type: NotificationType;
  templates: Array<{
    condition: (context: UserContext) => boolean;
    priority: NotificationPriority;
    content: (context: UserContext) => NotificationContent;
    timing: (context: UserContext) => Date;
  }>;
}

export interface NotificationLog {
  notificationId: string;
  userId: string;
  type: NotificationType;
  sentAt: Date;
  openedAt?: Date;
  clickedAt?: Date;
  dismissed?: boolean;
  effectiveness?: number; // 0-1 score based on action taken
}