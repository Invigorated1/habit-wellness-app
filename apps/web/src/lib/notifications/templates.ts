/**
 * Smart Notification Templates
 * Context-aware messages for different scenarios
 */

import { NotificationTemplate, NotificationType, NotificationPriority, UserContext } from './types';
import { getHouseAscii } from '@/ascii';

// Helper to check if within practice window
function isWithinWindow(time: Date, window: { start: string; end: string }): boolean {
  const timeStr = time.toTimeString().slice(0, 5);
  return timeStr >= window.start && timeStr <= window.end;
}

// Helper to get time until end of window
function getMinutesUntilWindowEnd(time: Date, window: { start: string; end: string }): number {
  const [endHour, endMin] = window.end.split(':').map(Number);
  const endTime = new Date(time);
  endTime.setHours(endHour, endMin, 0, 0);
  return Math.floor((endTime.getTime() - time.getTime()) / 60000);
}

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = {
  // ===== PRACTICE TIME NOTIFICATIONS =====
  [NotificationType.PRACTICE_TIME]: {
    type: NotificationType.PRACTICE_TIME,
    templates: [
      // Morning practice - gentle start
      {
        condition: (ctx) => 
          ctx.practiceWindows.morning && 
          isWithinWindow(ctx.localTime, ctx.practiceWindows.morning) &&
          ctx.currentStreak < 7,
        priority: NotificationPriority.MEDIUM,
        content: (ctx) => ({
          title: `Good morning, ${ctx.house}`,
          body: `Start your day with intention. Your ${ctx.class} practice awaits.`,
          actionUrl: '/practice/morning',
        }),
        timing: (ctx) => {
          const [hour, min] = ctx.practiceWindows.morning!.start.split(':').map(Number);
          const time = new Date(ctx.localTime);
          time.setHours(hour, min + 15, 0, 0); // 15 min after window start
          return time;
        },
      },
      
      // Streak warrior - morning motivation
      {
        condition: (ctx) => 
          ctx.practiceWindows.morning && 
          isWithinWindow(ctx.localTime, ctx.practiceWindows.morning) &&
          ctx.currentStreak >= 7,
        priority: NotificationPriority.MEDIUM,
        content: (ctx) => ({
          title: `Day ${ctx.currentStreak + 1} awaits! 🔥`,
          body: `Your dedication inspires us all, ${ctx.house}. Ready?`,
          actionUrl: '/practice/morning',
        }),
        timing: (ctx) => ctx.localTime,
      },
      
      // Midday reset
      {
        condition: (ctx) => 
          ctx.practiceWindows.midday && 
          isWithinWindow(ctx.localTime, ctx.practiceWindows.midday),
        priority: NotificationPriority.LOW,
        content: (ctx) => ({
          title: 'Midday Reset',
          body: 'Take 5 minutes to recenter. Your future self will thank you.',
          actionUrl: '/practice/midday',
        }),
        timing: (ctx) => ctx.localTime,
      },
      
      // Evening wind-down
      {
        condition: (ctx) => 
          ctx.practiceWindows.evening && 
          isWithinWindow(ctx.localTime, ctx.practiceWindows.evening),
        priority: NotificationPriority.LOW,
        content: (ctx) => ({
          title: 'Evening Practice Time',
          body: 'End your day with presence. Sleep better, wake stronger.',
          actionUrl: '/practice/evening',
        }),
        timing: (ctx) => ctx.localTime,
      },
    ],
  },
  
  // ===== STREAK RISK NOTIFICATIONS =====
  [NotificationType.STREAK_RISK]: {
    type: NotificationType.STREAK_RISK,
    templates: [
      // 2 hours left to save streak
      {
        condition: (ctx) => {
          const hoursUntilMidnight = (24 - ctx.localTime.getHours());
          return ctx.currentStreak >= 3 && hoursUntilMidnight <= 2;
        },
        priority: NotificationPriority.HIGH,
        content: (ctx) => ({
          title: `⚠️ ${ctx.currentStreak} day streak at risk!`,
          body: ctx.freezeTokens > 0 
            ? 'Complete a quick practice or use a freeze token'
            : '2 hours left! Even 60 seconds counts.',
          actionUrl: '/practice/quick',
        }),
        timing: (ctx) => ctx.localTime,
      },
      
      // Gentle reminder - 4 hours left
      {
        condition: (ctx) => {
          const hoursUntilMidnight = (24 - ctx.localTime.getHours());
          return ctx.currentStreak >= 1 && hoursUntilMidnight <= 4;
        },
        priority: NotificationPriority.MEDIUM,
        content: (ctx) => ({
          title: 'Keep your streak alive',
          body: `Don't let day ${ctx.currentStreak + 1} slip away. You've got this!`,
          actionUrl: '/dashboard',
        }),
        timing: (ctx) => ctx.localTime,
      },
    ],
  },
  
  // ===== PEER ACTIVITY NOTIFICATIONS =====
  [NotificationType.PEER_ACTIVITY]: {
    type: NotificationType.PEER_ACTIVITY,
    templates: [
      // Morning house activity
      {
        condition: (ctx) => ctx.localTime.getHours() >= 6 && ctx.localTime.getHours() <= 9,
        priority: NotificationPriority.LOW,
        content: (ctx) => ({
          title: `${Math.floor(Math.random() * 5) + 3} ${ctx.house}s are practicing now`,
          body: 'Join your house in morning practice',
          actionUrl: '/house/live',
        }),
        timing: (ctx) => ctx.localTime,
      },
      
      // House milestone
      {
        condition: (ctx) => Math.random() < 0.1, // 10% chance
        priority: NotificationPriority.LOW,
        content: (ctx) => ({
          title: `Your ${ctx.house} house is on fire! 🔥`,
          body: '85% of members practiced yesterday. Keep the momentum!',
          actionUrl: '/house',
        }),
        timing: (ctx) => ctx.localTime,
      },
    ],
  },
  
  // ===== ACHIEVEMENT CLOSE NOTIFICATIONS =====
  [NotificationType.ACHIEVEMENT_CLOSE]: {
    type: NotificationType.ACHIEVEMENT_CLOSE,
    templates: [
      // One day from weekly streak
      {
        condition: (ctx) => ctx.currentStreak === 6,
        priority: NotificationPriority.MEDIUM,
        content: (ctx) => ({
          title: '🏆 One day from Week Warrior!',
          body: 'Complete today\'s practice to unlock your first major badge',
          actionUrl: '/achievements',
        }),
        timing: (ctx) => ctx.localTime,
      },
      
      // Close to level up
      {
        condition: (ctx) => Math.random() < 0.15, // Simulated
        priority: NotificationPriority.LOW,
        content: (ctx) => ({
          title: 'You\'re 87% to Level 5!',
          body: 'One more practice to level up and unlock new content',
          actionUrl: '/progress',
        }),
        timing: (ctx) => ctx.localTime,
      },
    ],
  },
  
  // ===== COMEBACK NOTIFICATIONS =====
  [NotificationType.COMEBACK]: {
    type: NotificationType.COMEBACK,
    templates: [
      // 3 days away - gentle
      {
        condition: (ctx) => {
          const daysSince = Math.floor((Date.now() - ctx.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24));
          return daysSince === 3;
        },
        priority: NotificationPriority.LOW,
        content: (ctx) => ({
          title: `Your ${ctx.class} practice misses you`,
          body: 'Just 2 minutes to reconnect with your practice',
          actionUrl: '/practice/welcome-back',
        }),
        timing: (ctx) => ctx.localTime,
      },
      
      // 7 days away - house mention
      {
        condition: (ctx) => {
          const daysSince = Math.floor((Date.now() - ctx.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24));
          return daysSince === 7;
        },
        priority: NotificationPriority.MEDIUM,
        content: (ctx) => ({
          title: `The ${ctx.house} house noticed your absence`,
          body: 'Your journey continues whenever you\'re ready. We\'re here.',
          actionUrl: '/welcome-back',
        }),
        timing: (ctx) => ctx.localTime,
      },
    ],
  },
  
  // ===== MILESTONE NOTIFICATIONS =====
  [NotificationType.MILESTONE]: {
    type: NotificationType.MILESTONE,
    templates: [
      // First week complete
      {
        condition: (ctx) => ctx.currentStreak === 7,
        priority: NotificationPriority.HIGH,
        content: (ctx) => ({
          title: '🎉 One Week Strong!',
          body: 'You\'ve earned the Week Warrior badge and a freeze token!',
          actionUrl: '/achievements/week-warrior',
        }),
        timing: (ctx) => ctx.localTime,
      },
      
      // 30 day milestone approaching
      {
        condition: (ctx) => ctx.currentStreak === 25,
        priority: NotificationPriority.MEDIUM,
        content: (ctx) => ({
          title: '5 days from a legendary milestone',
          body: 'The 30-day transformation badge awaits...',
          actionUrl: '/milestones',
        }),
        timing: (ctx) => ctx.localTime,
      },
    ],
  },
};

// Smart timing algorithm
export function getOptimalNotificationTime(
  type: NotificationType,
  context: UserContext
): Date | null {
  // Check if user is in DND
  for (const dnd of context.dndWindows) {
    if (isWithinWindow(context.localTime, dnd)) {
      return null; // Don't notify during DND
    }
  }
  
  // Get relevant templates
  const templates = NOTIFICATION_TEMPLATES[type]?.templates || [];
  
  // Find first matching template
  for (const template of templates) {
    if (template.condition(context)) {
      return template.timing(context);
    }
  }
  
  return null;
}