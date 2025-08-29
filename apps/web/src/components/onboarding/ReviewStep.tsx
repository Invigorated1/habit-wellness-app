'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding';
import { Button } from '@/components/ui/button';
import { calculateTraitScores } from '@/lib/assessment/personality-questions';
import { archetypeClassifier } from '@/lib/archetype/classifier';
import { Goal } from '@/lib/archetype/types';

interface ReviewStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ReviewStep({ onNext, onBack }: ReviewStepProps) {
  const {
    personalityAnswers,
    selectedGoals,
    goalPriorities,
    morningWindow,
    middayWindow,
    eveningWindow,
    intensity,
    timeCommitment,
    socialPreference,
    setArchetypeResult,
    completeStep,
  } = useOnboardingStore();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleDiscover = async () => {
    setIsProcessing(true);

    try {
      // Calculate trait scores
      const traitScores = calculateTraitScores(personalityAnswers);

      // Prepare classification input
      const userGoals = selectedGoals.map(goal => ({
        goal,
        priority: goalPriorities[goal] || 3,
      }));

      const classificationInput = {
        traitScores,
        goals: userGoals,
        preferences: {
          intensity,
          timeCommitment,
          socialPreference,
        },
      };

      // Submit to API
      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          traitScores,
          goals: userGoals,
          preferences: {
            intensity,
            timeCommitment,
            socialPreference,
          },
          schedule: {
            timezone: useOnboardingStore.getState().timezone,
            morningWindow,
            middayWindow,
            eveningWindow,
            dndWindows: useOnboardingStore.getState().dndWindows,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit onboarding');
      }

      const result = await response.json();

      // Store result
      setArchetypeResult({
        house: result.data.house,
        class: result.data.class,
        confidence: result.data.confidence,
        rationale: result.data.rationale,
      });

      // Mark complete and proceed
      completeStep('review');
      
      // Small delay for effect
      setTimeout(() => {
        onNext();
      }, 500);
    } catch (error) {
      console.error('Classification error:', error);
      setIsProcessing(false);
    }
  };

  // Format time windows for display
  const formatWindow = (window: { start: string; end: string } | null) => {
    if (!window) return 'Not set';
    return `${window.start} - ${window.end}`;
  };

  // Get goal labels
  const getGoalLabel = (goal: Goal) => {
    return goal.toLowerCase().replace(/_/g, ' ');
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-3">Let's review your journey</h2>
          <p className="text-gray-600">
            We'll use this information to discover your unique wellness archetype.
          </p>
        </div>

        {/* Summary Sections */}
        <div className="space-y-6">
          {/* Personality Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gray-50 rounded-lg"
          >
            <h3 className="font-semibold mb-2 flex items-center">
              <span className="text-xl mr-2">🧠</span>
              Personality Profile
            </h3>
            <p className="text-sm text-gray-600">
              Completed {personalityAnswers.length} personality questions
            </p>
          </motion.div>

          {/* Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-gray-50 rounded-lg"
          >
            <h3 className="font-semibold mb-2 flex items-center">
              <span className="text-xl mr-2">🎯</span>
              Wellness Goals
            </h3>
            <div className="space-y-1">
              {selectedGoals.map(goal => (
                <div key={goal} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{getGoalLabel(goal)}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < (goalPriorities[goal] || 3)
                            ? 'text-yellow-500'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-gray-50 rounded-lg"
          >
            <h3 className="font-semibold mb-2 flex items-center">
              <span className="text-xl mr-2">📅</span>
              Practice Schedule
            </h3>
            <div className="space-y-1 text-sm">
              {morningWindow && (
                <div className="flex justify-between">
                  <span>Morning:</span>
                  <span className="text-gray-600">{formatWindow(morningWindow)}</span>
                </div>
              )}
              {middayWindow && (
                <div className="flex justify-between">
                  <span>Midday:</span>
                  <span className="text-gray-600">{formatWindow(middayWindow)}</span>
                </div>
              )}
              {eveningWindow && (
                <div className="flex justify-between">
                  <span>Evening:</span>
                  <span className="text-gray-600">{formatWindow(eveningWindow)}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-gray-50 rounded-lg"
          >
            <h3 className="font-semibold mb-2 flex items-center">
              <span className="text-xl mr-2">⚙️</span>
              Practice Style
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Intensity:</span>
                <span className="text-gray-600 capitalize">{intensity}</span>
              </div>
              <div className="flex justify-between">
                <span>Time commitment:</span>
                <span className="text-gray-600 capitalize">{timeCommitment}</span>
              </div>
              <div className="flex justify-between">
                <span>Social preference:</span>
                <span className="text-gray-600 capitalize">{socialPreference}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Ready to Discover */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg text-center"
        >
          <h3 className="text-xl font-semibold mb-2">Ready to discover your archetype?</h3>
          <p className="text-gray-600 mb-4">
            We'll analyze your unique profile to find your perfect wellness path.
          </p>
          <Button
            size="lg"
            onClick={handleDiscover}
            disabled={isProcessing}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Discovering...
              </>
            ) : (
              'Discover My Archetype'
            )}
          </Button>
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={onBack} disabled={isProcessing}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}