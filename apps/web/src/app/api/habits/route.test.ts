import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextResponse } from 'next/server';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    habit: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const { auth } = await import('@clerk/nextjs/server');
const { prisma } = await import('@/lib/prisma');

describe('Habits API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/habits', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if user is not found in database', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'clerk_123' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should return habits for authenticated user', async () => {
      const mockUser = { id: 'user_123', clerkId: 'clerk_123', email: 'test@example.com' };
      const mockHabits = [
        { id: '1', name: 'Meditation', description: 'Daily meditation', userId: 'user_123' },
        { id: '2', name: 'Exercise', description: 'Daily workout', userId: 'user_123' },
      ];

      vi.mocked(auth).mockResolvedValue({ userId: 'clerk_123' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.habit.findMany).mockResolvedValue(mockHabits as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockHabits);
      expect(prisma.habit.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('POST /api/habits', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const request = new Request('http://localhost:3000/api/habits', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Habit' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if name is not provided', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'clerk_123' } as any);

      const request = new Request('http://localhost:3000/api/habits', {
        method: 'POST',
        body: JSON.stringify({ description: 'No name provided' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name is required');
    });

    it('should create a new habit for authenticated user', async () => {
      const mockUser = { id: 'user_123', clerkId: 'clerk_123', email: 'test@example.com' };
      const newHabit = {
        id: 'habit_123',
        name: 'New Habit',
        description: 'Test description',
        userId: 'user_123',
        createdAt: new Date(),
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'clerk_123' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.habit.create).mockResolvedValue(newHabit as any);

      const request = new Request('http://localhost:3000/api/habits', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Habit', description: 'Test description' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(newHabit);
      expect(prisma.habit.create).toHaveBeenCalledWith({
        data: {
          name: 'New Habit',
          description: 'Test description',
          userId: 'user_123',
        },
      });
    });
  });
});