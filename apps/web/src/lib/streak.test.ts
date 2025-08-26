import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateStreak, updateHabitStreak, toggleHabitCompletion } from './streak';
import { startOfDay, subDays } from 'date-fns';

// Mock prisma
vi.mock('./prisma', () => ({
  prisma: {
    habitEntry: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    habit: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const { prisma } = await import('./prisma');

describe('Streak Calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateStreak', () => {
    it('returns 0 for no entries', async () => {
      vi.mocked(prisma.habitEntry.findMany).mockResolvedValue([]);

      const result = await calculateStreak('habit1');

      expect(result).toEqual({ currentStreak: 0, longestStreak: 0 });
    });

    it('calculates current streak for consecutive days', async () => {
      const today = startOfDay(new Date());
      const entries = [
        { date: today, completed: true },
        { date: subDays(today, 1), completed: true },
        { date: subDays(today, 2), completed: true },
      ];

      vi.mocked(prisma.habitEntry.findMany).mockResolvedValue(entries as any);

      const result = await calculateStreak('habit1');

      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
    });

    it('breaks current streak if last completion was more than 1 day ago', async () => {
      const today = startOfDay(new Date());
      const entries = [
        { date: subDays(today, 3), completed: true },
        { date: subDays(today, 4), completed: true },
        { date: subDays(today, 5), completed: true },
      ];

      vi.mocked(prisma.habitEntry.findMany).mockResolvedValue(entries as any);

      const result = await calculateStreak('habit1');

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(3);
    });

    it('allows one day gap in streak', async () => {
      const today = startOfDay(new Date());
      const entries = [
        { date: today, completed: true },
        // Gap on day 1
        { date: subDays(today, 2), completed: true },
        { date: subDays(today, 3), completed: true },
      ];

      vi.mocked(prisma.habitEntry.findMany).mockResolvedValue(entries as any);

      const result = await calculateStreak('habit1');

      expect(result.currentStreak).toBe(3);
    });

    it('calculates longest streak correctly with multiple streaks', async () => {
      const today = startOfDay(new Date());
      const entries = [
        // Current streak: 2 days
        { date: today, completed: true },
        { date: subDays(today, 1), completed: true },
        // Gap
        { date: subDays(today, 5), completed: true },
        { date: subDays(today, 6), completed: true },
        { date: subDays(today, 7), completed: true },
        { date: subDays(today, 8), completed: true },
        { date: subDays(today, 9), completed: true },
      ];

      vi.mocked(prisma.habitEntry.findMany).mockResolvedValue(entries as any);

      const result = await calculateStreak('habit1');

      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(5);
    });
  });

  describe('updateHabitStreak', () => {
    it('updates habit with calculated streak', async () => {
      const today = startOfDay(new Date());
      const entries = [
        { date: today, completed: true },
        { date: subDays(today, 1), completed: true },
      ];

      vi.mocked(prisma.habitEntry.findMany).mockResolvedValue(entries as any);
      vi.mocked(prisma.habitEntry.findFirst).mockResolvedValue(entries[0] as any);
      vi.mocked(prisma.habit.update).mockResolvedValue({
        id: 'habit1',
        streak: 2,
        longestStreak: 2,
      } as any);

      await updateHabitStreak('habit1');

      expect(prisma.habit.update).toHaveBeenCalledWith({
        where: { id: 'habit1' },
        data: {
          streak: 2,
          longestStreak: 2,
          lastCompletedAt: today,
        },
      });
    });
  });

  describe('toggleHabitCompletion', () => {
    it('creates new entry when toggling completion', async () => {
      const today = startOfDay(new Date());
      const mockEntry = {
        id: 'entry1',
        habitId: 'habit1',
        date: today,
        completed: true,
      };

      vi.mocked(prisma.habitEntry.upsert).mockResolvedValue(mockEntry as any);
      vi.mocked(prisma.habitEntry.findMany).mockResolvedValue([mockEntry] as any);
      vi.mocked(prisma.habitEntry.findFirst).mockResolvedValue(mockEntry as any);
      vi.mocked(prisma.habit.update).mockResolvedValue({} as any);

      const result = await toggleHabitCompletion('habit1', today, true);

      expect(prisma.habitEntry.upsert).toHaveBeenCalledWith({
        where: {
          habitId_date: {
            habitId: 'habit1',
            date: today,
          },
        },
        create: {
          habitId: 'habit1',
          date: today,
          completed: true,
          notes: undefined,
        },
        update: {
          completed: true,
          notes: undefined,
        },
      });

      expect(result).toEqual(mockEntry);
    });

    it('toggles existing entry completion status', async () => {
      const today = startOfDay(new Date());
      
      vi.mocked(prisma.habitEntry.upsert).mockResolvedValue({
        id: 'entry1',
        completed: true,
      } as any);

      await toggleHabitCompletion('habit1', today);

      expect(prisma.habitEntry.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            completed: { not: true },
            notes: undefined,
          },
        })
      );
    });
  });
});