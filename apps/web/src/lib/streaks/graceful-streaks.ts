/**
 * Graceful Streak System
 * Forgiveness, freeze tokens, and comeback mechanics
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastPracticeDate: Date | null;
  freezeTokens: number;
  frozenDates: Date[];
  totalPracticeDays: number;
}

export interface StreakUpdate {
  maintained: boolean;
  increased: boolean;
  broken: boolean;
  froze: boolean;
  comeback: boolean;
  message: string;
}

export class GracefulStreakSystem {
  private readonly FREEZE_TOKEN_EARN_RATE = 7; // Earn 1 token per 7 days
  private readonly COMEBACK_THRESHOLD = 3; // Days away for comeback bonus
  private readonly PARTIAL_CREDIT_THRESHOLD = 60; // Seconds for partial credit
  private readonly GRACE_PERIOD_HOURS = 4; // Extra hours past midnight
  
  /**
   * Check and update user's streak
   */
  async updateStreak(userId: string, practiceCompleted: boolean = true): Promise<StreakUpdate> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const now = new Date();
    const today = this.getDateOnly(now);
    const streakData = await this.getStreakData(userId);
    
    // Check if already practiced today
    const lastPractice = streakData.lastPracticeDate;
    if (lastPractice && this.isSameDay(lastPractice, now)) {
      return {
        maintained: true,
        increased: false,
        broken: false,
        froze: false,
        comeback: false,
        message: 'Already practiced today! Keep it up!',
      };
    }
    
    // Calculate days since last practice
    const daysSinceLastPractice = lastPractice 
      ? this.getDaysBetween(lastPractice, now)
      : null;
    
    let update: StreakUpdate = {
      maintained: false,
      increased: false,
      broken: false,
      froze: false,
      comeback: false,
      message: '',
    };
    
    if (!practiceCompleted) {
      // Just checking status
      if (daysSinceLastPractice === null) {
        update.message = 'Start your first practice!';
      } else if (daysSinceLastPractice === 0) {
        update.message = 'Practice completed today!';
        update.maintained = true;
      } else if (daysSinceLastPractice === 1) {
        update.message = 'Keep your streak alive today!';
      } else {
        update.message = `${daysSinceLastPractice} days since last practice`;
        update.broken = true;
      }
      return update;
    }
    
    // Handle practice completion
    if (daysSinceLastPractice === null || daysSinceLastPractice === 0) {
      // First practice or same day
      await this.incrementStreak(userId, 1);
      update.increased = true;
      update.message = streakData.currentStreak === 0 
        ? 'Journey started! 1 day streak!' 
        : `Streak maintained! ${streakData.currentStreak + 1} days!`;
    } else if (daysSinceLastPractice === 1) {
      // Perfect continuation
      await this.incrementStreak(userId, 1);
      update.increased = true;
      update.maintained = true;
      
      // Award freeze token every 7 days
      const newStreak = streakData.currentStreak + 1;
      if (newStreak % this.FREEZE_TOKEN_EARN_RATE === 0) {
        await this.awardFreezeToken(userId);
        update.message = `${newStreak} day streak! Earned a freeze token! 🛡️`;
      } else {
        update.message = `Streak extended to ${newStreak} days!`;
      }
    } else if (daysSinceLastPractice === 2 && streakData.freezeTokens > 0) {
      // Offer to use freeze token
      await this.useFreezeToken(userId, this.addDays(lastPractice!, 1));
      await this.incrementStreak(userId, 1);
      update.froze = true;
      update.maintained = true;
      update.message = `Used a freeze token to save your ${streakData.currentStreak + 1} day streak! 🛡️`;
    } else if (daysSinceLastPractice! >= this.COMEBACK_THRESHOLD) {
      // Comeback bonus
      await this.resetStreak(userId);
      update.comeback = true;
      update.message = `Welcome back! Your resilience is inspiring. New streak started! 💪`;
      
      // Award comeback badge
      await this.awardComebackBadge(userId);
    } else {
      // Streak broken
      await this.resetStreak(userId);
      update.broken = true;
      update.message = `Streak reset, but every day is a fresh start! Previous best: ${streakData.bestStreak} days`;
    }
    
    // Update last practice date
    await this.updateLastPracticeDate(userId, now);
    
    return update;
  }
  
  /**
   * Get user's streak data
   */
  async getStreakData(userId: string): Promise<StreakData> {
    // In a real app, this would query from database
    // For now, using mock data
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastPracticeDate: null,
      freezeTokens: 1,
      frozenDates: [],
      totalPracticeDays: 0,
    };
  }
  
  /**
   * Award a freeze token
   */
  private async awardFreezeToken(userId: string): Promise<void> {
    logger.info('Awarding freeze token', { userId });
    // Update database
  }
  
  /**
   * Use a freeze token
   */
  private async useFreezeToken(userId: string, dateToFreeze: Date): Promise<void> {
    logger.info('Using freeze token', { userId, dateToFreeze });
    // Update database
  }
  
  /**
   * Award comeback badge
   */
  private async awardComebackBadge(userId: string): Promise<void> {
    logger.info('Awarding comeback badge', { userId });
    // Create badge record
  }
  
  /**
   * Increment streak
   */
  private async incrementStreak(userId: string, days: number): Promise<void> {
    // Update database
  }
  
  /**
   * Reset streak
   */
  private async resetStreak(userId: string): Promise<void> {
    // Update database
  }
  
  /**
   * Update last practice date
   */
  private async updateLastPracticeDate(userId: string, date: Date): Promise<void> {
    // Update database
  }
  
  // Date utilities
  private getDateOnly(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  
  private isSameDay(date1: Date, date2: Date): boolean {
    return this.getDateOnly(date1).getTime() === this.getDateOnly(date2).getTime();
  }
  
  private getDaysBetween(date1: Date, date2: Date): number {
    const d1 = this.getDateOnly(date1);
    const d2 = this.getDateOnly(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
  
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

export const gracefulStreaks = new GracefulStreakSystem();