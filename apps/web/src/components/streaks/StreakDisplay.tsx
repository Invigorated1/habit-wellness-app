'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AsciiArt, AnimatedAsciiArt } from '@/components/AsciiArt';
import { STREAK_FIRE_ANIMATION, BADGE_FLAME } from '@/ascii';
import { gracefulStreaks, StreakData } from '@/lib/streaks/graceful-streaks';
import { cn } from '@/lib/utils';

interface StreakDisplayProps {
  userId: string;
  variant?: 'compact' | 'full';
  className?: string;
}

export function StreakDisplay({ userId, variant = 'compact', className }: StreakDisplayProps) {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchStreak() {
      try {
        const data = await gracefulStreaks.getStreakData(userId);
        setStreakData(data);
      } catch (error) {
        console.error('Failed to fetch streak data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStreak();
  }, [userId]);
  
  if (loading || !streakData) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-8 w-24 bg-[var(--muted)] rounded" />
      </div>
    );
  }
  
  const isActive = streakData.currentStreak > 0;
  const showFire = streakData.currentStreak >= 3;
  
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showFire && (
          <AnimatedAsciiArt
            frames={STREAK_FIRE_ANIMATION}
            fps={2}
            variant="inline"
          />
        )}
        <div className="font-mono">
          <span className={cn(
            'text-2xl font-bold',
            isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
          )}>
            {streakData.currentStreak}
          </span>
          <span className="text-sm text-[var(--muted)] ml-1">
            {streakData.currentStreak === 1 ? 'day' : 'days'}
          </span>
        </div>
        {streakData.freezeTokens > 0 && (
          <div className="text-sm text-[var(--muted)]" title="Freeze tokens">
            🛡️×{streakData.freezeTokens}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Streak */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Current Streak</h3>
          {showFire && (
            <AnimatedAsciiArt
              frames={STREAK_FIRE_ANIMATION}
              fps={2}
              variant="inline"
            />
          )}
        </div>
        
        <div className="text-center py-4">
          <motion.div
            key={streakData.currentStreak}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-mono font-bold text-[var(--accent)]"
          >
            {streakData.currentStreak}
          </motion.div>
          <p className="text-sm text-[var(--muted)]">
            {streakData.currentStreak === 1 ? 'day' : 'days'}
          </p>
        </div>
        
        {/* Best Streak */}
        {streakData.bestStreak > 0 && (
          <div className="text-center text-sm text-[var(--muted)]">
            Best: {streakData.bestStreak} days
          </div>
        )}
      </div>
      
      {/* Freeze Tokens */}
      {streakData.freezeTokens > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <h3 className="font-semibold mb-2">Freeze Tokens</h3>
          <div className="flex items-center gap-2">
            {Array.from({ length: streakData.freezeTokens }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-2xl"
              >
                🛡️
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            Use when you miss a day to save your streak
          </p>
        </div>
      )}
      
      {/* Milestones */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Next Milestones</h3>
        {[7, 30, 100].map((milestone) => {
          const progress = Math.min(100, (streakData.currentStreak / milestone) * 100);
          const isAchieved = streakData.currentStreak >= milestone;
          
          return (
            <div key={milestone} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className={cn(
                  isAchieved && 'text-[var(--accent)]'
                )}>
                  {milestone} days
                </span>
                <span className="text-[var(--muted)]">
                  {isAchieved ? '✓' : `${milestone - streakData.currentStreak} to go`}
                </span>
              </div>
              <div className="h-1 bg-[var(--muted)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-[var(--accent)]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Mini streak badge for nav/header
export function StreakBadge({ userId }: { userId: string }) {
  const [streak, setStreak] = useState(0);
  
  useEffect(() => {
    gracefulStreaks.getStreakData(userId).then(data => {
      setStreak(data.currentStreak);
    });
  }, [userId]);
  
  if (streak === 0) return null;
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-1 px-2 py-1 bg-[var(--accent)] text-[var(--bg)] rounded-full text-xs font-mono font-bold"
    >
      {streak >= 3 && '🔥'}
      {streak}
    </motion.div>
  );
}