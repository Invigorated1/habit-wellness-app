'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { habitApi, Habit } from '@/lib/api/habits';
import { HabitForm } from '@/components/habits/HabitForm';
import { HabitCard } from '@/components/habits/HabitCard';
import { CreateHabitInput, UpdateHabitInput } from '@/lib/validations/habit';

export default function Dashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  const { data: habits, error, isLoading, mutate } = useSWR<Habit[]>(
    '/api/habits',
    habitApi.fetcher
  );

  const handleCreateHabit = async (data: CreateHabitInput) => {
    setCreateError(null);
    
    try {
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const newHabit: Habit = {
        id: tempId,
        ...data,
        description: data.description || null,
        streak: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'temp',
      };
      
      await mutate(
        async (habits) => {
          const createdHabit = await habitApi.create(data);
          return [...(habits || []), createdHabit];
        },
        {
          optimisticData: [...(habits || []), newHabit],
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        }
      );
      
      setShowCreateForm(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create habit');
    }
  };

  const handleUpdateHabit = async (id: string, data: UpdateHabitInput) => {
    await mutate(
      async (habits) => {
        const updatedHabit = await habitApi.update(id, data);
        return habits?.map(h => h.id === id ? updatedHabit : h) || [];
      },
      {
        optimisticData: habits?.map(h => 
          h.id === id 
            ? { ...h, ...data, updatedAt: new Date().toISOString() }
            : h
        ),
        rollbackOnError: true,
        populateCache: true,
        revalidate: false,
      }
    );
  };

  const handleDeleteHabit = async (id: string) => {
    await mutate(
      async (habits) => {
        await habitApi.delete(id);
        return habits?.filter(h => h.id !== id) || [];
      },
      {
        optimisticData: habits?.filter(h => h.id !== id),
        rollbackOnError: true,
        populateCache: true,
        revalidate: false,
      }
    );
  };

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error loading habits</h3>
          <p className="text-red-600 mt-1">{error.message || 'Something went wrong'}</p>
          <button
            onClick={() => mutate()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Habit Dashboard</h1>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + New Habit
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">Create New Habit</h2>
          {createError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              {createError}
            </div>
          )}
          <HabitForm
            onSubmit={handleCreateHabit}
            onCancel={() => {
              setShowCreateForm(false);
              setCreateError(null);
            }}
          />
        </div>
      )}
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {habits && habits.length > 0 ? (
            habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onUpdate={handleUpdateHabit}
                onDelete={handleDeleteHabit}
              />
            ))
          ) : (
            <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg">
              <p className="text-lg">No habits found.</p>
              <p className="mt-2">Start tracking your habits by creating your first one!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}