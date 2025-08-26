import useSWR, { SWRConfiguration } from 'swr';
import { habitApi, Habit } from '@/lib/api/habits';

interface UseHabitsOptions extends SWRConfiguration {
  suspense?: boolean;
}

export function useHabits(options?: UseHabitsOptions) {
  const swrOptions: SWRConfiguration = {
    // Cache configuration
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
    
    // Stale-while-revalidate settings
    revalidateIfStale: true,
    shouldRetryOnError: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    
    // Performance optimizations
    keepPreviousData: true,
    
    // User options override
    ...options,
  };

  return useSWR<Habit[]>('/api/habits', habitApi.fetcher, swrOptions);
}

// Hook for a single habit with its entries
export function useHabitWithEntries(habitId: string | null, days: number = 30) {
  const swrKey = habitId ? `/api/habits/${habitId}/entries?days=${days}` : null;
  
  return useSWR(swrKey, habitApi.fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
  });
}

// Hook for habit statistics
export function useHabitStats() {
  return useSWR('/api/habits/stats', habitApi.fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutes
    keepPreviousData: true,
  });
}