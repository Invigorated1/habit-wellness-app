'use client';

import { useMemo } from 'react';
import { format, subDays, startOfWeek, getDay } from 'date-fns';
import { HabitEntry } from '@/lib/api/habits';

interface HabitHeatmapProps {
  entries: HabitEntry[];
  weeks?: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HabitHeatmap({ entries, weeks = 12 }: HabitHeatmapProps) {
  const heatmapData = useMemo(() => {
    const today = new Date();
    const weeksData = [];
    
    // Create a map of dates to entries
    const entryMap = new Map(
      entries.map(entry => [
        format(new Date(entry.date), 'yyyy-MM-dd'),
        entry
      ])
    );
    
    // Generate data for each week
    for (let w = weeks - 1; w >= 0; w--) {
      const weekData = [];
      const weekStart = startOfWeek(subDays(today, w * 7));
      
      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + d);
        
        // Don't show future dates
        if (date > today) {
          weekData.push(null);
          continue;
        }
        
        const dateStr = format(date, 'yyyy-MM-dd');
        const entry = entryMap.get(dateStr);
        
        weekData.push({
          date: dateStr,
          dayOfWeek: d,
          completed: entry?.completed || false,
          hasEntry: !!entry,
        });
      }
      
      weeksData.push({
        weekNumber: weeks - w,
        days: weekData,
      });
    }
    
    return weeksData;
  }, [entries, weeks]);

  const stats = useMemo(() => {
    let totalDays = 0;
    let completedDays = 0;
    
    heatmapData.forEach(week => {
      week.days.forEach(day => {
        if (day) {
          totalDays++;
          if (day.completed) completedDays++;
        }
      });
    });
    
    return {
      totalDays,
      completedDays,
      percentage: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
    };
  }, [heatmapData]);

  const getColor = (day: any) => {
    if (!day) return 'transparent';
    if (!day.hasEntry) return '#f3f4f6'; // Light gray for no data
    return day.completed ? '#10b981' : '#fca5a5'; // Green for completed, light red for missed
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Activity Heatmap</h3>
        <div className="text-sm text-gray-600">
          {stats.completedDays} / {stats.totalDays} days ({stats.percentage}%)
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Day labels */}
          <div className="flex gap-1 mb-1">
            <div className="w-10"></div>
            {DAYS.map((day, index) => (
              <div 
                key={day} 
                className={`w-4 h-4 text-xs text-gray-600 flex items-center justify-center ${
                  index % 2 === 0 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {day[0]}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1">
            {/* Week labels */}
            <div className="flex flex-col gap-1">
              {heatmapData.map((week, index) => (
                <div 
                  key={week.weekNumber}
                  className={`w-10 h-4 text-xs text-gray-600 flex items-center ${
                    index % 4 === 0 ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  W{week.weekNumber}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="flex gap-1">
              {heatmapData.map((week) => (
                <div key={week.weekNumber} className="flex flex-col gap-1">
                  {week.days.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="relative group"
                    >
                      <div
                        className={`w-4 h-4 rounded-sm transition-all duration-200 ${
                          day ? 'hover:ring-2 hover:ring-gray-400 hover:ring-offset-1' : ''
                        }`}
                        style={{ backgroundColor: getColor(day) }}
                      />
                      {day && (
                        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                          {day.date}
                          <br />
                          {day.completed ? '✅ Completed' : day.hasEntry ? '❌ Missed' : 'No data'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
              <div className="w-3 h-3 rounded-sm bg-red-300"></div>
              <div className="w-3 h-3 rounded-sm bg-green-300"></div>
              <div className="w-3 h-3 rounded-sm bg-green-500"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}