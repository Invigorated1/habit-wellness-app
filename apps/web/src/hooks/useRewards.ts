/**
 * Hook for managing variable rewards
 */

import { useState, useCallback } from 'react';
import { variableRewards, VariableReward, RewardContext } from '@/lib/rewards/variable-rewards';
import { useAuth } from '@clerk/nextjs';
import { useOnboardingStore } from '@/stores/onboarding';

/**
 * Hook for managing variable rewards in the application
 * @returns Object containing reward state and methods
 * @example
 * ```tsx
 * const { pendingRewards, checkRewards, claimReward } = useRewards();
 * 
 * // Check for rewards after completing a task
 * const rewards = await checkRewards('practice_complete', { 
 *   practiceType: 'meditation' 
 * });
 * ```
 */
export function useRewards() {
  const [pendingRewards, setPendingRewards] = useState<VariableReward[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const { userId } = useAuth();
  const { assignedHouse } = useOnboardingStore();
  
  /**
   * Check for rewards after an action
   */
  const checkRewards = useCallback(async (
    action: string,
    metadata?: Partial<RewardContext['metadata']>
  ) => {
    if (!userId || isChecking) return [];
    
    setIsChecking(true);
    
    try {
      const context: RewardContext = {
        userId,
        action,
        metadata: {
          house: assignedHouse || 'MONK',
          timeOfDay: getTimeOfDay(),
          ...metadata,
        },
      };
      
      const rewards = await variableRewards.checkForRewards(context);
      
      if (rewards.length > 0) {
        setPendingRewards(prev => [...prev, ...rewards]);
        
        // Play sound effect for rare+ rewards
        const hasRareReward = rewards.some(r => 
          ['RARE', 'EPIC', 'LEGENDARY'].includes(r.rarity)
        );
        
        if (hasRareReward) {
          playRewardSound();
        }
      }
      
      return rewards;
    } catch (error) {
      console.error('Failed to check rewards:', error);
      return [];
    } finally {
      setIsChecking(false);
    }
  }, [userId, assignedHouse, isChecking]);
  
  /**
   * Clear pending rewards
   */
  const clearRewards = useCallback(() => {
    setPendingRewards([]);
  }, []);
  
  /**
   * Claim a specific reward
   */
  const claimReward = useCallback(async (rewardId: string) => {
    const reward = pendingRewards.find(r => r.id === rewardId);
    if (!reward) return;
    
    // In real app, would call API to claim reward
    console.log('Claiming reward:', reward);
    
    // Remove from pending
    setPendingRewards(prev => prev.filter(r => r.id !== rewardId));
    
    // Return the reward for further processing
    return reward;
  }, [pendingRewards]);
  
  return {
    pendingRewards,
    checkRewards,
    clearRewards,
    claimReward,
    isChecking,
  };
}

// Helper functions
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 9) return 'early_morning';
  if (hour >= 9 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'late_night';
}

function playRewardSound() {
  // Create a simple reward sound using Web Audio API
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillators for a pleasant chime
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime + index * 0.1);
      oscillator.stop(audioContext.currentTime + 0.5 + index * 0.1);
    });
  } catch (error) {
    console.error('Failed to play reward sound:', error);
  }
}