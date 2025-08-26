import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from './route';
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
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const { auth } = await import('@clerk/nextjs/server');
const { prisma } = await import('@/lib/prisma');

describe('Habit API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/habits/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const response = await GET(
        new Request('http://localhost:3000/api/habits/123'),
        { params: { id: '123' } }
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if habit not found', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'clerk_123' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user_123' } as any);
      vi.mocked(prisma.habit.findFirst).mockResolvedValue(null);

      const response = await GET(
        new Request('http://localhost:3000/api/habits/123'),
        { params: { id: '123' } }
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Habit not found');
    });

    it('should return habit when found', async () => {
      const mockHabit = {
        id: '123',
        name: 'Test Habit',
        userId: 'user_123',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'clerk_123' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user_123' } as any);
      vi.mocked(prisma.habit.findFirst).mockResolvedValue(mockHabit as any);

      const response = await GET(
        new Request('http://localhost:3000/api/habits/123'),
        { params: { id: '123' } }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockHabit);
    });
  });

  describe('PUT /api/habits/[id]', () => {
    it('should validate input data', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'clerk_123' } as any);

      const request = new Request('http://localhost:3000/api/habits/123', {
        method: 'PUT',
        body: JSON.stringify({ name: '' }), // Invalid: empty name
      });

      const response = await PUT(request, { params: { id: '123' } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid input');
    });

    it('should return 404 if habit not found', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'clerk_123' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user_123' } as any);
      vi.mocked(prisma.habit.findFirst).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/habits/123', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Habit' }),
      });

      const response = await PUT(request, { params: { id: '123' } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Habit not found');
    });

    it('should update habit successfully', async () => {
      const existingHabit = { id: '123', name: 'Old Name', userId: 'user_123' };
      const updatedHabit = { ...existingHabit, name: 'Updated Name' };

      vi.mocked(auth).mockResolvedValue({ userId: 'clerk_123' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user_123' } as any);
      vi.mocked(prisma.habit.findFirst).mockResolvedValue(existingHabit as any);
      vi.mocked(prisma.habit.update).mockResolvedValue(updatedHabit as any);

      const request = new Request('http://localhost:3000/api/habits/123', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' }),
      });

      const response = await PUT(request, { params: { id: '123' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe('Updated Name');
      expect(prisma.habit.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { name: 'Updated Name' },
      });
    });
  });

  describe('DELETE /api/habits/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const response = await DELETE(
        new Request('http://localhost:3000/api/habits/123'),
        { params: { id: '123' } }
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if habit not found', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'clerk_123' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user_123' } as any);
      vi.mocked(prisma.habit.findFirst).mockResolvedValue(null);

      const response = await DELETE(
        new Request('http://localhost:3000/api/habits/123'),
        { params: { id: '123' } }
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Habit not found');
    });

    it('should delete habit successfully', async () => {
      const mockHabit = { id: '123', name: 'Test Habit', userId: 'user_123' };

      vi.mocked(auth).mockResolvedValue({ userId: 'clerk_123' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user_123' } as any);
      vi.mocked(prisma.habit.findFirst).mockResolvedValue(mockHabit as any);
      vi.mocked(prisma.habit.delete).mockResolvedValue(mockHabit as any);

      const response = await DELETE(
        new Request('http://localhost:3000/api/habits/123'),
        { params: { id: '123' } }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(prisma.habit.delete).toHaveBeenCalledWith({
        where: { id: '123' },
      });
    });
  });
});