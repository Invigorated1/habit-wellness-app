import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Permission types
export const Permissions = {
  // Habit permissions
  HABIT_VIEW: 'habit:view',
  HABIT_CREATE: 'habit:create',
  HABIT_UPDATE: 'habit:update',
  HABIT_DELETE: 'habit:delete',
  
  // User permissions
  USER_VIEW_SELF: 'user:view:self',
  USER_UPDATE_SELF: 'user:update:self',
  
  // Admin permissions
  ADMIN_VIEW_ALL: 'admin:view:all',
  ADMIN_MANAGE_USERS: 'admin:manage:users',
  ADMIN_VIEW_ANALYTICS: 'admin:view:analytics',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

// Role definitions
export const Roles = {
  USER: 'user',
  PREMIUM: 'premium',
  ADMIN: 'admin',
} as const;

export type Role = typeof Roles[keyof typeof Roles];

// Role-permission mapping
const rolePermissions: Record<Role, Permission[]> = {
  [Roles.USER]: [
    Permissions.HABIT_VIEW,
    Permissions.HABIT_CREATE,
    Permissions.HABIT_UPDATE,
    Permissions.HABIT_DELETE,
    Permissions.USER_VIEW_SELF,
    Permissions.USER_UPDATE_SELF,
  ],
  [Roles.PREMIUM]: [
    // All user permissions
    ...rolePermissions[Roles.USER],
    // Premium features could be added here
  ],
  [Roles.ADMIN]: [
    // All premium permissions
    ...rolePermissions[Roles.PREMIUM],
    // Admin-specific permissions
    Permissions.ADMIN_VIEW_ALL,
    Permissions.ADMIN_MANAGE_USERS,
    Permissions.ADMIN_VIEW_ANALYTICS,
  ],
};

// Get user's role (could be stored in database or Clerk metadata)
export async function getUserRole(userId: string): Promise<Role> {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });
    
    return (user?.role as Role) || Roles.USER;
  } catch (error) {
    logger.error('Failed to get user role', { error, userId });
    return Roles.USER; // Default to basic user
  }
}

// Check if user has permission
export async function hasPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  const role = await getUserRole(userId);
  return rolePermissions[role]?.includes(permission) || false;
}

// Require permission (throws if not granted)
export async function requirePermission(
  userId: string,
  permission: Permission
): Promise<void> {
  const hasAccess = await hasPermission(userId, permission);
  
  if (!hasAccess) {
    logger.warn('Permission denied', { userId, permission });
    throw new ForbiddenError(`Permission denied: ${permission}`);
  }
}

// Resource ownership checks
export async function canAccessHabit(
  userId: string,
  habitId: string
): Promise<boolean> {
  try {
    // Check if user owns the habit
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      select: { userId: true },
    });
    
    if (!habit) {
      return false;
    }
    
    // Owner can always access
    if (habit.userId === userId) {
      return true;
    }
    
    // Admins can access all habits
    const role = await getUserRole(userId);
    return role === Roles.ADMIN;
  } catch (error) {
    logger.error('Failed to check habit access', { error, userId, habitId });
    return false;
  }
}

// Require habit ownership (throws if not owner)
export async function requireHabitOwnership(
  userId: string,
  habitId: string
): Promise<void> {
  const canAccess = await canAccessHabit(userId, habitId);
  
  if (!canAccess) {
    logger.warn('Habit access denied', { userId, habitId });
    throw new ForbiddenError('You do not have access to this habit');
  }
}

// Get accessible resources based on permissions
export async function getAccessibleHabits(userId: string) {
  const role = await getUserRole(userId);
  
  if (role === Roles.ADMIN) {
    // Admins can see all habits
    return prisma.habit.findMany({
      include: { user: true },
    });
  }
  
  // Regular users see only their habits
  return prisma.habit.findMany({
    where: { userId },
  });
}

// Authorization middleware
export function authorize(permission: Permission) {
  return async (request: Request) => {
    const { userId } = await auth();
    
    if (!userId) {
      throw new ForbiddenError('Authentication required');
    }
    
    await requirePermission(userId, permission);
  };
}

// Resource-based authorization
export function authorizeResource<T extends { userId?: string }>(
  getResource: (id: string) => Promise<T | null>
) {
  return async (resourceId: string, userId: string) => {
    const resource = await getResource(resourceId);
    
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }
    
    // Check ownership
    if (resource.userId && resource.userId !== userId) {
      const role = await getUserRole(userId);
      if (role !== Roles.ADMIN) {
        throw new ForbiddenError('You do not have access to this resource');
      }
    }
    
    return resource;
  };
}