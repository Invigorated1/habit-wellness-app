// Export all schemas and types
export * from './schemas/habit';
export * from './schemas/notification';

// Common utilities
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getStreakMessage = (streak: number): string => {
  if (streak === 0) return 'Start your streak today!';
  if (streak === 1) return '1 day streak! Keep going!';
  if (streak < 7) return `${streak} day streak! Almost a week!`;
  if (streak < 30) return `${streak} day streak! Keep it up!`;
  if (streak < 100) return `${streak} day streak! Amazing consistency!`;
  return `${streak} day streak! You're unstoppable!`;
};

export const calculateCompletionRate = (completedDays: number, totalDays: number): number => {
  if (totalDays === 0) return 0;
  return Math.round((completedDays / totalDays) * 100);
};