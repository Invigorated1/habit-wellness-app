'use client';

import { useState } from 'react';
import { Habit } from '@/lib/api/habits';

interface HabitCheckboxProps {
  habit: Habit;
  date?: Date;
  initialCompleted?: boolean;
  onToggle: (habitId: string, completed: boolean) => Promise<void>;
}

export function HabitCheckbox({ 
  habit, 
  date = new Date(), 
  initialCompleted = false,
  onToggle 
}: HabitCheckboxProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (isLoading) return;

    const newCompleted = !isCompleted;
    setIsLoading(true);

    try {
      await onToggle(habit.id, newCompleted);
      setIsCompleted(newCompleted);
    } catch (error) {
      console.error('Failed to toggle habit:', error);
      // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        role="checkbox"
        aria-checked={isCompleted}
        aria-disabled={isLoading}
        aria-describedby={`habit-desc-${habit.id}`}
        className={`
          w-6 h-6 rounded-md border-2 transition-all duration-200
          ${isCompleted 
            ? 'bg-blue-600 border-blue-600' 
            : 'bg-white border-gray-300 hover:border-gray-400'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          flex items-center justify-center
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        aria-label={`Mark ${habit.name} as ${isCompleted ? 'incomplete' : 'complete'}`}
      >
        {isCompleted && (
          <svg 
            className="w-4 h-4 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={3} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        )}
      </button>
      
      <div className="flex-1">
        <h3 className={`font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
          {habit.name}
        </h3>
        {habit.description && (
          <p id={`habit-desc-${habit.id}`} className="text-sm text-gray-600">
            {habit.description}
          </p>
        )}
      </div>

      <div className="text-right" aria-live="polite">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Streak:</span>
          <span className={`text-sm font-semibold ${habit.streak > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
            {habit.streak} {habit.streak === 1 ? 'day' : 'days'}
          </span>
        </div>
        {habit.longestStreak && habit.longestStreak > habit.streak && (
          <p className="text-xs text-gray-500">
            <span className="sr-only">Personal best streak:</span>
            Best: {habit.longestStreak} days
          </p>
        )}
      </div>
    </div>
  );
}