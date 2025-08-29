'use client';

import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding';
import { Button } from '@/components/ui/button';

interface PreferencesStepProps {
  onNext: () => void;
  onBack: () => void;
}

const INTENSITY_OPTIONS = [
  {
    value: 'low' as const,
    label: 'Gentle',
    emoji: '🌱',
    description: 'Easy-going pace, perfect for beginners',
  },
  {
    value: 'medium' as const,
    label: 'Moderate',
    emoji: '🌿',
    description: 'Balanced approach for steady progress',
  },
  {
    value: 'high' as const,
    label: 'Intense',
    emoji: '🔥',
    description: 'Challenging practices for rapid growth',
  },
];

const TIME_COMMITMENT_OPTIONS = [
  {
    value: 'minimal' as const,
    label: 'Minimal',
    emoji: '⏱️',
    description: '5-15 minutes per session',
  },
  {
    value: 'moderate' as const,
    label: 'Moderate',
    emoji: '⏰',
    description: '15-30 minutes per session',
  },
  {
    value: 'dedicated' as const,
    label: 'Dedicated',
    emoji: '📅',
    description: '30+ minutes per session',
  },
];

const SOCIAL_OPTIONS = [
  {
    value: 'solo' as const,
    label: 'Solo Journey',
    emoji: '🧘‍♀️',
    description: 'Focus on personal practice',
  },
  {
    value: 'community' as const,
    label: 'Community',
    emoji: '👥',
    description: 'Connect with others on similar paths',
  },
  {
    value: 'mixed' as const,
    label: 'Flexible',
    emoji: '🤝',
    description: 'Mix of solo and community',
  },
];

export function PreferencesStep({ onNext, onBack }: PreferencesStepProps) {
  const {
    intensity,
    timeCommitment,
    socialPreference,
    setIntensity,
    setTimeCommitment,
    setSocialPreference,
    completeStep,
  } = useOnboardingStore();

  const handleNext = () => {
    completeStep('preferences');
    onNext();
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-3">How do you like to practice?</h2>
          <p className="text-gray-600">
            Help us customize your experience to match your style.
          </p>
        </div>

        {/* Intensity Preference */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Practice Intensity</h3>
          <div className="grid gap-3">
            {INTENSITY_OPTIONS.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => setIntensity(option.value)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${
                    intensity === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{option.emoji}</span>
                  <div className="text-left">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  {intensity === option.value && (
                    <svg
                      className="w-6 h-6 text-indigo-500 ml-auto"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Time Commitment */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Time Commitment</h3>
          <div className="grid gap-3">
            {TIME_COMMITMENT_OPTIONS.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => setTimeCommitment(option.value)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${
                    timeCommitment === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{option.emoji}</span>
                  <div className="text-left">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  {timeCommitment === option.value && (
                    <svg
                      className="w-6 h-6 text-indigo-500 ml-auto"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Social Preference */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Social Preference</h3>
          <div className="grid gap-3">
            {SOCIAL_OPTIONS.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => setSocialPreference(option.value)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${
                    socialPreference === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{option.emoji}</span>
                  <div className="text-left">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  {socialPreference === option.value && (
                    <svg
                      className="w-6 h-6 text-indigo-500 ml-auto"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleNext}>
            Review & Discover
          </Button>
        </div>
      </div>
    </div>
  );
}