'use client';

import { useState } from 'react';
import { Habit } from '@/lib/api/habits';
import { EditHabitForm } from './EditHabitForm';

interface HabitCardProps {
  habit: Habit;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function HabitCard({ habit, onUpdate, onDelete }: HabitCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${habit.name}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(habit.id);
      } catch (error) {
        console.error('Failed to delete habit:', error);
        setIsDeleting(false);
      }
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      await onUpdate(habit.id, data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update habit:', error);
    }
  };

  if (isEditing) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Edit Habit</h3>
        <EditHabitForm
          habit={habit}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className={`p-4 border border-gray-200 rounded-lg ${!habit.isActive ? 'opacity-60' : ''} ${isDeleting ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{habit.name}</h2>
          {habit.description && (
            <p className="text-gray-600 mt-1">{habit.description}</p>
          )}
          <div className="mt-2 flex items-center gap-4">
            <span className="text-sm text-blue-600 font-medium">
              Streak: {habit.streak} days
            </span>
            <span className="text-sm text-gray-500">
              Created: {new Date(habit.createdAt).toLocaleDateString()}
            </span>
            {!habit.isActive && (
              <span className="text-sm text-orange-600 font-medium">Inactive</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => setIsEditing(true)}
            disabled={isDeleting}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}