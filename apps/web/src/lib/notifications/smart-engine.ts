/**
 * @fileoverview Smart Notification Engine
 * @module notifications/smart-engine
 * @description Orchestrates context-aware notifications based on user behavior, preferences, and context.
 * Implements cooldown periods, daily limits, and intelligent batching to prevent notification fatigue.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { 
  UserContext, 
  NotificationType, 
  SmartNotification,
  NotificationChannel,
  NotificationPriority 
} from './types';
import { NOTIFICATION_TEMPLATES, getOptimalNotificationTime } from './templates';

export class SmartNotificationEngine {
  private readonly COOLDOWN_PERIODS = {
    [NotificationPriority.LOW]: 4 * 60 * 60 * 1000, // 4 hours
    [NotificationPriority.MEDIUM]: 2 * 60 * 60 * 1000, // 2 hours
    [NotificationPriority.HIGH]: 30 * 60 * 1000, // 30 minutes
    [NotificationPriority.URGENT]: 0, // No cooldown
  };
  
  private readonly MAX_DAILY_NOTIFICATIONS = {
    minimal: 2,
    balanced: 5,
    frequent: 10,
  };
  
  /**
   * Analyze user context and determine what notifications to send
   */
  async analyzeAndSchedule(userId: string): Promise<SmartNotification[]> {
    try {
      const context = await this.getUserContext(userId);
      if (!context) return [];
      
      const notifications: SmartNotification[] = [];
      
      // Check each notification type
      for (const type of Object.values(NotificationType)) {
        const shouldSend = await this.shouldSendNotification(type, context);
        if (!shouldSend) continue;
        
        const notification = await this.createNotification(type, context);
        if (notification) {
          notifications.push(notification);
        }
      }
      
      // Apply smart batching
      return this.batchNotifications(notifications, context);
    } catch (error) {
      logger.error('Failed to analyze notifications', { userId, error });
      return [];
    }
  }
  
  /**
   * Get comprehensive user context
   */
  private async getUserContext(userId: string): Promise<UserContext | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        assignments: {
          where: { active: true },
          take: 1,
        },
      },
    });
    
    if (!user || !user.profile || !user.assignments[0]) {
      return null;
    }
    
    // Get streak data
    const streakData = await this.getStreakData(userId);
    
    // Get practice windows from profile
    const windows = user.profile.dndWindows as any || {};
    
    return {
      userId,
      timezone: user.profile.timezone,
      localTime: new Date(), // Convert to user timezone in real app
      lastActiveAt: user.profile.updatedAt || user.createdAt,
      currentStreak: streakData.current,
      longestStreak: streakData.best,
      practiceWindows: {
        morning: windows.morning,
        midday: windows.midday,
        evening: windows.evening,
      },
      dndWindows: windows.dnd || [],
      house: user.assignments[0].house,
      class: user.assignments[0].class,
      preferences: {
        notificationFrequency: 'balanced', // From profile in real app
        channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
      },
    };
  }
  
  /**
   * Check if we should send a notification
   */
  private async shouldSendNotification(
    type: NotificationType,
    context: UserContext
  ): Promise<boolean> {
    // Check cooldown
    const lastSent = await this.getLastNotificationTime(context.userId, type);
    if (lastSent) {
      const cooldownPeriod = this.getCooldownPeriod(type);
      if (Date.now() - lastSent.getTime() < cooldownPeriod) {
        return false;
      }
    }
    
    // Check daily limit
    const dailyCount = await this.getDailyNotificationCount(context.userId);
    const maxDaily = this.MAX_DAILY_NOTIFICATIONS[context.preferences.notificationFrequency];
    if (dailyCount >= maxDaily) {
      return false;
    }
    
    // Check if any template matches
    const templates = NOTIFICATION_TEMPLATES[type]?.templates || [];
    return templates.some(t => t.condition(context));
  }
  
  /**
   * Create a smart notification
   */
  private async createNotification(
    type: NotificationType,
    context: UserContext
  ): Promise<SmartNotification | null> {
    const templates = NOTIFICATION_TEMPLATES[type]?.templates || [];
    
    // Find first matching template
    for (const template of templates) {
      if (template.condition(context)) {
        const scheduledFor = template.timing(context);
        if (!scheduledFor) continue;
        
        const content = template.content(context);
        
        return {
          id: `${context.userId}-${type}-${Date.now()}`,
          type,
          priority: template.priority,
          channel: this.selectChannel(template.priority, context),
          content,
          scheduledFor,
          expiresAt: new Date(scheduledFor.getTime() + 24 * 60 * 60 * 1000), // 24h expiry
          context: {
            reason: `Matched template for ${type}`,
            userState: {
              currentStreak: context.currentStreak,
              house: context.house,
              lastActiveAt: context.lastActiveAt,
            },
            triggers: [`streak:${context.currentStreak}`, `house:${context.house}`],
          },
        };
      }
    }
    
    return null;
  }
  
  /**
   * Batch notifications intelligently
   */
  private batchNotifications(
    notifications: SmartNotification[],
    context: UserContext
  ): SmartNotification[] {
    // Sort by priority and time
    notifications.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = {
          [NotificationPriority.URGENT]: 0,
          [NotificationPriority.HIGH]: 1,
          [NotificationPriority.MEDIUM]: 2,
          [NotificationPriority.LOW]: 3,
        };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.scheduledFor.getTime() - b.scheduledFor.getTime();
    });
    
    // Remove duplicates and limit
    const seen = new Set<NotificationType>();
    const batched: SmartNotification[] = [];
    
    for (const notif of notifications) {
      if (!seen.has(notif.type)) {
        seen.add(notif.type);
        batched.push(notif);
        
        if (batched.length >= 3) break; // Max 3 at once
      }
    }
    
    return batched;
  }
  
  /**
   * Select best channel based on priority and preferences
   */
  private selectChannel(
    priority: NotificationPriority,
    context: UserContext
  ): NotificationChannel {
    if (priority === NotificationPriority.URGENT) {
      return NotificationChannel.PUSH;
    }
    
    // Use user's preferred channel
    return context.preferences.channels[0] || NotificationChannel.IN_APP;
  }
  
  // Helper methods
  private async getLastNotificationTime(
    userId: string,
    type: NotificationType
  ): Promise<Date | null> {
    const key = `notif:last:${userId}:${type}`;
    const timestamp = await redis.get(key);
    return timestamp ? new Date(Number(timestamp)) : null;
  }
  
  private async getDailyNotificationCount(userId: string): Promise<number> {
    const key = `notif:daily:${userId}:${new Date().toDateString()}`;
    const count = await redis.get(key);
    return Number(count) || 0;
  }
  
  private getCooldownPeriod(type: NotificationType): number {
    // Map notification types to priorities (simplified)
    const typePriority = {
      [NotificationType.STREAK_RISK]: NotificationPriority.HIGH,
      [NotificationType.PRACTICE_TIME]: NotificationPriority.MEDIUM,
      [NotificationType.PEER_ACTIVITY]: NotificationPriority.LOW,
      [NotificationType.ACHIEVEMENT_CLOSE]: NotificationPriority.MEDIUM,
      [NotificationType.HOUSE_EVENT]: NotificationPriority.LOW,
      [NotificationType.COMEBACK]: NotificationPriority.MEDIUM,
      [NotificationType.MILESTONE]: NotificationPriority.HIGH,
      [NotificationType.SOCIAL_NUDGE]: NotificationPriority.LOW,
    };
    
    return this.COOLDOWN_PERIODS[typePriority[type]] || this.COOLDOWN_PERIODS[NotificationPriority.MEDIUM];
  }
  
  private async getStreakData(userId: string): Promise<{ current: number; best: number }> {
    // In real app, fetch from database
    return { current: 5, best: 12 };
  }
  
  /**
   * Send a notification
   */
  async send(notification: SmartNotification): Promise<boolean> {
    try {
      // Log the send
      await this.logNotification(notification);
      
      // Update cooldown
      await redis.set(
        `notif:last:${notification.context.userState.userId}:${notification.type}`,
        Date.now(),
        { ex: 24 * 60 * 60 } // 24h expiry
      );
      
      // Increment daily count
      const countKey = `notif:daily:${notification.context.userState.userId}:${new Date().toDateString()}`;
      await redis.incr(countKey);
      await redis.expire(countKey, 24 * 60 * 60);
      
      // Send based on channel
      switch (notification.channel) {
        case NotificationChannel.PUSH:
          // Integrate with push service (Firebase, OneSignal, etc)
          logger.info('Sending push notification', { notification });
          break;
          
        case NotificationChannel.IN_APP:
          // Store in database for in-app display
          await this.storeInAppNotification(notification);
          break;
          
        case NotificationChannel.EMAIL:
          // Queue email job
          logger.info('Queueing email notification', { notification });
          break;
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to send notification', { notification, error });
      return false;
    }
  }
  
  private async logNotification(notification: SmartNotification): Promise<void> {
    // In real app, store in database
    logger.info('Notification sent', {
      id: notification.id,
      type: notification.type,
      userId: notification.context.userState.userId,
    });
  }
  
  private async storeInAppNotification(notification: SmartNotification): Promise<void> {
    // Store in database for in-app notification center
    // This would create a record that the UI can fetch
  }
}

export const smartNotifications = new SmartNotificationEngine();