import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VariableRewardEngine } from '../variable-rewards';
import { RewardType } from '../variable-rewards';

describe('VariableRewardEngine', () => {
  let rewardEngine: VariableRewardEngine;

  beforeEach(() => {
    rewardEngine = new VariableRewardEngine();
    vi.clearAllMocks();
  });

  describe('checkRewards', () => {
    it('should always grant a reward on first completion', () => {
      const rewards = rewardEngine.checkRewards('practice_complete', {
        consecutiveDays: 1,
        practiceType: 'meditation',
      });

      expect(rewards.length).toBeGreaterThan(0);
      expect(rewards[0].type).toBe(RewardType.BADGE);
      expect(rewards[0].name).toContain('First');
    });

    it('should grant milestone rewards at specific intervals', () => {
      const rewards = rewardEngine.checkRewards('practice_complete', {
        consecutiveDays: 7,
        practiceType: 'meditation',
      });

      expect(rewards.length).toBeGreaterThan(0);
      const milestoneReward = rewards.find(r => r.type === RewardType.BADGE);
      expect(milestoneReward).toBeTruthy();
      expect(milestoneReward?.name).toContain('Week');
    });

    it('should randomly grant rewards based on rarity', () => {
      // Mock Math.random to test different scenarios
      const randomValues = [0.01, 0.15, 0.45, 0.99];
      let randomIndex = 0;
      vi.spyOn(Math, 'random').mockImplementation(() => randomValues[randomIndex++ % randomValues.length]);

      const results = [];
      for (let i = 0; i < 20; i++) {
        const rewards = rewardEngine.checkRewards('practice_complete', {
          consecutiveDays: 5,
          practiceType: 'meditation',
        });
        results.push(rewards);
      }

      // Should have some rewards and some empty arrays
      const hasRewards = results.filter(r => r.length > 0).length;
      const noRewards = results.filter(r => r.length === 0).length;
      
      expect(hasRewards).toBeGreaterThan(0);
      expect(noRewards).toBeGreaterThan(0);
    });

    it('should not grant rewards too frequently', () => {
      // Mock always lucky rolls
      vi.spyOn(Math, 'random').mockReturnValue(0.01);

      // First reward should work
      const rewards1 = rewardEngine.checkRewards('practice_complete', {
        consecutiveDays: 3,
        practiceType: 'meditation',
      });
      expect(rewards1.length).toBeGreaterThan(0);

      // Immediate second attempt should be rate limited
      const rewards2 = rewardEngine.checkRewards('practice_complete', {
        consecutiveDays: 3,
        practiceType: 'meditation',
      });
      expect(rewards2.length).toBe(0);
    });

    it('should grant rarer rewards with lower probability', () => {
      const results = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
      
      // Run many iterations to test probability distribution
      for (let i = 0; i < 1000; i++) {
        const rewards = rewardEngine.checkRewards('practice_complete', {
          consecutiveDays: 5,
          practiceType: 'meditation',
        });
        
        rewards.forEach(reward => {
          results[reward.rarity]++;
        });
      }

      // Common should be most frequent, legendary least
      expect(results.common).toBeGreaterThan(results.uncommon);
      expect(results.uncommon).toBeGreaterThan(results.rare);
      expect(results.rare).toBeGreaterThan(results.legendary);
    });
  });

  describe('reward properties', () => {
    it('should include appropriate metadata in rewards', () => {
      const rewards = rewardEngine.checkRewards('practice_complete', {
        consecutiveDays: 1,
        practiceType: 'meditation',
      });

      const reward = rewards[0];
      expect(reward).toHaveProperty('id');
      expect(reward).toHaveProperty('type');
      expect(reward).toHaveProperty('name');
      expect(reward).toHaveProperty('description');
      expect(reward).toHaveProperty('rarity');
      expect(reward).toHaveProperty('value');
      expect(reward).toHaveProperty('grantedAt');
    });

    it('should assign different values based on rarity', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01); // Force a reward

      const rewards = rewardEngine.checkRewards('practice_complete', {
        consecutiveDays: 5,
        practiceType: 'meditation',
      });

      const reward = rewards[0];
      const expectedValues = { common: 10, uncommon: 25, rare: 50, legendary: 100 };
      expect(reward.value).toBe(expectedValues[reward.rarity]);
    });
  });
});