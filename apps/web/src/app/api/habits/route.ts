import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { startOfDay } from 'date-fns';
import { createHabitSchema } from '@habit-app/shared';
import { 
  validateRequest, 
  parseBody, 
  secureResponse, 
  errorResponse,
  sanitizeInput 
} from '@/lib/api/validation';
import { checkRateLimit } from '@/lib/rate-limit';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const { success: rateLimitOk, response: rateLimitResponse } = await checkRateLimit(request);
    if (!rateLimitOk) return rateLimitResponse!;

    // Validate request
    const validation = await validateRequest(request);
    if (validation.error) return validation.error;

    const { userId } = auth();
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    // Get the user from our database using Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    const today = startOfDay(new Date());

    // Get all habits for the authenticated user with today's entries
    // This avoids N+1 queries by fetching related data in one query
    const habits = await prisma.habit.findMany({
      where: { 
        userId: user.id,
        // Ensure user can only see their own habits
        user: {
          clerkId: userId,
        },
      },
      include: {
        entries: {
          where: {
            date: today,
          },
          take: 1,
        },
        _count: {
          select: {
            entries: {
              where: {
                completed: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform the data to include today's completion status
    const habitsWithStatus = habits.map(habit => ({
      ...habit,
      todayEntry: habit.entries[0] || null,
      completedCount: habit._count.entries,
      entries: undefined, // Remove the entries array from response
      _count: undefined, // Remove the count object from response
    }));

    return secureResponse(habitsWithStatus);
  } catch (error) {
    console.error('Error fetching habits:', error);
    return errorResponse('Failed to fetch habits', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit with user-specific limits
    const { userId } = auth();
    const { success: rateLimitOk, response: rateLimitResponse } = await checkRateLimit(
      request, 
      { 
        type: 'user',
        identifier: userId || undefined,
      }
    );
    if (!rateLimitOk) return rateLimitResponse!;

    // Validate request
    const validation = await validateRequest(request);
    if (validation.error) return validation.error;

    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    // Parse and validate body
    const { data: body, error } = await parseBody(request, createHabitSchema);
    if (error) return error;

    // Sanitize inputs
    const name = sanitizeInput(body.name);
    const description = body.description ? sanitizeInput(body.description) : null;

    // Additional validation
    if (name.length < 1 || name.length > 100) {
      return errorResponse('Name must be between 1 and 100 characters', 400);
    }

    // Get the user from our database using Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Check habit limit (example: 50 habits per user)
    const habitCount = await prisma.habit.count({
      where: { userId: user.id, isActive: true },
    });

    if (habitCount >= 50) {
      return errorResponse('Habit limit reached. Maximum 50 active habits allowed.', 400);
    }

    // Create a new habit for the authenticated user
    const newHabit = await prisma.habit.create({
      data: {
        name,
        description,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    // Return habit with additional fields for consistency
    const habitWithStatus = {
      ...newHabit,
      todayEntry: null,
      completedCount: 0,
      _count: undefined,
    };

    return secureResponse(habitWithStatus, { status: 201 });
  } catch (error) {
    console.error('Error creating habit:', error);
    
    // Check for specific Prisma errors
    if (error instanceof Error && error.message.includes('P2002')) {
      return errorResponse('A habit with this name already exists', 409);
    }
    
    return errorResponse('Failed to create habit', 500);
  }
}