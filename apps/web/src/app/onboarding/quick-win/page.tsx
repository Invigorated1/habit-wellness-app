'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding';
import { getQuickWinPractice } from '@/lib/quick-win/practices';
import { Button } from '@/components/ui/button';
import { AsciiArt, AnimatedAsciiArt, AsciiProgress } from '@/components/AsciiArt';
import { getHouseAscii, BREATHING_ANIMATION, COMPLETION_BURST } from '@/ascii';
import confetti from 'canvas-confetti';

export default function QuickWinPage() {
  const router = useRouter();
  const { assignedHouse } = useOnboardingStore();
  const [isActive, setIsActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const practice = getQuickWinPractice(assignedHouse || 'MONK');
  
  if (!practice) {
    router.push('/dashboard');
    return null;
  }
  
  const progress = (timeElapsed / practice.duration) * 100;
  
  // Timer logic
  useEffect(() => {
    if (isActive && !isComplete) {
      intervalRef.current = setInterval(() => {
        setTimeElapsed((prev) => {
          const next = prev + 1;
          
          // Check for milestones
          const milestone = practice.milestones.find(m => m.time === next);
          if (milestone) {
            setCurrentMilestone(practice.milestones.indexOf(milestone));
          }
          
          // Check for completion
          if (next >= practice.duration) {
            setIsComplete(true);
            setIsActive(false);
            return practice.duration;
          }
          
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isComplete, practice]);
  
  // Completion celebration
  useEffect(() => {
    if (isComplete) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00ff66', '#ffffff', '#c28a24'],
      });
      
      // Save completion (in real app, would call API)
      setTimeout(() => {
        // Award badge and XP
        console.log('Awarded:', practice.reward);
      }, 1000);
    }
  }, [isComplete, practice]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleStart = () => {
    setIsActive(true);
  };
  
  const handleComplete = () => {
    router.push('/dashboard');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold mb-2">
            {isComplete ? 'Congratulations!' : practice.title}
          </h1>
          <p className="text-[var(--muted)]">
            {isComplete ? practice.completionMessage : practice.description}
          </p>
        </motion.div>
        
        {/* Main Content */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-8">
          <AnimatePresence mode="wait">
            {!isActive && !isComplete ? (
              // Pre-start state
              <motion.div
                key="pre-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-center">
                  <AsciiArt
                    ascii={getHouseAscii(assignedHouse || 'MONK')}
                    variant="display"
                  />
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Instructions:</h3>
                  <ol className="space-y-2">
                    {practice.instructions.map((instruction, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-[var(--accent)] mr-2">{i + 1}.</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-[var(--muted)] mb-4">
                    Duration: {formatTime(practice.duration)}
                  </p>
                  <Button size="lg" onClick={handleStart}>
                    Begin Practice
                  </Button>
                </div>
              </motion.div>
            ) : isComplete ? (
              // Completion state
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center"
              >
                <div className="flex justify-center">
                  <AsciiArt
                    ascii={COMPLETION_BURST}
                    variant="display"
                  />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-[var(--accent)]">
                    Practice Complete!
                  </h2>
                  <p className="text-lg">{practice.completionMessage}</p>
                </div>
                
                <div className="bg-[var(--bg)] p-4 rounded-lg border border-[var(--border)]">
                  <p className="font-semibold mb-2">Rewards Earned:</p>
                  <div className="space-y-1">
                    <p>🏆 {practice.reward.badge} Badge</p>
                    <p>✨ +{practice.reward.xp} XP</p>
                  </div>
                </div>
                
                <Button size="lg" onClick={handleComplete}>
                  Continue to Dashboard
                </Button>
              </motion.div>
            ) : (
              // Active practice state
              <motion.div
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Animation based on practice type */}
                <div className="flex justify-center">
                  {practice.type === 'breath' || practice.type === 'meditation' ? (
                    <AnimatedAsciiArt
                      frames={BREATHING_ANIMATION}
                      fps={0.5}
                      variant="display"
                    />
                  ) : (
                    <AsciiArt
                      ascii={getHouseAscii(assignedHouse || 'MONK')}
                      variant="display"
                      animate
                    />
                  )}
                </div>
                
                {/* Timer */}
                <div className="text-center space-y-2">
                  <div className="text-5xl font-mono font-bold">
                    {formatTime(timeElapsed)}
                  </div>
                  <AsciiProgress value={progress} width={20} />
                </div>
                
                {/* Current instruction/milestone */}
                <div className="text-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentMilestone}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-lg text-[var(--muted)]"
                    >
                      {practice.milestones[currentMilestone]?.message || 
                       practice.instructions[0]}
                    </motion.p>
                  </AnimatePresence>
                </div>
                
                {/* Pause button */}
                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setIsActive(false)}
                  >
                    Pause
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Skip option (only during practice) */}
        {isActive && !isComplete && (
          <div className="text-center">
            <button
              onClick={handleComplete}
              className="text-sm text-[var(--muted)] hover:text-[var(--text)]"
            >
              Skip for now →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}