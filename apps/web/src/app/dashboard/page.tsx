'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Habit {
  id: number;
  name: string;
  description: string;
  streak: number;
  createdAt: string;
}

export default function Dashboard() {
  const { data: habits, error, isLoading } = useSWR<Habit[]>('/api/habits', fetcher);

  if (error) return <div className="p-4 text-red-500">Failed to load habits</div>;
  if (isLoading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Habit Dashboard</h1>
      
      <div className="grid gap-4">
        {habits && habits.length > 0 ? (
          habits.map((habit) => (
            <div key={habit.id} className="p-4 border border-gray-200 rounded-lg">
              <h2 className="text-xl font-semibold">{habit.name}</h2>
              <p className="text-gray-600 mt-1">{habit.description}</p>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-sm text-blue-600 font-medium">
                  Streak: {habit.streak} days
                </span>
                <span className="text-sm text-gray-500">
                  Created: {new Date(habit.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No habits found. Start tracking your habits!
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(habits, null, 2)}
        </pre>
      </div>
    </div>
  );
}