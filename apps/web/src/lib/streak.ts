import { prisma } from './prisma';
import { startOfDay, subDays, differenceInDays, parseISO, format } from 'date-fns';

/**
 * Calculate the current streak for a habit based on its entries
 * A streak is broken if there's a gap of more than 1 day
 */
export async function calculateStreak(habitId: string): Promise<{ currentStreak: number; longestStreak: number }> {
  // Get all completed entries for this habit, ordered by date descending
  const entries = await prisma.habitEntry.findMany({
    where: {
      habitId,
      completed: true,
    },
    orderBy: {
      date: 'desc',
    },
  });

  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);
  
  // Check if the most recent entry is today or yesterday
  const mostRecentEntry = entries[0];
  const mostRecentDate = startOfDay(new Date(mostRecentEntry.date));
  
  // If the most recent completion is not today or yesterday, current streak is 0
  if (differenceInDays(today, mostRecentDate) > 1) {
    currentStreak = 0;
  } else {
    // Calculate current streak
    let expectedDate = mostRecentDate;
    
    for (const entry of entries) {
      const entryDate = startOfDay(new Date(entry.date));
      const daysDiff = differenceInDays(expectedDate, entryDate);
      
      if (daysDiff === 0) {
        tempStreak++;
        expectedDate = subDays(expectedDate, 1);
      } else if (daysDiff === 1) {
        // Skip one day (allowed gap)
        tempStreak++;
        expectedDate = subDays(entryDate, 1);
      } else {
        // Streak is broken
        break;
      }
    }
    
    currentStreak = tempStreak;
  }
  
  // Calculate longest streak
  tempStreak = 0;
  let previousDate: Date | null = null;
  
  for (const entry of entries) {
    const entryDate = startOfDay(new Date(entry.date));
    
    if (!previousDate) {
      tempStreak = 1;
    } else {
      const daysDiff = differenceInDays(previousDate, entryDate);
      
      if (daysDiff <= 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    previousDate = entryDate;
  }
  
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
  
  return { currentStreak, longestStreak };
}

/**
 * Update streak for a single habit
 */
export async function updateHabitStreak(habitId: string) {
  const { currentStreak, longestStreak } = await calculateStreak(habitId);
  
  // Get the most recent completed entry
  const lastCompletedEntry = await prisma.habitEntry.findFirst({
    where: {
      habitId,
      completed: true,
    },
    orderBy: {
      date: 'desc',
    },
  });
  
  return await prisma.habit.update({
    where: { id: habitId },
    data: {
      streak: currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      lastCompletedAt: lastCompletedEntry?.date || null,
    },
  });
}

/**
 * Update streaks for all active habits
 * This should be run daily by a cron job
 */
export async function updateAllStreaks() {
  const activeHabits = await prisma.habit.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  
  const results = await Promise.allSettled(
    activeHabits.map(habit => updateHabitStreak(habit.id))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  return {
    total: activeHabits.length,
    successful,
    failed,
    errors: results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason),
  };
}

/**
 * Get or create today's entry for a habit
 */
export async function getOrCreateTodayEntry(habitId: string) {
  const today = startOfDay(new Date());
  const dateStr = format(today, 'yyyy-MM-dd');
  
  const existing = await prisma.habitEntry.findUnique({
    where: {
      habitId_date: {
        habitId,
        date: today,
      },
    },
  });
  
  if (existing) {
    return existing;
  }
  
  return await prisma.habitEntry.create({
    data: {
      habitId,
      date: today,
      completed: false,
    },
  });
}

/**
 * Mark a habit as complete/incomplete for a specific date
 */
export async function toggleHabitCompletion(
  habitId: string,
  date: Date = new Date(),
  completed?: boolean,
  notes?: string
) {
  const targetDate = startOfDay(date);
  
  // Get or create the entry
  const entry = await prisma.habitEntry.upsert({
    where: {
      habitId_date: {
        habitId,
        date: targetDate,
      },
    },
    create: {
      habitId,
      date: targetDate,
      completed: completed ?? true,
      notes,
    },
    update: {
      completed: completed !== undefined ? completed : { not: true },
      notes,
    },
  });
  
  // Update the habit's streak
  await updateHabitStreak(habitId);
  
  return entry;
}