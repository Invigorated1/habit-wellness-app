'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useOnboardingStore } from '@/stores/onboarding';
import { HouseCohortView } from '@/components/community/HouseCohort';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AsciiArt } from '@/components/AsciiArt';
import { getHouseAscii } from '@/ascii';
import { Trophy, Users, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HouseHubPage() {
  const { userId } = useAuth();
  const { assignedHouse } = useOnboardingStore();
  const [cohortId, setCohortId] = useState<string | null>(null);
  
  // Mock data - in real app, fetch user's cohort
  useEffect(() => {
    if (userId) {
      setCohortId('cohort_123'); // Mock cohort ID
    }
  }, [userId]);
  
  if (!userId || !assignedHouse) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Join Your House</CardTitle>
            <CardDescription>
              Complete the onboarding to discover your house and join your cohort.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/onboarding'}
              className="w-full"
            >
              Start Your Journey
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Mock house stats
  const houseStats = {
    totalMembers: 1247,
    activeToday: 892,
    avgStreak: 8.3,
    topStreak: 365,
    weeklyGrowth: 12,
    achievements: 45,
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* House Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex justify-center mb-4">
          <AsciiArt
            ascii={getHouseAscii(assignedHouse)}
            variant="display"
          />
        </div>
        <h1 className="text-4xl font-bold mb-2">
          {assignedHouse.charAt(0) + assignedHouse.slice(1).toLowerCase().replace('_', ' ')} House
        </h1>
        <p className="text-[var(--muted)]">
          United in practice, growing together
        </p>
      </motion.div>
      
      {/* House Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
      >
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-[var(--accent)]" />
            <p className="text-2xl font-bold">{houseStats.totalMembers}</p>
            <p className="text-xs text-[var(--muted)]">Total Members</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-6 h-6 mx-auto mb-2 text-[var(--accent)]" />
            <p className="text-2xl font-bold">{houseStats.activeToday}</p>
            <p className="text-xs text-[var(--muted)]">Active Today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-2xl mb-2 block">🔥</span>
            <p className="text-2xl font-bold">{houseStats.avgStreak.toFixed(1)}</p>
            <p className="text-xs text-[var(--muted)]">Avg Streak</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-2xl mb-2 block">👑</span>
            <p className="text-2xl font-bold">{houseStats.topStreak}</p>
            <p className="text-xs text-[var(--muted)]">Top Streak</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">+{houseStats.weeklyGrowth}%</p>
            <p className="text-xs text-[var(--muted)]">Weekly Growth</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{houseStats.achievements}</p>
            <p className="text-xs text-[var(--muted)]">Achievements</p>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Your Cohort Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold mb-6">Your Cohort</h2>
        {cohortId ? (
          <HouseCohortView cohortId={cohortId} userId={userId} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Finding Your Cohort...</CardTitle>
              <CardDescription>
                We're matching you with the perfect group of practitioners.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-[var(--muted)] h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-[var(--muted)] rounded"></div>
                  <div className="h-4 bg-[var(--muted)] rounded w-5/6"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
      
      {/* House-wide Events */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-12"
      >
        <h2 className="text-2xl font-bold mb-6">House Events</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grand Assembly</CardTitle>
              <CardDescription>Monthly house-wide meditation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">
                Join hundreds of {assignedHouse.toLowerCase()} practitioners in synchronized practice.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">Next: Dec 1st, 8 PM</span>
                <Button size="sm">Join</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">House Championship</CardTitle>
              <CardDescription>Friendly competition between houses</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">
                Compete for the highest average streak this month.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">Current: 2nd place</span>
                <Button size="sm" variant="secondary">View Leaderboard</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Elder's Wisdom</CardTitle>
              <CardDescription>Learn from experienced practitioners</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">
                Weekly sessions with house elders sharing insights.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">Every Sunday</span>
                <Button size="sm" variant="secondary">Schedule</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}