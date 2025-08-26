import { CreateHabitInput, UpdateHabitInput } from '@/lib/validations/habit';

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  streak: number;
  longestStreak: number;
  lastCompletedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface HabitEntry {
  id: string;
  date: string;
  completed: boolean;
  notes: string | null;
  createdAt: string;
  habitId: string;
}

export const habitApi = {
  // Fetcher for SWR
  fetcher: (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  }),

  // Create a new habit
  create: async (data: CreateHabitInput): Promise<Habit> => {
    const response = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create habit');
    }

    return response.json();
  },

  // Update a habit
  update: async (id: string, data: UpdateHabitInput): Promise<Habit> => {
    const response = await fetch(`/api/habits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update habit');
    }

    return response.json();
  },

  // Delete a habit
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/habits/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete habit');
    }
  },

  // Toggle habit completion
  toggleComplete: async (id: string, completed?: boolean, date?: string, notes?: string): Promise<{ habit: Habit; entry: HabitEntry }> => {
    const response = await fetch(`/api/habits/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed, date, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle habit completion');
    }

    return response.json();
  },

  // Get habit completion status
  getCompletion: async (id: string, date?: string): Promise<{ habit: Habit; entry: HabitEntry | null }> => {
    const url = new URL(`/api/habits/${id}/complete`, window.location.origin);
    if (date) url.searchParams.append('date', date);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get habit completion');
    }

    return response.json();
  },
};