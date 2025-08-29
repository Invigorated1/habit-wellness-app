import { describe, it, expect, beforeEach } from 'vitest';
import { GracefulStreakSystem } from '../graceful-streaks';
import { sub } from 'date-fns';

describe('GracefulStreakSystem', () => {
  let streakSystem: GracefulStreakSystem;

  beforeEach(() => {
    streakSystem = new GracefulStreakSystem();
  });

  describe('checkIn', () => {
    it('should start a new streak on first check-in', () => {
      const result = streakSystem.checkIn({
        userId: 'user-1',
        streakLength: 0,
        lastCheckIn: null,
        freezeTokens: 3,
        gracePeriodUsed: false,
      });

      expect(result.newStreakLength).toBe(1);
      expect(result.streakStatus).toBe('continued');
      expect(result.freezeTokensRemaining).toBe(3);
    });

    it('should continue streak for consecutive days', () => {
      const yesterday = sub(new Date(), { days: 1 });
      
      const result = streakSystem.checkIn({
        userId: 'user-1',
        streakLength: 5,
        lastCheckIn: yesterday,
        freezeTokens: 3,
        gracePeriodUsed: false,
      });

      expect(result.newStreakLength).toBe(6);
      expect(result.streakStatus).toBe('continued');
    });

    it('should handle same-day check-ins', () => {
      const today = new Date();
      
      const result = streakSystem.checkIn({
        userId: 'user-1',
        streakLength: 5,
        lastCheckIn: today,
        freezeTokens: 3,
        gracePeriodUsed: false,
      });

      expect(result.newStreakLength).toBe(5);
      expect(result.streakStatus).toBe('maintained');
    });

    it('should use grace period for one missed day', () => {
      const twoDaysAgo = sub(new Date(), { days: 2 });
      
      const result = streakSystem.checkIn({
        userId: 'user-1',
        streakLength: 10,
        lastCheckIn: twoDaysAgo,
        freezeTokens: 3,
        gracePeriodUsed: false,
      });

      expect(result.newStreakLength).toBe(11);
      expect(result.streakStatus).toBe('grace_period_used');
      expect(result.freezeTokensRemaining).toBe(3);
    });

    it('should use freeze token when available', () => {
      const threeDaysAgo = sub(new Date(), { days: 3 });
      
      const result = streakSystem.checkIn({
        userId: 'user-1',
        streakLength: 15,
        lastCheckIn: threeDaysAgo,
        freezeTokens: 2,
        gracePeriodUsed: true,
      });

      expect(result.newStreakLength).toBe(15); // Maintained, not increased
      expect(result.streakStatus).toBe('frozen');
      expect(result.freezeTokensRemaining).toBe(1);
    });

    it('should break streak when no protection available', () => {
      const fourDaysAgo = sub(new Date(), { days: 4 });
      
      const result = streakSystem.checkIn({
        userId: 'user-1',
        streakLength: 20,
        lastCheckIn: fourDaysAgo,
        freezeTokens: 0,
        gracePeriodUsed: true,
      });

      expect(result.newStreakLength).toBe(1);
      expect(result.streakStatus).toBe('broken');
      expect(result.comebackBonus).toBe(true);
    });
  });

  describe('calculateMilestone', () => {
    it('should identify milestone achievements', () => {
      const milestones = [
        { streak: 7, expected: { isMilestone: true, name: 'Week Warrior' } },
        { streak: 30, expected: { isMilestone: true, name: 'Monthly Master' } },
        { streak: 100, expected: { isMilestone: true, name: 'Century Club' } },
        { streak: 365, expected: { isMilestone: true, name: 'Year of Dedication' } },
        { streak: 8, expected: { isMilestone: false, name: null } },
      ];

      milestones.forEach(({ streak, expected }) => {
        const result = streakSystem.calculateMilestone(streak);
        expect(result.isMilestone).toBe(expected.isMilestone);
        if (expected.name) {
          expect(result.milestoneName).toBe(expected.name);
        }
      });
    });

    it('should calculate next milestone correctly', () => {
      const tests = [
        { current: 5, nextMilestone: 7, daysUntil: 2 },
        { current: 7, nextMilestone: 14, daysUntil: 7 },
        { current: 25, nextMilestone: 30, daysUntil: 5 },
        { current: 100, nextMilestone: 180, daysUntil: 80 },
      ];

      tests.forEach(({ current, nextMilestone, daysUntil }) => {
        const result = streakSystem.calculateMilestone(current);
        expect(result.nextMilestone).toBe(nextMilestone);
        expect(result.daysUntilNextMilestone).toBe(daysUntil);
      });
    });
  });

  describe('getProtectionStatus', () => {
    it('should show available protections', () => {
      const status = streakSystem.getProtectionStatus({
        freezeTokens: 2,
        gracePeriodUsed: false,
      });

      expect(status.hasProtection).toBe(true);
      expect(status.protectionType).toBe('both');
      expect(status.message).toContain('2 freeze tokens');
      expect(status.message).toContain('grace period');
    });

    it('should show only freeze tokens when grace period used', () => {
      const status = streakSystem.getProtectionStatus({
        freezeTokens: 1,
        gracePeriodUsed: true,
      });

      expect(status.hasProtection).toBe(true);
      expect(status.protectionType).toBe('freeze');
      expect(status.message).toContain('1 freeze token');
    });

    it('should show no protection when all used', () => {
      const status = streakSystem.getProtectionStatus({
        freezeTokens: 0,
        gracePeriodUsed: true,
      });

      expect(status.hasProtection).toBe(false);
      expect(status.protectionType).toBe('none');
      expect(status.message).toContain('No protection');
    });
  });

  describe('edge cases', () => {
    it('should handle very long streaks', () => {
      const result = streakSystem.checkIn({
        userId: 'user-1',
        streakLength: 999,
        lastCheckIn: sub(new Date(), { days: 1 }),
        freezeTokens: 5,
        gracePeriodUsed: false,
      });

      expect(result.newStreakLength).toBe(1000);
      expect(result.streakStatus).toBe('continued');
    });

    it('should handle future dates gracefully', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = streakSystem.checkIn({
        userId: 'user-1',
        streakLength: 10,
        lastCheckIn: tomorrow,
        freezeTokens: 3,
        gracePeriodUsed: false,
      });

      // Should treat as same day
      expect(result.newStreakLength).toBe(10);
      expect(result.streakStatus).toBe('maintained');
    });
  });
});