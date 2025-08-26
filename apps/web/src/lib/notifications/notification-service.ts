import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@habit-app/shared';

const expo = new Expo();

interface SendNotificationOptions {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  type: NotificationType;
}

class NotificationService {
  async sendToUser({
    userId,
    title,
    body,
    data,
    type,
  }: SendNotificationOptions): Promise<void> {
    try {
      // Get user's active push tokens
      const subscriptions = await prisma.pushSubscription.findMany({
        where: {
          userId,
          active: true,
        },
      });

      if (subscriptions.length === 0) {
        console.log(`No active push subscriptions for user ${userId}`);
        return;
      }

      // Create notification record
      await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          data,
        },
      });

      // Prepare push messages
      const messages: ExpoPushMessage[] = [];
      
      for (const subscription of subscriptions) {
        // Check if token is valid Expo push token
        if (!Expo.isExpoPushToken(subscription.token)) {
          console.error(`Invalid Expo push token: ${subscription.token}`);
          continue;
        }

        messages.push({
          to: subscription.token,
          sound: 'default',
          title,
          body,
          data: {
            ...data,
            type,
            notificationId: subscription.id,
          },
          priority: 'high',
          channelId: 'default',
        });
      }

      if (messages.length === 0) {
        console.log('No valid push tokens found');
        return;
      }

      // Send in chunks
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending notification chunk:', error);
        }
      }

      // Handle receipts later (should be done in a background job)
      setTimeout(() => this.handleReceipts(tickets), 15 * 60 * 1000); // 15 minutes
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  async sendHabitReminder(habitId: string): Promise<void> {
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: { user: true },
    });

    if (!habit || !habit.isActive) {
      return;
    }

    await this.sendToUser({
      userId: habit.userId,
      title: '⏰ Habit Reminder',
      body: `Time to complete your "${habit.name}" habit!`,
      data: {
        habitId: habit.id,
        habitName: habit.name,
      },
      type: 'habit_reminder',
    });
  }

  async sendStreakMilestone(habitId: string, streak: number): Promise<void> {
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: { user: true },
    });

    if (!habit) {
      return;
    }

    const milestones = [7, 30, 60, 90, 100, 365];
    if (!milestones.includes(streak)) {
      return;
    }

    await this.sendToUser({
      userId: habit.userId,
      title: '🎉 Milestone Achieved!',
      body: `Amazing! You've maintained "${habit.name}" for ${streak} days!`,
      data: {
        habitId: habit.id,
        habitName: habit.name,
        days: streak,
      },
      type: 'streak_milestone',
    });
  }

  async sendStreakBroken(habitId: string, previousStreak: number): Promise<void> {
    if (previousStreak < 3) {
      return; // Don't notify for very short streaks
    }

    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: { user: true },
    });

    if (!habit) {
      return;
    }

    await this.sendToUser({
      userId: habit.userId,
      title: '😔 Streak Broken',
      body: `Your ${previousStreak} day streak for "${habit.name}" has ended. Start again today!`,
      data: {
        habitId: habit.id,
        habitName: habit.name,
        previousStreak,
      },
      type: 'streak_broken',
    });
  }

  async sendWeeklySummary(userId: string): Promise<void> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get user's habits and completion stats
    const habits = await prisma.habit.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        entries: {
          where: {
            date: {
              gte: oneWeekAgo,
            },
          },
        },
      },
    });

    if (habits.length === 0) {
      return;
    }

    const totalHabits = habits.length;
    const totalCompletions = habits.reduce(
      (sum, habit) => sum + habit.entries.filter(e => e.completed).length,
      0
    );
    const possibleCompletions = totalHabits * 7;
    const completionRate = Math.round((totalCompletions / possibleCompletions) * 100);

    await this.sendToUser({
      userId,
      title: '📊 Your Weekly Summary',
      body: `You completed ${completionRate}% of your habits this week!`,
      data: {
        totalHabits,
        totalCompletions,
        completionRate,
      },
      type: 'weekly_summary',
    });
  }

  private async handleReceipts(tickets: any[]): Promise<void> {
    const receiptIds = tickets
      .filter(ticket => ticket.id)
      .map(ticket => ticket.id);

    if (receiptIds.length === 0) {
      return;
    }

    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];

          if (receipt.status === 'error') {
            console.error(`Error sending notification: ${receipt.message}`);
            
            if (receipt.details && receipt.details.error) {
              // Handle invalid tokens
              if (receipt.details.error === 'DeviceNotRegistered') {
                // Mark token as inactive
                // This should be implemented based on your token tracking
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching receipts:', error);
      }
    }
  }
}

export const notificationService = new NotificationService();