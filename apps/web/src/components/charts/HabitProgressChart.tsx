'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { HabitEntry } from '@/lib/api/habits';

interface HabitProgressChartProps {
  entries: HabitEntry[];
  days?: number;
  type?: 'line' | 'bar';
}

export function HabitProgressChart({ 
  entries, 
  days = 30,
  type = 'bar' 
}: HabitProgressChartProps) {
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const data = [];
    
    // Create a map of dates to entries
    const entryMap = new Map(
      entries.map(entry => [
        format(new Date(entry.date), 'yyyy-MM-dd'),
        entry
      ])
    );
    
    // Generate data for each day
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = entryMap.get(dateStr);
      
      data.push({
        date: format(date, 'MMM d'),
        fullDate: dateStr,
        completed: entry?.completed ? 1 : 0,
        hasEntry: !!entry,
      });
    }
    
    return data;
  }, [entries, days]);

  const completionRate = useMemo(() => {
    const completed = chartData.filter(d => d.completed).length;
    return Math.round((completed / chartData.length) * 100);
  }, [chartData]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].completed) {
        streak++;
      } else if (i === chartData.length - 1) {
        // Today not completed yet, check yesterday
        continue;
      } else {
        break;
      }
    }
    return streak;
  }, [chartData]);

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Progress Overview</h3>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-gray-600">Completion Rate:</span>
            <span className="ml-1 font-semibold text-blue-600">{completionRate}%</span>
          </div>
          <div>
            <span className="text-gray-600">Current Streak:</span>
            <span className="ml-1 font-semibold text-green-600">{currentStreak} days</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 1]}
                ticks={[0, 1]}
                tickFormatter={(value) => value === 1 ? 'Done' : 'Not Done'}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
                        <p className="text-sm font-medium">{data.fullDate}</p>
                        <p className="text-sm">
                          Status: {data.completed ? '✅ Completed' : '❌ Not Completed'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 1]}
                ticks={[0, 1]}
                tickFormatter={(value) => value === 1 ? 'Done' : ''}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
                        <p className="text-sm font-medium">{data.fullDate}</p>
                        <p className="text-sm">
                          Status: {data.completed ? '✅ Completed' : '❌ Not Completed'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.completed ? '#10b981' : '#e5e7eb'} 
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}