'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding';
import { Button } from '@/components/ui/button';
import archetypeConfig from '@/lib/archetype/config.json';
import confetti from 'canvas-confetti';

interface ArchetypeRevealProps {
  onComplete: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function ArchetypeReveal({ onComplete }: ArchetypeRevealProps) {
  const { assignedHouse, assignedClass, confidence, rationale } = useOnboardingStore();
  const [revealed, setRevealed] = useState(false);

  const houseProfile = archetypeConfig.houses.find(h => h.house === assignedHouse);
  const classProfile = archetypeConfig.classes.find(c => c.class === assignedClass);

  useEffect(() => {
    // Trigger reveal animation after a short delay
    const timer = setTimeout(() => {
      setRevealed(true);
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#8b5cf6', '#ec4899'],
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!houseProfile) {
    return null;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center space-y-8 max-w-2xl mx-auto"
          >
            {/* Archetype Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-8xl"
            >
              {houseProfile.emoji}
            </motion.div>

            {/* House Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {houseProfile.name}
              </h1>
              {classProfile && (
                <p className="text-xl text-gray-600 mt-2">{classProfile.name} Path</p>
              )}
            </motion.div>

            {/* Lore */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <p className="text-lg text-gray-700 italic mb-4">
                "{houseProfile.lore}"
              </p>
              <div className="border-t pt-4">
                <p className="text-gray-600">{rationale}</p>
              </div>
            </motion.div>

            {/* Core Practices */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6"
            >
              <h3 className="font-semibold mb-3">Your Core Practices</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {houseProfile.practices.core.map(practice => (
                  <span
                    key={practice}
                    className="px-3 py-1 bg-white rounded-full text-sm text-gray-700"
                  >
                    {practice.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Confidence Score */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center justify-center space-x-4"
            >
              <span className="text-gray-600">Match Confidence:</span>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence * 100}%` }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                  />
                </div>
                <span className="ml-2 font-semibold">{Math.round(confidence * 100)}%</span>
              </div>
            </motion.div>

            {/* Community Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="grid grid-cols-3 gap-4 text-center"
            >
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-2xl font-bold text-indigo-600">1,247</p>
                <p className="text-sm text-gray-600">Fellow {houseProfile.name}s</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-2xl font-bold text-purple-600">89%</p>
                <p className="text-sm text-gray-600">Achieve Goals</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-2xl font-bold text-pink-600">4.8</p>
                <p className="text-sm text-gray-600">Satisfaction</p>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              <Button
                size="lg"
                onClick={onComplete}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                Begin Your Journey
              </Button>
              <p className="text-sm text-gray-600 mt-3">
                Your personalized practice schedule is ready
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}