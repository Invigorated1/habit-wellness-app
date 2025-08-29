'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/stores/onboarding';
import { PersonalityAssessment } from '@/components/onboarding/PersonalityAssessment';
import { GoalSelection } from '@/components/onboarding/GoalSelection';
import { SchedulePreferences } from '@/components/onboarding/SchedulePreferences';
import { PreferencesStep } from '@/components/onboarding/PreferencesStep';
import { ReviewStep } from '@/components/onboarding/ReviewStep';
import { ArchetypeReveal } from '@/components/onboarding/ArchetypeReveal';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { motion, AnimatePresence } from 'framer-motion';

const ONBOARDING_STEPS = [
  { id: 'personality', title: 'Personality', component: PersonalityAssessment },
  { id: 'goals', title: 'Goals', component: GoalSelection },
  { id: 'schedule', title: 'Schedule', component: SchedulePreferences },
  { id: 'preferences', title: 'Preferences', component: PreferencesStep },
  { id: 'review', title: 'Review', component: ReviewStep },
  { id: 'reveal', title: 'Your Archetype', component: ArchetypeReveal },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { currentStep, setCurrentStep, assignedHouse } = useOnboardingStore();

  // Redirect if already completed
  useEffect(() => {
    if (assignedHouse && currentStep >= ONBOARDING_STEPS.length) {
      router.push('/dashboard');
    }
  }, [assignedHouse, currentStep, router]);

  const CurrentStepComponent = ONBOARDING_STEPS[currentStep]?.component;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  if (!CurrentStepComponent) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome to HabitStory
        </h1>
        <p className="text-lg text-gray-600">
          Let's discover your wellness archetype
        </p>
      </div>

      {/* Progress */}
      {currentStep < ONBOARDING_STEPS.length - 1 && (
        <OnboardingProgress 
          currentStep={currentStep} 
          totalSteps={ONBOARDING_STEPS.length - 1} 
          steps={ONBOARDING_STEPS.slice(0, -1)}
        />
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <CurrentStepComponent
            onNext={handleNext}
            onBack={handleBack}
            onComplete={handleComplete}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}