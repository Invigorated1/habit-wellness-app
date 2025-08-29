import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    habit: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getOrCreateUser: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('/api/habits', () => {
  const mockUser = {
    id: 'user-123',
    clerkId: 'clerk-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getOrCreateUser as any).mockResolvedValue(mockUser);
  });

  describe('GET /api/habits', () => {
    it('should return user habits', async () => {
      const mockHabits = [
        {
          id: 'habit-1',
          name: 'Exercise',
          description: 'Daily workout',
          streak: 5,
          isActive: true,
          userId: mockUser.id,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          entries: [],
        },
        {
          id: 'habit-2',
          name: 'Reading',
          description: null,
          streak: 3,
          isActive: true,
          userId: mockUser.id,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          entries: [],
        },
      ];

      (prisma.habit.findMany as any).mockResolvedValue(mockHabits);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].name).toBe('Exercise');
      
      expect(prisma.habit.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: {
          entries: {
            orderBy: { date: 'desc' },
            take: 30,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle empty habits list', async () => {
      (prisma.habit.findMany as any).mockResolvedValue([]);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('should handle unauthorized access', async () => {
      (getOrCreateUser as any).mockRejectedValue(new Error('Unauthorized'));

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('POST /api/habits', () => {
    it('should create a new habit', async () => {
      const newHabit = {
        id: 'habit-new',
        name: 'Meditation',
        description: 'Morning meditation',
        streak: 0,
        isActive: true,
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.habit.create as any).mockResolvedValue(newHabit);

      const request = new Request('http://localhost/api/habits', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Meditation',
          description: 'Morning meditation',
        }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Meditation');
      expect(body.data.description).toBe('Morning meditation');
      
      expect(prisma.habit.create).toHaveBeenCalledWith({
        data: {
          name: 'Meditation',
          description: 'Morning meditation',
          userId: mockUser.id,
        },
      });
    });

    it('should trim whitespace from inputs', async () => {
      const newHabit = {
        id: 'habit-new',
        name: 'Exercise',
        description: 'Daily workout',
        streak: 0,
        isActive: true,
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.habit.create as any).mockResolvedValue(newHabit);

      const request = new Request('http://localhost/api/habits', {
        method: 'POST',
        body: JSON.stringify({
          name: '  Exercise  ',
          description: '  Daily workout  ',
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(201);
      expect(prisma.habit.create).toHaveBeenCalledWith({
        data: {
          name: 'Exercise',
          description: 'Daily workout',
          userId: mockUser.id,
        },
      });
    });

    it('should handle null description', async () => {
      const newHabit = {
        id: 'habit-new',
        name: 'Water',
        description: null,
        streak: 0,
        isActive: true,
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.habit.create as any).mockResolvedValue(newHabit);

      const request = new Request('http://localhost/api/habits', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Water',
        }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.data.description).toBeNull();
    });

    it('should reject empty name', async () => {
      const request = new Request('http://localhost/api/habits', {
        method: 'POST',
        body: JSON.stringify({
          name: '',
          description: 'Test',
        }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('Name cannot be empty');
      expect(prisma.habit.create).not.toHaveBeenCalled();
    });

    it('should reject missing name', async () => {
      const request = new Request('http://localhost/api/habits', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Test',
        }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('Name is required');
      expect(prisma.habit.create).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      (prisma.habit.create as any).mockRejectedValue(
        new Error('Database error')
      );

      const request = new Request('http://localhost/api/habits', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Habit',
        }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });
  });
});