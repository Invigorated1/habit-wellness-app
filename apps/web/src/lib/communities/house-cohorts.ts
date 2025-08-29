/**
 * House Micro-Communities System
 * Small cohorts for deeper connection and accountability
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface HouseCohort {
  id: string;
  house: string;
  name: string;
  createdAt: Date;
  members: CohortMember[];
  stats: CohortStats;
  currentChallenge?: CohortChallenge;
}

export interface CohortMember {
  userId: string;
  username: string;
  avatar?: string;
  joinedAt: Date;
  role: 'member' | 'champion' | 'elder';
  currentStreak: number;
  totalPractices: number;
  lastActiveAt: Date;
  status: 'active' | 'resting' | 'away';
}

export interface CohortStats {
  averageStreak: number;
  totalPractices: number;
  activeToday: number;
  weeklyGrowth: number;
  topPractitioner: string;
}

export interface CohortChallenge {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  goal: {
    type: 'collective_practices' | 'streak_average' | 'daily_participation';
    target: number;
    current: number;
  };
  reward: string;
}

export interface CohortMessage {
  id: string;
  cohortId: string;
  userId: string;
  username: string;
  message: string;
  type: 'text' | 'achievement' | 'encouragement' | 'milestone';
  createdAt: Date;
  reactions: Array<{ userId: string; emoji: string }>;
}

export class HouseCohortSystem {
  private readonly COHORT_SIZE = 12;
  private readonly CHAMPION_THRESHOLD = 30; // 30-day streak for champion role
  private readonly ELDER_THRESHOLD = 100; // 100-day streak for elder role
  
  /**
   * Find or create a cohort for a user
   */
  async assignUserToCohort(userId: string, house: string): Promise<HouseCohort> {
    try {
      // Check if user already has a cohort
      const existingCohort = await this.getUserCohort(userId);
      if (existingCohort) {
        return existingCohort;
      }
      
      // Find an open cohort in the same house
      const openCohort = await this.findOpenCohort(house, userId);
      if (openCohort) {
        await this.addUserToCohort(userId, openCohort.id);
        return openCohort;
      }
      
      // Create a new cohort
      return await this.createNewCohort(house, userId);
    } catch (error) {
      logger.error('Failed to assign user to cohort', { userId, house, error });
      throw error;
    }
  }
  
  /**
   * Get user's current cohort
   */
  async getUserCohort(userId: string): Promise<HouseCohort | null> {
    // In real app, query from database
    // For now, return mock data
    return null;
  }
  
  /**
   * Find an open cohort with good match
   */
  private async findOpenCohort(house: string, userId: string): Promise<HouseCohort | null> {
    // Get user's profile for matching
    const userProfile = await this.getUserProfile(userId);
    
    // Find cohorts with space
    const availableCohorts = await this.getAvailableCohorts(house);
    
    // Score each cohort for compatibility
    const scoredCohorts = availableCohorts.map(cohort => ({
      cohort,
      score: this.calculateCohortCompatibility(cohort, userProfile),
    }));
    
    // Sort by score and return best match
    scoredCohorts.sort((a, b) => b.score - a.score);
    
    return scoredCohorts[0]?.cohort || null;
  }
  
  /**
   * Calculate compatibility score
   */
  private calculateCohortCompatibility(
    cohort: HouseCohort,
    userProfile: any
  ): number {
    let score = 0;
    
    // Timezone compatibility (same or adjacent timezones)
    const cohortTimezones = cohort.members.map(m => m.timezone || 'UTC');
    const userTimezone = userProfile.timezone || 'UTC';
    if (cohortTimezones.includes(userTimezone)) {
      score += 30;
    }
    
    // Experience level matching
    const avgStreak = cohort.stats.averageStreak;
    const userStreak = userProfile.currentStreak || 0;
    const streakDiff = Math.abs(avgStreak - userStreak);
    if (streakDiff < 7) {
      score += 25; // Similar experience
    } else if (streakDiff < 14) {
      score += 15; // Moderate difference
    }
    
    // Activity level matching
    const cohortActivity = cohort.stats.activeToday / cohort.members.length;
    if (cohortActivity > 0.7) {
      score += 20; // Active cohort
    }
    
    // Cohort size (prefer nearly full cohorts for community feel)
    const fillRate = cohort.members.length / this.COHORT_SIZE;
    if (fillRate >= 0.75) {
      score += 15;
    } else if (fillRate >= 0.5) {
      score += 10;
    }
    
    // Random factor for diversity
    score += Math.random() * 10;
    
    return score;
  }
  
  /**
   * Create a new cohort
   */
  private async createNewCohort(house: string, foundingUserId: string): Promise<HouseCohort> {
    const cohortName = this.generateCohortName(house);
    
    // In real app, create in database
    const newCohort: HouseCohort = {
      id: `cohort_${Date.now()}`,
      house,
      name: cohortName,
      createdAt: new Date(),
      members: [],
      stats: {
        averageStreak: 0,
        totalPractices: 0,
        activeToday: 0,
        weeklyGrowth: 0,
        topPractitioner: '',
      },
    };
    
    // Add founding member
    await this.addUserToCohort(foundingUserId, newCohort.id);
    
    logger.info('Created new cohort', { cohortId: newCohort.id, house, foundingUserId });
    
    return newCohort;
  }
  
  /**
   * Generate a unique cohort name
   */
  private generateCohortName(house: string): string {
    const houseNames = {
      MONK: ['Lotus', 'Bamboo', 'River', 'Mountain', 'Cloud', 'Stone'],
      WARRIOR_MONK: ['Tiger', 'Dragon', 'Phoenix', 'Thunder', 'Steel', 'Oak'],
      SAGE: ['Scroll', 'Quill', 'Crystal', 'Star', 'Moon', 'Library'],
      ARTISAN: ['Canvas', 'Palette', 'Harmony', 'Symphony', 'Forge', 'Studio'],
      OPERATIVE: ['Shadow', 'Precision', 'Focus', 'Edge', 'Vector', 'Matrix'],
      COUNCILOR: ['Circle', 'Bridge', 'Beacon', 'Crown', 'Alliance', 'Unity'],
    };
    
    const names = houseNames[house as keyof typeof houseNames] || ['Alpha', 'Beta', 'Gamma'];
    const name = names[Math.floor(Math.random() * names.length)];
    const number = Math.floor(Math.random() * 99) + 1;
    
    return `${name} ${number}`;
  }
  
  /**
   * Add user to cohort
   */
  private async addUserToCohort(userId: string, cohortId: string): Promise<void> {
    // In real app, update database
    logger.info('Added user to cohort', { userId, cohortId });
  }
  
  /**
   * Get available cohorts
   */
  private async getAvailableCohorts(house: string): Promise<HouseCohort[]> {
    // In real app, query database for cohorts with < 12 members
    return [];
  }
  
  /**
   * Get user profile for matching
   */
  private async getUserProfile(userId: string): Promise<any> {
    // In real app, fetch from database
    return {
      userId,
      timezone: 'America/New_York',
      currentStreak: 5,
      practiceFrequency: 'daily',
    };
  }
  
  /**
   * Post a message to cohort
   */
  async postMessage(
    cohortId: string,
    userId: string,
    message: string,
    type: CohortMessage['type'] = 'text'
  ): Promise<CohortMessage> {
    const newMessage: CohortMessage = {
      id: `msg_${Date.now()}`,
      cohortId,
      userId,
      username: 'User', // Get from database
      message,
      type,
      createdAt: new Date(),
      reactions: [],
    };
    
    // In real app, save to database and broadcast to cohort members
    logger.info('Posted cohort message', { cohortId, userId, type });
    
    return newMessage;
  }
  
  /**
   * Get cohort activity feed
   */
  async getCohortFeed(cohortId: string, limit: number = 20): Promise<CohortMessage[]> {
    // In real app, query from database
    return [
      {
        id: '1',
        cohortId,
        userId: 'user1',
        username: 'SunriseMeditator',
        message: 'Just completed my morning practice! Feeling centered 🧘',
        type: 'text',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        reactions: [{ userId: 'user2', emoji: '❤️' }],
      },
      {
        id: '2',
        cohortId,
        userId: 'user2',
        username: 'DawnWarrior',
        message: 'Achieved 7-day streak!',
        type: 'milestone',
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        reactions: [
          { userId: 'user1', emoji: '🎉' },
          { userId: 'user3', emoji: '💪' },
        ],
      },
    ];
  }
  
  /**
   * Start a cohort challenge
   */
  async startChallenge(cohortId: string, challengeType: string): Promise<CohortChallenge> {
    const challenges = {
      weekly_consistency: {
        title: '7 Days of Presence',
        description: 'Everyone practices at least once daily for 7 days',
        duration: 7,
        type: 'daily_participation' as const,
        target: 7 * 12, // 7 days * 12 members
        reward: 'Cohort Unity Badge',
      },
      collective_hours: {
        title: 'Collective Century',
        description: 'Accumulate 100 practice minutes as a group',
        duration: 3,
        type: 'collective_practices' as const,
        target: 100,
        reward: 'Time Masters Badge',
      },
      streak_boost: {
        title: 'Streak Surge',
        description: 'Increase average cohort streak by 3 days',
        duration: 10,
        type: 'streak_average' as const,
        target: 3,
        reward: 'Momentum Keepers Badge',
      },
    };
    
    const challenge = challenges[challengeType as keyof typeof challenges] || challenges.weekly_consistency;
    
    return {
      id: `challenge_${Date.now()}`,
      title: challenge.title,
      description: challenge.description,
      startDate: new Date(),
      endDate: new Date(Date.now() + challenge.duration * 24 * 60 * 60 * 1000),
      goal: {
        type: challenge.type,
        target: challenge.target,
        current: 0,
      },
      reward: challenge.reward,
    };
  }
  
  /**
   * Update member role based on achievements
   */
  async updateMemberRole(userId: string, cohortId: string): Promise<void> {
    const member = await this.getCohortMember(userId, cohortId);
    if (!member) return;
    
    let newRole: CohortMember['role'] = 'member';
    
    if (member.currentStreak >= this.ELDER_THRESHOLD) {
      newRole = 'elder';
    } else if (member.currentStreak >= this.CHAMPION_THRESHOLD) {
      newRole = 'champion';
    }
    
    if (newRole !== member.role) {
      // Update in database
      logger.info('Updated member role', { userId, cohortId, oldRole: member.role, newRole });
      
      // Post achievement message
      await this.postMessage(
        cohortId,
        'system',
        `${member.username} has become a ${newRole}! 🎉`,
        'achievement'
      );
    }
  }
  
  private async getCohortMember(userId: string, cohortId: string): Promise<CohortMember | null> {
    // In real app, query from database
    return null;
  }
}

export const houseCohorts = new HouseCohortSystem();