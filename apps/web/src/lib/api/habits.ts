import { CreateHabitInput, UpdateHabitInput } from '@/lib/validations/habit';

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  streak: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
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
};