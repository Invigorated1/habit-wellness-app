'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AsciiArt } from '@/components/AsciiArt';
import { Button } from '@/components/ui/button';
import { VariableReward, RewardRarity } from '@/lib/rewards/variable-rewards';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

interface RewardRevealProps {
  reward: VariableReward;
  onClose: () => void;
}

export function RewardReveal({ reward, onClose }: RewardRevealProps) {
  const [revealed, setRevealed] = useState(false);
  
  useEffect(() => {
    // Trigger reveal animation
    const timer = setTimeout(() => {
      setRevealed(true);
      
      // Confetti based on rarity
      const particleCount = getRarityParticleCount(reward.rarity);
      const colors = getRarityColors(reward.rarity);
      
      confetti({
        particleCount,
        spread: 70,
        origin: { y: 0.6 },
        colors,
      });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [reward.rarity]);
  
  const getRarityParticleCount = (rarity: RewardRarity): number => {
    switch (rarity) {
      case RewardRarity.LEGENDARY: return 200;
      case RewardRarity.EPIC: return 150;
      case RewardRarity.RARE: return 100;
      case RewardRarity.UNCOMMON: return 75;
      default: return 50;
    }
  };
  
  const getRarityColors = (rarity: RewardRarity): string[] => {
    switch (rarity) {
      case RewardRarity.LEGENDARY: return ['#FFD700', '#FFA500', '#FF6347'];
      case RewardRarity.EPIC: return ['#9B59B6', '#8E44AD', '#E74C3C'];
      case RewardRarity.RARE: return ['#3498DB', '#2980B9', '#5DADE2'];
      case RewardRarity.UNCOMMON: return ['#27AE60', '#229954', '#52BE80'];
      default: return ['#95A5A6', '#7F8C8D', '#BDC3C7'];
    }
  };
  
  const getRarityClass = (rarity: RewardRarity): string => {
    switch (rarity) {
      case RewardRarity.LEGENDARY: return 'text-yellow-500';
      case RewardRarity.EPIC: return 'text-purple-500';
      case RewardRarity.RARE: return 'text-blue-500';
      case RewardRarity.UNCOMMON: return 'text-green-500';
      default: return 'text-gray-500';
    }
  };
  
  const getRarityLabel = (rarity: RewardRarity): string => {
    return rarity.charAt(0) + rarity.slice(1).toLowerCase();
  };
  
  return (
    <AnimatePresence>
      {revealed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-[var(--card)] border-2 border-[var(--border)] rounded-lg p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Rarity Badge */}
            <div className="flex justify-center mb-4">
              <span className={cn(
                'px-3 py-1 rounded-full text-xs font-bold uppercase',
                getRarityClass(reward.rarity)
              )}>
                {getRarityLabel(reward.rarity)} Reward!
              </span>
            </div>
            
            {/* ASCII Art */}
            {reward.asciiArt && (
              <div className="flex justify-center mb-6">
                <AsciiArt
                  ascii={reward.asciiArt}
                  variant="display"
                  className={getRarityClass(reward.rarity)}
                />
              </div>
            )}
            
            {/* Title */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-center mb-2"
            >
              {reward.title}
            </motion.h2>
            
            {/* Description */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[var(--muted)] text-center mb-6"
            >
              {reward.description}
            </motion.p>
            
            {/* Value Display */}
            {reward.value && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-[var(--bg)] rounded-lg p-4 mb-6"
              >
                {reward.type === 'BONUS_XP' && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[var(--accent)]">
                      +{reward.value.totalXP} XP
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      Base: {reward.value.baseXP} × {reward.value.multiplier}
                    </p>
                  </div>
                )}
                
                {reward.type === 'RARE_BADGE' && (
                  <div className="text-center">
                    <p className="text-lg font-medium">
                      Badge Unlocked: {reward.value.badge}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Close Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={onClose}
                className="w-full"
                variant={reward.rarity === RewardRarity.LEGENDARY ? 'default' : 'secondary'}
              >
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Reward notification toast
export function RewardToast({ rewards }: { rewards: VariableReward[] }) {
  const [visibleRewards, setVisibleRewards] = useState<VariableReward[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (rewards.length > 0 && currentIndex < rewards.length) {
      setVisibleRewards([rewards[currentIndex]]);
    }
  }, [rewards, currentIndex]);
  
  const handleClose = () => {
    if (currentIndex < rewards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setVisibleRewards([]);
    }
  };
  
  return (
    <>
      {visibleRewards.map(reward => (
        <RewardReveal
          key={reward.id}
          reward={reward}
          onClose={handleClose}
        />
      ))}
    </>
  );
}

// Mini reward indicator
export function RewardIndicator({ count }: { count: number }) {
  if (count === 0) return null;
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed bottom-4 right-4 bg-[var(--accent)] text-[var(--bg)] rounded-full p-3 shadow-lg"
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎁</span>
        <span className="font-bold">{count} rewards!</span>
      </div>
    </motion.div>
  );
}