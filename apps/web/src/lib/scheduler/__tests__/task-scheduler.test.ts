import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskScheduler } from '../task-scheduler';
import { House, Goal } from '@/lib/archetype/types';
import { add, startOfDay } from 'date-fns';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    profile: {
      findUnique: vi.fn(),
    },
    assignment: {
      findUnique: vi.fn(),
    },
    taskTemplate: {
      findMany: vi.fn(),
    },
    taskInstance: {
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('TaskScheduler', () => {
  let scheduler: TaskScheduler;

  beforeEach(() => {
    scheduler = new TaskScheduler();
    vi.clearAllMocks();
  });

  describe('generateTasksForUser', () => {
    it('should generate tasks based on user profile and templates', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        timezone: 'America/New_York',
        morningWindow: { start: '07:00', end: '09:00' },
        middayWindow: { start: '12:00', end: '13:00' },
        eveningWindow: { start: '18:00', end: '20:00' },
        dndWindows: [],
        preferredIntensity: 'MODERATE',
        timeCommitmentMinutes: 30,
        socialPreference: 'SOLO',
      };

      const mockAssignment = {
        house: House.SAGE,
        class: 'EXPLORER',
        subclass: 'KNOWLEDGE_SEEKER',
      };

      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Morning Meditation',
          archetype: House.SAGE,
          taskType: 'MEDITATION',
          baseMinutes: 10,
          timeOfDay: 'MORNING',
          frequency: 'DAILY',
          personalizations: {},
        },
        {
          id: 'template-2',
          name: 'Evening Reflection',
          archetype: House.SAGE,
          taskType: 'REFLECTION',
          baseMinutes: 15,
          timeOfDay: 'EVENING',
          frequency: 'DAILY',
          personalizations: {},
        },
      ];

      const { default: prisma } = await import('@/lib/prisma');
      (prisma.profile.findUnique as any).mockResolvedValue(mockProfile);
      (prisma.assignment.findUnique as any).mockResolvedValue(mockAssignment);
      (prisma.taskTemplate.findMany as any).mockResolvedValue(mockTemplates);
      (prisma.taskInstance.createMany as any).mockResolvedValue({ count: 2 });

      const targetDate = add(startOfDay(new Date()), { days: 1 });
      const result = await scheduler.generateTasksForUser('user-1', targetDate);

      expect(result).toBe(2);
      expect(prisma.taskInstance.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            templateId: 'template-1',
            name: 'Morning Meditation',
            durationMinutes: 10,
          }),
          expect.objectContaining({
            userId: 'user-1',
            templateId: 'template-2',
            name: 'Evening Reflection',
            durationMinutes: 15,
          }),
        ]),
      });
    });

    it('should respect user time preferences', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        timezone: 'Europe/London',
        morningWindow: { start: '06:00', end: '08:00' },
        middayWindow: null,
        eveningWindow: { start: '20:00', end: '22:00' },
        dndWindows: [{ start: '09:00', end: '17:00' }],
        preferredIntensity: 'LIGHT',
        timeCommitmentMinutes: 15,
        socialPreference: 'SOLO',
      };

      const mockAssignment = {
        house: House.MONK,
        class: 'ASCETIC',
        subclass: 'MINIMALIST',
      };

      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Breathing Exercise',
          archetype: House.MONK,
          taskType: 'BREATHING',
          baseMinutes: 5,
          timeOfDay: 'MORNING',
          frequency: 'DAILY',
          personalizations: {},
        },
      ];

      const { default: prisma } = await import('@/lib/prisma');
      (prisma.profile.findUnique as any).mockResolvedValue(mockProfile);
      (prisma.assignment.findUnique as any).mockResolvedValue(mockAssignment);
      (prisma.taskTemplate.findMany as any).mockResolvedValue(mockTemplates);
      (prisma.taskInstance.createMany as any).mockResolvedValue({ count: 1 });

      const targetDate = add(startOfDay(new Date()), { days: 1 });
      await scheduler.generateTasksForUser('user-1', targetDate);

      expect(prisma.taskInstance.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            scheduledAt: expect.any(Date),
          }),
        ]),
      });

      // Verify the scheduled time is within morning window
      const callData = (prisma.taskInstance.createMany as any).mock.calls[0][0].data;
      const scheduledTime = new Date(callData[0].scheduledAt);
      const hour = scheduledTime.getHours();
      expect(hour).toBeGreaterThanOrEqual(6);
      expect(hour).toBeLessThan(8);
    });

    it('should handle missing user profile gracefully', async () => {
      const { default: prisma } = await import('@/lib/prisma');
      (prisma.profile.findUnique as any).mockResolvedValue(null);

      const targetDate = add(startOfDay(new Date()), { days: 1 });
      const result = await scheduler.generateTasksForUser('user-1', targetDate);

      expect(result).toBe(0);
      expect(prisma.taskInstance.createMany).not.toHaveBeenCalled();
    });

    it('should adapt task duration based on intensity preference', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        timezone: 'America/Los_Angeles',
        morningWindow: { start: '07:00', end: '09:00' },
        middayWindow: { start: '12:00', end: '13:00' },
        eveningWindow: { start: '18:00', end: '20:00' },
        dndWindows: [],
        preferredIntensity: 'INTENSE',
        timeCommitmentMinutes: 60,
        socialPreference: 'SOLO',
      };

      const mockAssignment = {
        house: House.WARRIOR_MONK,
        class: 'GUARDIAN',
        subclass: 'STRENGTH_KEEPER',
      };

      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Strength Training',
          archetype: House.WARRIOR_MONK,
          taskType: 'EXERCISE',
          baseMinutes: 30,
          timeOfDay: 'MORNING',
          frequency: 'DAILY',
          personalizations: {},
        },
      ];

      const { default: prisma } = await import('@/lib/prisma');
      (prisma.profile.findUnique as any).mockResolvedValue(mockProfile);
      (prisma.assignment.findUnique as any).mockResolvedValue(mockAssignment);
      (prisma.taskTemplate.findMany as any).mockResolvedValue(mockTemplates);
      (prisma.taskInstance.createMany as any).mockResolvedValue({ count: 1 });

      const targetDate = add(startOfDay(new Date()), { days: 1 });
      await scheduler.generateTasksForUser('user-1', targetDate);

      expect(prisma.taskInstance.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            durationMinutes: 45, // 30 * 1.5 for INTENSE
          }),
        ]),
      });
    });
  });

  describe('getUserTasks', () => {
    it('should retrieve tasks for a specific date', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          name: 'Morning Meditation',
          scheduledAt: new Date('2024-01-15T07:00:00Z'),
          durationMinutes: 10,
          status: 'PENDING',
        },
        {
          id: 'task-2',
          name: 'Evening Reflection',
          scheduledAt: new Date('2024-01-15T19:00:00Z'),
          durationMinutes: 15,
          status: 'PENDING',
        },
      ];

      const { default: prisma } = await import('@/lib/prisma');
      (prisma.taskInstance.findMany as any).mockResolvedValue(mockTasks);

      const date = new Date('2024-01-15');
      const tasks = await scheduler.getUserTasks('user-1', date);

      expect(tasks).toHaveLength(2);
      expect(tasks[0].name).toBe('Morning Meditation');
      expect(tasks[1].name).toBe('Evening Reflection');
    });
  });
});