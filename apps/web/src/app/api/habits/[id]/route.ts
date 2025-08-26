import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { updateHabitSchema } from '@habit-app/shared';
import { 
  validateRequest, 
  parseBody, 
  secureResponse, 
  errorResponse,
  sanitizeInput 
} from '@/lib/api/validation';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const habit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(habit);
  } catch (error) {
    console.error('Error fetching habit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check rate limit
    const { userId } = auth();
    const { success: rateLimitOk, response: rateLimitResponse } = await checkRateLimit(
      request,
      { type: 'user', identifier: userId || undefined }
    );
    if (!rateLimitOk) return rateLimitResponse!;

    // Validate request
    const validation = await validateRequest(request, { allowedMethods: ['PUT'] });
    if (validation.error) return validation.error;
    
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    // Parse and validate body
    const { data: body, error } = await parseBody(request, updateHabitSchema);
    if (error) return error;

    // Sanitize inputs
    const sanitizedData: any = {};
    if (body.name) sanitizedData.name = sanitizeInput(body.name);
    if (body.description !== undefined) {
      sanitizedData.description = body.description ? sanitizeInput(body.description) : null;
    }
    if (body.isActive !== undefined) sanitizedData.isActive = body.isActive;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Check if habit exists and belongs to user
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingHabit) {
      return errorResponse('Habit not found', 404);
    }

    // Update the habit
    const updatedHabit = await prisma.habit.update({
      where: { 
        id: params.id,
        // Double-check ownership in the update query
        userId: user.id,
      },
      data: sanitizedData,
    });

    return secureResponse(updatedHabit);
  } catch (error) {
    console.error('Error updating habit:', error);
    return errorResponse('Failed to update habit', 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if habit exists and belongs to user
    const habit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    // Delete the habit (cascade will delete related entries)
    await prisma.habit.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    );
  }
}