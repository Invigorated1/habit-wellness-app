'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AsciiArt } from '@/components/AsciiArt';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { MapPin, Flag, Mountain, Sparkles } from 'lucide-react';

interface JourneyMilestone {
  id: string;
  type: 'start' | 'achievement' | 'streak' | 'level' | 'challenge' | 'current';
  date: Date;
  title: string;
  description: string;
  icon: string;
  xp?: number;
  special?: boolean;
}

interface JourneyStats {
  totalDays: number;
  totalPractices: number;
  totalMinutes: number;
  bestStreak: number;
  achievements: number;
  level: number;
}

interface JourneyMapProps {
  userId: string;
}

export function JourneyMap({ userId }: JourneyMapProps) {
  const [milestones, setMilestones] = useState<JourneyMilestone[]>([]);
  const [stats, setStats] = useState<JourneyStats | null>(null);
  const [hoveredMilestone, setHoveredMilestone] = useState<string | null>(null);
  
  // Mock data - in real app, fetch from API
  useEffect(() => {
    const mockMilestones: JourneyMilestone[] = [
      {
        id: '1',
        type: 'start',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        title: 'Journey Begins',
        description: 'You discovered your archetype: Monk',
        icon: '🌱',
      },
      {
        id: '2',
        type: 'achievement',
        date: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
        title: 'First Practice',
        description: 'Completed your first 2-minute practice',
        icon: '✨',
        xp: 50,
      },
      {
        id: '3',
        type: 'streak',
        date: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
        title: 'Week Warrior',
        description: 'Achieved your first 7-day streak',
        icon: '🔥',
        xp: 100,
        special: true,
      },
      {
        id: '4',
        type: 'level',
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        title: 'Level 5 Reached',
        description: 'Unlocked new practices',
        icon: '⭐',
        xp: 200,
      },
      {
        id: '5',
        type: 'challenge',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        title: 'House Challenge',
        description: 'Completed "7 Days of Presence" with your cohort',
        icon: '🏆',
        xp: 150,
        special: true,
      },
      {
        id: '6',
        type: 'achievement',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        title: 'Flow State',
        description: 'First 30-minute deep practice',
        icon: '≈',
        xp: 75,
      },
      {
        id: '7',
        type: 'current',
        date: new Date(),
        title: 'Present Moment',
        description: 'Your journey continues...',
        icon: '◉',
      },
    ];
    
    const mockStats: JourneyStats = {
      totalDays: 30,
      totalPractices: 45,
      totalMinutes: 487,
      bestStreak: 12,
      achievements: 8,
      level: 7,
    };
    
    setMilestones(mockMilestones);
    setStats(mockStats);
  }, [userId]);
  
  const getMilestoneColor = (type: JourneyMilestone['type']) => {
    switch (type) {
      case 'start': return 'text-green-500';
      case 'achievement': return 'text-blue-500';
      case 'streak': return 'text-orange-500';
      case 'level': return 'text-purple-500';
      case 'challenge': return 'text-yellow-500';
      case 'current': return 'text-[var(--accent)]';
      default: return 'text-[var(--muted)]';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Journey Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="w-5 h-5 mx-auto mb-2 text-[var(--accent)]" />
            <p className="text-xl font-bold">{stats?.totalDays}</p>
            <p className="text-xs text-[var(--muted)]">Days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-xl mb-2 block">🧘</span>
            <p className="text-xl font-bold">{stats?.totalPractices}</p>
            <p className="text-xs text-[var(--muted)]">Practices</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-xl mb-2 block">⏱️</span>
            <p className="text-xl font-bold">{stats?.totalMinutes}</p>
            <p className="text-xs text-[var(--muted)]">Minutes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-xl mb-2 block">🔥</span>
            <p className="text-xl font-bold">{stats?.bestStreak}</p>
            <p className="text-xs text-[var(--muted)]">Best Streak</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-xl mb-2 block">🏆</span>
            <p className="text-xl font-bold">{stats?.achievements}</p>
            <p className="text-xs text-[var(--muted)]">Achievements</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-xl mb-2 block">⭐</span>
            <p className="text-xl font-bold">Level {stats?.level}</p>
            <p className="text-xs text-[var(--muted)]">Current</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Journey Path Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mountain className="w-5 h-5" />
            Your Journey Path
          </CardTitle>
          <CardDescription>
            Every step matters on the path to mastery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Path Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[var(--border)]" />
            
            {/* Milestones */}
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-start gap-4"
                  onMouseEnter={() => setHoveredMilestone(milestone.id)}
                  onMouseLeave={() => setHoveredMilestone(null)}
                >
                  {/* Milestone Marker */}
                  <div className={cn(
                    'relative z-10 w-16 h-16 rounded-full flex items-center justify-center',
                    milestone.type === 'current'
                      ? 'bg-[var(--accent)] animate-pulse'
                      : 'bg-[var(--card)] border-2',
                    getMilestoneColor(milestone.type),
                    milestone.special && 'ring-4 ring-yellow-500 ring-opacity-30'
                  )}>
                    <span className="text-2xl">{milestone.icon}</span>
                    
                    {/* Connection dot */}
                    <div className={cn(
                      'absolute w-3 h-3 rounded-full',
                      milestone.type === 'current'
                        ? 'bg-[var(--accent)]'
                        : 'bg-[var(--card)]',
                      'border-2',
                      getMilestoneColor(milestone.type),
                      'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
                    )} />
                  </div>
                  
                  {/* Milestone Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          {milestone.title}
                          {milestone.special && (
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                          )}
                        </h4>
                        <p className="text-sm text-[var(--muted)] mt-1">
                          {milestone.description}
                        </p>
                        {milestone.xp && (
                          <p className="text-xs text-[var(--accent)] mt-1">
                            +{milestone.xp} XP
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-[var(--muted)] ml-4">
                        {formatDistanceToNow(milestone.date, { addSuffix: true })}
                      </span>
                    </div>
                    
                    {/* Hover Details */}
                    <AnimatePresence>
                      {hoveredMilestone === milestone.id && milestone.type !== 'current' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-3 bg-[var(--bg)] rounded-lg text-sm"
                        >
                          <p className="text-[var(--muted)]">
                            {milestone.date.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Future Path Preview */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: milestones.length * 0.1 }}
              className="relative flex items-center gap-4 mt-8 opacity-50"
            >
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-[var(--muted)] flex items-center justify-center">
                <Flag className="w-6 h-6 text-[var(--muted)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">
                  Your next milestone awaits...
                </p>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
      
      {/* Journey Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Journey Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-[var(--bg)] rounded-lg">
            <p className="text-sm text-[var(--muted)] mb-1">Most Active Time</p>
            <p className="font-medium">Morning (7-9 AM)</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              You're 73% more likely to practice in the morning
            </p>
          </div>
          
          <div className="p-4 bg-[var(--bg)] rounded-lg">
            <p className="text-sm text-[var(--muted)] mb-1">Favorite Practice</p>
            <p className="font-medium">Vipassana Body Scan</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Completed 18 times • Average duration: 22 minutes
            </p>
          </div>
          
          <div className="p-4 bg-[var(--bg)] rounded-lg">
            <p className="text-sm text-[var(--muted)] mb-1">Growth Rate</p>
            <p className="font-medium text-green-500">+24% this month</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Practice consistency improving steadily
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}