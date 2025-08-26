import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './prisma';

export async function getOrCreateUser() {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    throw new Error('Unauthorized');
  }

  // Check if user exists in our database
  let user = await prisma.user.findUnique({
    where: { clerkId },
  });

  // If not, create them (this handles cases where webhook hasn't fired)
  if (!user) {
    const clerkUser = await currentUser();
    
    if (!clerkUser?.emailAddresses?.[0]?.emailAddress) {
      throw new Error('No email found for user');
    }

    user = await prisma.user.create({
      data: {
        clerkId,
        email: clerkUser.emailAddresses[0].emailAddress,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
      },
    });
  }

  return user;
}

// Helper to get user ID without creating
export async function getCurrentUserId() {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  return user?.id || null;
}