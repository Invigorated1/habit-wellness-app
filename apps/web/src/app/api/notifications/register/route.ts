import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const registerTokenSchema = z.object({
  token: z.string(),
  platform: z.enum(['ios', 'android', 'web']),
  deviceId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = registerTokenSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { token, platform, deviceId } = validation.data;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if token already exists
    const existingSubscription = await prisma.pushSubscription.findUnique({
      where: {
        userId_token: {
          userId: user.id,
          token,
        },
      },
    });

    if (existingSubscription) {
      // Update existing subscription
      const updated = await prisma.pushSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          active: true,
          deviceId,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(updated);
    }

    // Create new subscription
    const subscription = await prisma.pushSubscription.create({
      data: {
        userId: user.id,
        token,
        platform,
        deviceId,
        active: true,
      },
    });

    // Ensure user has notification preferences
    const notificationPrefs = await prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    });

    if (!notificationPrefs) {
      await prisma.notificationPreference.create({
        data: {
          userId: user.id,
        },
      });
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error registering push token:', error);
    return NextResponse.json(
      { error: 'Failed to register push token' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Deactivate the subscription
    await prisma.pushSubscription.updateMany({
      where: {
        userId: user.id,
        token,
      },
      data: {
        active: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return NextResponse.json(
      { error: 'Failed to unregister push token' },
      { status: 500 }
    );
  }
}