'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useOnboardingStore } from '@/stores/onboarding';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SkillTreeVisualization } from '@/components/progress/SkillTreeVisualization';
import { JourneyMap } from '@/components/progress/JourneyMap';
import { Map, GitBranch } from 'lucide-react';

export default function ProgressPage() {
  const { userId } = useAuth();
  const { assignedHouse } = useOnboardingStore();
  const [view, setView] = useState<'journey' | 'skills'>('journey');
  
  if (!userId || !assignedHouse) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Track Your Progress</h1>
          <p className="text-[var(--muted)] mb-6">
            Complete onboarding to start tracking your journey
          </p>
          <Button onClick={() => window.location.href = '/onboarding'}>
            Begin Your Journey
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">Your Progress</h1>
        <p className="text-[var(--muted)]">
          Track your journey and unlock new skills
        </p>
      </motion.div>
      
      {/* View Switcher */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center gap-2 mb-8"
      >
        <Button
          variant={view === 'journey' ? 'default' : 'outline'}
          onClick={() => setView('journey')}
          className="flex items-center gap-2"
        >
          <Map className="w-4 h-4" />
          Journey Map
        </Button>
        <Button
          variant={view === 'skills' ? 'default' : 'outline'}
          onClick={() => setView('skills')}
          className="flex items-center gap-2"
        >
          <GitBranch className="w-4 h-4" />
          Skill Tree
        </Button>
      </motion.div>
      
      {/* Content */}
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {view === 'journey' ? (
          <JourneyMap userId={userId} />
        ) : (
          <SkillTreeVisualization userId={userId} house={assignedHouse} />
        )}
      </motion.div>
    </div>
  );
}