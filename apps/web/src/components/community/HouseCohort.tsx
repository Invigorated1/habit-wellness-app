'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trophy, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AsciiArt } from '@/components/AsciiArt';
import { getHouseAscii } from '@/ascii';
import { 
  HouseCohort, 
  CohortMember, 
  CohortMessage,
  houseCohorts 
} from '@/lib/communities/house-cohorts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface HouseCohortProps {
  cohortId: string;
  userId: string;
}

export function HouseCohortView({ cohortId, userId }: HouseCohortProps) {
  const [cohort, setCohort] = useState<HouseCohort | null>(null);
  const [messages, setMessages] = useState<CohortMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Mock data - in real app, fetch from API
  useEffect(() => {
    const mockCohort: HouseCohort = {
      id: cohortId,
      house: 'MONK',
      name: 'Lotus 42',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      members: [
        {
          userId: 'user1',
          username: 'SunriseMeditator',
          joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          role: 'champion',
          currentStreak: 42,
          totalPractices: 156,
          lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'active',
        },
        {
          userId: 'user2',
          username: 'DawnWarrior',
          joinedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          role: 'member',
          currentStreak: 7,
          totalPractices: 45,
          lastActiveAt: new Date(),
          status: 'active',
        },
        {
          userId: userId,
          username: 'You',
          joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          role: 'member',
          currentStreak: 5,
          totalPractices: 12,
          lastActiveAt: new Date(),
          status: 'active',
        },
        // Add more mock members
        ...Array.from({ length: 5 }, (_, i) => ({
          userId: `user${i + 3}`,
          username: `Member${i + 3}`,
          joinedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          role: 'member' as const,
          currentStreak: Math.floor(Math.random() * 20),
          totalPractices: Math.floor(Math.random() * 100),
          lastActiveAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          status: Math.random() > 0.3 ? 'active' : 'resting' as const,
        })),
      ],
      stats: {
        averageStreak: 12.5,
        totalPractices: 487,
        activeToday: 6,
        weeklyGrowth: 15,
        topPractitioner: 'SunriseMeditator',
      },
      currentChallenge: {
        id: 'challenge1',
        title: '7 Days of Presence',
        description: 'Everyone practices at least once daily for 7 days',
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        goal: {
          type: 'daily_participation',
          target: 84, // 7 days * 12 members
          current: 36,
        },
        reward: 'Cohort Unity Badge',
      },
    };
    
    setCohort(mockCohort);
    setIsLoading(false);
    
    // Fetch messages
    houseCohorts.getCohortFeed(cohortId).then(setMessages);
  }, [cohortId, userId]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const message = await houseCohorts.postMessage(
      cohortId,
      userId,
      newMessage,
      'text'
    );
    
    setMessages(prev => [message, ...prev]);
    setNewMessage('');
  };
  
  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const hasReacted = msg.reactions.some(r => r.userId === userId);
        if (hasReacted) {
          return {
            ...msg,
            reactions: msg.reactions.filter(r => r.userId !== userId),
          };
        } else {
          return {
            ...msg,
            reactions: [...msg.reactions, { userId, emoji }],
          };
        }
      }
      return msg;
    }));
  };
  
  if (isLoading || !cohort) {
    return <div className="animate-pulse">Loading cohort...</div>;
  }
  
  const challengeProgress = cohort.currentChallenge
    ? (cohort.currentChallenge.goal.current / cohort.currentChallenge.goal.target) * 100
    : 0;
  
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Left Column - Cohort Info & Members */}
      <div className="space-y-6">
        {/* Cohort Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AsciiArt
                ascii={getHouseAscii(cohort.house)}
                variant="badge"
              />
            </div>
            <CardTitle className="text-2xl">{cohort.name}</CardTitle>
            <CardDescription>
              {cohort.house} House • {cohort.members.length}/12 Members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[var(--accent)]">
                  {cohort.stats.averageStreak.toFixed(1)}
                </p>
                <p className="text-xs text-[var(--muted)]">Avg Streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--accent)]">
                  {cohort.stats.activeToday}
                </p>
                <p className="text-xs text-[var(--muted)]">Active Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Cohort Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cohort.members
              .sort((a, b) => b.currentStreak - a.currentStreak)
              .map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-bold">
                        {member.username[0]}
                      </div>
                      {member.status === 'active' && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--card)]" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1">
                        {member.username}
                        {member.role === 'champion' && '👑'}
                        {member.role === 'elder' && '🌟'}
                        {member.userId === userId && ' (You)'}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {member.currentStreak} day streak
                      </p>
                    </div>
                  </div>
                  {member.currentStreak >= 7 && (
                    <span className="text-sm">🔥</span>
                  )}
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
      
      {/* Middle Column - Activity Feed */}
      <div className="space-y-6">
        {/* Current Challenge */}
        {cohort.currentChallenge && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Current Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-1">
                {cohort.currentChallenge.title}
              </h4>
              <p className="text-xs text-[var(--muted)] mb-3">
                {cohort.currentChallenge.description}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>
                    {cohort.currentChallenge.goal.current}/
                    {cohort.currentChallenge.goal.target}
                  </span>
                </div>
                <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${challengeProgress}%` }}
                    className="h-full bg-[var(--accent)]"
                  />
                </div>
                <p className="text-xs text-[var(--muted)]">
                  Reward: {cohort.currentChallenge.reward}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Activity Feed */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Cohort Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Message Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Share with your cohort..."
                className="flex-1 px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Messages */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      'p-3 rounded-lg',
                      message.type === 'milestone'
                        ? 'bg-[var(--accent)] bg-opacity-10 border border-[var(--accent)]'
                        : 'bg-[var(--bg)]'
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium">
                        {message.username}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {formatDistanceToNow(message.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-sm mb-2">{message.message}</p>
                    <div className="flex gap-2">
                      {['❤️', '💪', '🎉', '🔥'].map((emoji) => {
                        const reactionCount = message.reactions.filter(
                          r => r.emoji === emoji
                        ).length;
                        const hasReacted = message.reactions.some(
                          r => r.userId === userId && r.emoji === emoji
                        );
                        
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(message.id, emoji)}
                            className={cn(
                              'px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors',
                              hasReacted
                                ? 'bg-[var(--accent)] bg-opacity-20'
                                : 'hover:bg-[var(--bg)]'
                            )}
                          >
                            <span>{emoji}</span>
                            {reactionCount > 0 && <span>{reactionCount}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Right Column - Quick Actions & Stats */}
      <div className="space-y-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="ghost" size="sm">
              <Trophy className="w-4 h-4 mr-2" />
              Start New Challenge
            </Button>
            <Button className="w-full justify-start" variant="ghost" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Invite Friends
            </Button>
            <Button className="w-full justify-start" variant="ghost" size="sm">
              <Zap className="w-4 h-4 mr-2" />
              Practice Together
            </Button>
          </CardContent>
        </Card>
        
        {/* Weekly Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">This Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-[var(--muted)]">Total Practices</span>
              <span className="text-sm font-medium">{cohort.stats.totalPractices}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--muted)]">Growth</span>
              <span className="text-sm font-medium text-green-500">
                +{cohort.stats.weeklyGrowth}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--muted)]">Top Practitioner</span>
              <span className="text-sm font-medium">
                {cohort.stats.topPractitioner}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}