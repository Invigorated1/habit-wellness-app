import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: null })),
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    habit: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Habits API Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Tests', () => {
    it('should return 401 for unauthenticated requests to GET /api/habits', async () => {
      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost:3000/api/habits');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 for unauthenticated requests to POST /api/habits', async () => {
      const { POST } = await import('./route');
      const request = new NextRequest('http://localhost:3000/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Test Habit' }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Input Validation Tests', () => {
    it('should reject invalid JSON in POST request', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockReturnValue({ userId: 'test-user-id' } as any);
      
      const { POST } = await import('./route');
      const request = new NextRequest('http://localhost:3000/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000',
        },
        body: 'invalid json',
      });
      
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject requests without required fields', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockReturnValue({ userId: 'test-user-id' } as any);
      
      const { POST } = await import('./route');
      const request = new NextRequest('http://localhost:3000/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000',
        },
        body: JSON.stringify({}), // Missing required 'name' field
      });
      
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should sanitize HTML in input fields', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { prisma } = await import('@/lib/prisma');
      
      vi.mocked(auth).mockReturnValue({ userId: 'test-user-id' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ 
        id: 'user-1', 
        clerkId: 'test-user-id' 
      } as any);
      vi.mocked(prisma.habit.create).mockResolvedValue({
        id: 'habit-1',
        name: 'Test Habit',
        description: 'Test description without HTML',
      } as any);
      
      const { POST } = await import('./route');
      const request = new NextRequest('http://localhost:3000/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000',
        },
        body: JSON.stringify({
          name: '<script>alert("XSS")</script>Test Habit',
          description: '<b>Test</b> description',
        }),
      });
      
      await POST(request);
      
      const createCall = vi.mocked(prisma.habit.create).mock.calls[0][0];
      expect(createCall.data.name).not.toContain('<script>');
      expect(createCall.data.description).not.toContain('<b>');
    });
  });

  describe('Authorization Tests', () => {
    it('should not allow users to access other users habits', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { prisma } = await import('@/lib/prisma');
      
      vi.mocked(auth).mockReturnValue({ userId: 'user-1' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ 
        id: 'db-user-1', 
        clerkId: 'user-1' 
      } as any);
      vi.mocked(prisma.habit.findFirst).mockResolvedValue(null); // Habit belongs to different user
      
      const { GET } = await import('./[id]/route');
      const request = new NextRequest('http://localhost:3000/api/habits/habit-123');
      
      const response = await GET(request, { params: { id: 'habit-123' } });
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('Habit not found');
    });
  });

  describe('Security Headers Tests', () => {
    it('should set no-store cache control on responses', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { prisma } = await import('@/lib/prisma');
      
      vi.mocked(auth).mockReturnValue({ userId: 'test-user-id' } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ 
        id: 'user-1', 
        clerkId: 'test-user-id' 
      } as any);
      vi.mocked(prisma.habit.findMany).mockResolvedValue([]);
      
      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost:3000/api/habits');
      
      const response = await GET(request);
      
      expect(response.headers.get('Cache-Control')).toContain('no-store');
      expect(response.headers.get('Cache-Control')).toContain('private');
    });
  });

  describe('Origin Validation Tests', () => {
    it('should reject POST requests without origin header', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockReturnValue({ userId: 'test-user-id' } as any);
      
      const { POST } = await import('./route');
      const request = new NextRequest('http://localhost:3000/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Missing Origin header
        },
        body: JSON.stringify({ name: 'Test Habit' }),
      });
      
      const response = await POST(request);
      expect(response.status).toBe(403);
    });
  });

  describe('Request Size Limit Tests', () => {
    it('should reject requests larger than 10KB', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockReturnValue({ userId: 'test-user-id' } as any);
      
      const { POST } = await import('./route');
      const largeBody = JSON.stringify({
        name: 'Test',
        description: 'x'.repeat(11 * 1024), // 11KB of data
      });
      
      const request = new NextRequest('http://localhost:3000/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000',
        },
        body: largeBody,
      });
      
      const response = await POST(request);
      expect(response.status).toBe(413);
    });
  });
});