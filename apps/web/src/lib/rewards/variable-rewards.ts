/**
 * Variable Rewards Engine
 * Intermittent reinforcement for sustained engagement
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';

export enum RewardType {
  BONUS_XP = 'BONUS_XP',
  RARE_BADGE = 'RARE_BADGE',
  HOUSE_GIFT = 'HOUSE_GIFT',
  PEER_SHOUTOUT = 'PEER_SHOUTOUT',
  SECRET_PRACTICE = 'SECRET_PRACTICE',
  FREEZE_TOKEN = 'FREEZE_TOKEN',
  TITLE_UNLOCK = 'TITLE_UNLOCK',
  ASCII_ART = 'ASCII_ART',
}

export enum RewardRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

export interface VariableReward {
  id: string;
  type: RewardType;
  rarity: RewardRarity;
  value: any;
  title: string;
  description: string;
  asciiArt?: string;
  expiresAt?: Date;
}

export interface RewardContext {
  userId: string;
  action: string; // 'practice_complete', 'streak_milestone', etc.
  metadata: {
    practiceType?: string;
    streakLength?: number;
    timeOfDay?: string;
    house?: string;
    consecutiveDays?: number;
  };
}

export class VariableRewardsEngine {
  // Base probabilities for reward triggers
  private readonly BASE_PROBABILITIES = {
    [RewardRarity.COMMON]: 0.15,      // 15%
    [RewardRarity.UNCOMMON]: 0.08,    // 8%
    [RewardRarity.RARE]: 0.03,        // 3%
    [RewardRarity.EPIC]: 0.01,        // 1%
    [RewardRarity.LEGENDARY]: 0.001,  // 0.1%
  };
  
  // Reward pools by type
  private readonly REWARD_POOLS = {
    [RewardType.BONUS_XP]: [
      { multiplier: 2, rarity: RewardRarity.COMMON },
      { multiplier: 3, rarity: RewardRarity.UNCOMMON },
      { multiplier: 5, rarity: RewardRarity.RARE },
      { multiplier: 10, rarity: RewardRarity.EPIC },
    ],
    
    [RewardType.RARE_BADGE]: [
      { badge: 'SUNRISE_WARRIOR', rarity: RewardRarity.UNCOMMON, condition: 'morning' },
      { badge: 'MIDNIGHT_SAGE', rarity: RewardRarity.UNCOMMON, condition: 'night' },
      { badge: 'PERFECT_FORM', rarity: RewardRarity.RARE },
      { badge: 'FLOW_STATE', rarity: RewardRarity.RARE },
      { badge: 'TRANSCENDENT', rarity: RewardRarity.EPIC },
      { badge: 'LEGENDARY_FOCUS', rarity: RewardRarity.LEGENDARY },
    ],
    
    [RewardType.HOUSE_GIFT]: [
      { gift: 'CUSTOM_AVATAR_FRAME', rarity: RewardRarity.RARE },
      { gift: 'HOUSE_BANNER', rarity: RewardRarity.RARE },
      { gift: 'EXCLUSIVE_PRACTICE', rarity: RewardRarity.EPIC },
      { gift: 'HOUSE_ELDER_TITLE', rarity: RewardRarity.LEGENDARY },
    ],
    
    [RewardType.ASCII_ART]: [
      { 
        art: `
    .-"-.
   /     \\
  | o   o |
  |   >   |
  |  ___  |
   \\_____/
        `,
        name: 'Enlightened Face',
        rarity: RewardRarity.UNCOMMON,
      },
      {
        art: `
     /\\
    /  \\
   / /\\ \\
  / /  \\ \\
 /_/    \\_\\
   LEGEND
        `,
        name: 'Mountain Peak',
        rarity: RewardRarity.RARE,
      },
      {
        art: `
  ✨ ★ ✨
    \\|/
  ---*---
    /|\\
  ✨ ★ ✨
        `,
        name: 'Cosmic Burst',
        rarity: RewardRarity.EPIC,
      },
    ],
  };
  
  /**
   * Check for variable rewards after an action
   */
  async checkForRewards(context: RewardContext): Promise<VariableReward[]> {
    const rewards: VariableReward[] = [];
    
    try {
      // Apply context modifiers
      const probability = this.calculateProbability(context);
      
      // Check each rarity tier
      for (const [rarity, baseProbability] of Object.entries(this.BASE_PROBABILITIES)) {
        const roll = Math.random();
        const adjustedProbability = baseProbability * probability.modifier;
        
        if (roll < adjustedProbability) {
          const reward = await this.generateReward(
            rarity as RewardRarity,
            context
          );
          
          if (reward) {
            rewards.push(reward);
            await this.logReward(reward, context);
            
            // Legendary rewards are exclusive - stop checking
            if (rarity === RewardRarity.LEGENDARY) break;
          }
        }
      }
      
      // Special event multipliers
      if (await this.isSpecialEvent()) {
        rewards.forEach(reward => {
          if (reward.type === RewardType.BONUS_XP) {
            reward.value.multiplier *= 2;
            reward.title = `🎉 ${reward.title} (Event Bonus!)`;
          }
        });
      }
      
      return rewards;
    } catch (error) {
      logger.error('Failed to check for rewards', { context, error });
      return [];
    }
  }
  
  /**
   * Calculate probability modifiers based on context
   */
  private calculateProbability(context: RewardContext): { modifier: number; reasons: string[] } {
    let modifier = 1.0;
    const reasons: string[] = [];
    
    // Streak-based modifiers
    if (context.metadata.streakLength) {
      if (context.metadata.streakLength >= 30) {
        modifier *= 2.0;
        reasons.push('30+ day streak');
      } else if (context.metadata.streakLength >= 7) {
        modifier *= 1.5;
        reasons.push('7+ day streak');
      }
    }
    
    // Time-based modifiers (reward consistency)
    if (context.metadata.timeOfDay === 'early_morning') {
      modifier *= 1.3;
      reasons.push('Early bird bonus');
    } else if (context.metadata.timeOfDay === 'late_night') {
      modifier *= 1.2;
      reasons.push('Night owl bonus');
    }
    
    // Consecutive days modifier
    if (context.metadata.consecutiveDays && context.metadata.consecutiveDays >= 3) {
      modifier *= 1.1;
      reasons.push('Consistency bonus');
    }
    
    // Prevent reward fatigue - reduce probability if too many recent rewards
    const recentRewardsCount = await this.getRecentRewardsCount(context.userId);
    if (recentRewardsCount > 5) {
      modifier *= 0.5;
      reasons.push('Cooldown period');
    }
    
    return { modifier, reasons };
  }
  
  /**
   * Generate a specific reward
   */
  private async generateReward(
    rarity: RewardRarity,
    context: RewardContext
  ): Promise<VariableReward | null> {
    // Select reward type based on context and rarity
    const eligibleTypes = this.getEligibleRewardTypes(rarity, context);
    if (eligibleTypes.length === 0) return null;
    
    const selectedType = eligibleTypes[Math.floor(Math.random() * eligibleTypes.length)];
    const pool = this.REWARD_POOLS[selectedType] || [];
    
    // Filter pool by rarity and conditions
    const eligibleRewards = pool.filter(r => 
      r.rarity === rarity && 
      (!r.condition || this.checkCondition(r.condition, context))
    );
    
    if (eligibleRewards.length === 0) return null;
    
    const selected = eligibleRewards[Math.floor(Math.random() * eligibleRewards.length)];
    
    // Create reward object
    return this.createReward(selectedType, selected, context);
  }
  
  /**
   * Create reward object
   */
  private createReward(
    type: RewardType,
    rewardData: any,
    context: RewardContext
  ): VariableReward {
    const id = `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    switch (type) {
      case RewardType.BONUS_XP:
        return {
          id,
          type,
          rarity: rewardData.rarity,
          value: { 
            multiplier: rewardData.multiplier,
            baseXP: 10,
            totalXP: 10 * rewardData.multiplier,
          },
          title: `${rewardData.multiplier}x XP Bonus!`,
          description: `Earned ${10 * rewardData.multiplier} XP instead of 10!`,
          asciiArt: this.getXPAscii(rewardData.multiplier),
        };
        
      case RewardType.RARE_BADGE:
        return {
          id,
          type,
          rarity: rewardData.rarity,
          value: { badge: rewardData.badge },
          title: this.getBadgeTitle(rewardData.badge),
          description: this.getBadgeDescription(rewardData.badge),
          asciiArt: this.getBadgeAscii(rewardData.badge),
        };
        
      case RewardType.ASCII_ART:
        return {
          id,
          type,
          rarity: rewardData.rarity,
          value: { art: rewardData.art, name: rewardData.name },
          title: `Unlocked: ${rewardData.name}`,
          description: 'A rare ASCII art for your collection!',
          asciiArt: rewardData.art,
        };
        
      default:
        return {
          id,
          type,
          rarity: rewardData.rarity,
          value: rewardData,
          title: 'Mystery Reward!',
          description: 'Something special just for you',
        };
    }
  }
  
  /**
   * Get eligible reward types based on rarity
   */
  private getEligibleRewardTypes(rarity: RewardRarity, context: RewardContext): RewardType[] {
    const types: RewardType[] = [];
    
    // Common rewards
    if (rarity === RewardRarity.COMMON || rarity === RewardRarity.UNCOMMON) {
      types.push(RewardType.BONUS_XP);
      types.push(RewardType.PEER_SHOUTOUT);
    }
    
    // Rare rewards
    if (rarity === RewardRarity.RARE || rarity === RewardRarity.EPIC) {
      types.push(RewardType.RARE_BADGE);
      types.push(RewardType.ASCII_ART);
      types.push(RewardType.FREEZE_TOKEN);
    }
    
    // Epic/Legendary rewards
    if (rarity === RewardRarity.EPIC || rarity === RewardRarity.LEGENDARY) {
      types.push(RewardType.HOUSE_GIFT);
      types.push(RewardType.SECRET_PRACTICE);
      types.push(RewardType.TITLE_UNLOCK);
    }
    
    return types;
  }
  
  // Helper methods
  private checkCondition(condition: string, context: RewardContext): boolean {
    switch (condition) {
      case 'morning':
        return context.metadata.timeOfDay === 'morning' || 
               context.metadata.timeOfDay === 'early_morning';
      case 'night':
        return context.metadata.timeOfDay === 'evening' || 
               context.metadata.timeOfDay === 'late_night';
      default:
        return true;
    }
  }
  
  private async getRecentRewardsCount(userId: string): Promise<number> {
    const key = `rewards:recent:${userId}`;
    const count = await redis.get(key);
    return Number(count) || 0;
  }
  
  private async isSpecialEvent(): Promise<boolean> {
    // Check for weekend, holidays, or special events
    const day = new Date().getDay();
    return day === 0 || day === 6; // Weekend bonus
  }
  
  private async logReward(reward: VariableReward, context: RewardContext): Promise<void> {
    // Increment recent rewards counter
    const key = `rewards:recent:${context.userId}`;
    await redis.incr(key);
    await redis.expire(key, 60 * 60 * 24); // 24 hour window
    
    logger.info('Variable reward triggered', {
      userId: context.userId,
      reward: reward.type,
      rarity: reward.rarity,
      action: context.action,
    });
  }
  
  // ASCII art helpers
  private getXPAscii(multiplier: number): string {
    if (multiplier >= 10) {
      return `
    ╔══════╗
    ║ ${multiplier}x! ║
    ╚══════╝
      `;
    } else if (multiplier >= 5) {
      return `
    ┌──────┐
    │ ${multiplier}x! │
    └──────┘
      `;
    } else {
      return `[ ${multiplier}x XP ]`;
    }
  }
  
  private getBadgeAscii(badge: string): string {
    const badgeAscii: Record<string, string> = {
      SUNRISE_WARRIOR: `
     ___
    / ☀ \\
   |     |
    \\___/
      `,
      MIDNIGHT_SAGE: `
     ___
    / ★ \\
   | ◐◑ |
    \\___/
      `,
      PERFECT_FORM: `
    ╔═══╗
    ║ ✓ ║
    ╚═══╝
      `,
      FLOW_STATE: `
    ≈≈≈≈≈
    ≈ ∞ ≈
    ≈≈≈≈≈
      `,
    };
    
    return badgeAscii[badge] || '[ ? ]';
  }
  
  private getBadgeTitle(badge: string): string {
    const titles: Record<string, string> = {
      SUNRISE_WARRIOR: 'Sunrise Warrior',
      MIDNIGHT_SAGE: 'Midnight Sage',
      PERFECT_FORM: 'Perfect Form',
      FLOW_STATE: 'Flow State Master',
      TRANSCENDENT: 'Transcendent Being',
      LEGENDARY_FOCUS: 'Legendary Focus',
    };
    
    return titles[badge] || 'Mystery Badge';
  }
  
  private getBadgeDescription(badge: string): string {
    const descriptions: Record<string, string> = {
      SUNRISE_WARRIOR: 'Completed practice before 6 AM',
      MIDNIGHT_SAGE: 'Practiced under the stars',
      PERFECT_FORM: 'Flawless execution detected',
      FLOW_STATE: 'Achieved deep flow state',
      TRANSCENDENT: 'Reached a higher plane',
      LEGENDARY_FOCUS: 'Unwavering concentration',
    };
    
    return descriptions[badge] || 'A rare achievement';
  }
}

export const variableRewards = new VariableRewardsEngine();