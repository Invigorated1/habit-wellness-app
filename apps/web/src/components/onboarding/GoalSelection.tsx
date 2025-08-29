'use client';

import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding';
import { Goal } from '@/lib/archetype/types';
import { Button } from '@/components/ui/button';

interface GoalSelectionProps {
  onNext: () => void;
  onBack: () => void;
}

const GOAL_CATEGORIES = [
  {
    title: 'Mental Wellness',
    goals: [
      { id: Goal.CALM, label: 'Inner Calm', emoji: '🧘', description: 'Reduce stress and anxiety' },
      { id: Goal.FOCUS, label: 'Deep Focus', emoji: '🎯', description: 'Improve concentration' },
      { id: Goal.CLARITY, label: 'Mental Clarity', emoji: '💡', description: 'Clear thinking and decisions' },
      { id: Goal.CREATIVITY, label: 'Creativity', emoji: '🎨', description: 'Unlock creative potential' },
    ],
  },
  {
    title: 'Physical Wellness',
    goals: [
      { id: Goal.STRENGTH, label: 'Strength', emoji: '💪', description: 'Build physical power' },
      { id: Goal.FLEXIBILITY, label: 'Flexibility', emoji: '🤸', description: 'Improve range of motion' },
      { id: Goal.ENDURANCE, label: 'Endurance', emoji: '🏃', description: 'Increase stamina' },
      { id: Goal.BALANCE, label: 'Balance', emoji: '⚖️', description: 'Physical and mental equilibrium' },
    ],
  },
  {
    title: 'Emotional Wellness',
    goals: [
      { id: Goal.STRESS_RELIEF, label: 'Stress Relief', emoji: '😌', description: 'Manage daily pressures' },
      { id: Goal.EMOTIONAL_REGULATION, label: 'Emotional Balance', emoji: '🌊', description: 'Navigate emotions skillfully' },
      { id: Goal.CONFIDENCE, label: 'Confidence', emoji: '✨', description: 'Build self-assurance' },
    ],
  },
  {
    title: 'Spiritual & Purpose',
    goals: [
      { id: Goal.MINDFULNESS, label: 'Mindfulness', emoji: '🌸', description: 'Present moment awareness' },
      { id: Goal.CONNECTION, label: 'Connection', emoji: '🤝', description: 'Deeper relationships' },
      { id: Goal.PURPOSE, label: 'Purpose', emoji: '🎯', description: 'Find meaning and direction' },
    ],
  },
  {
    title: 'Behavioral',
    goals: [
      { id: Goal.DISCIPLINE, label: 'Discipline', emoji: '⚡', description: 'Consistent action' },
      { id: Goal.CONSISTENCY, label: 'Consistency', emoji: '🔄', description: 'Build lasting habits' },
      { id: Goal.PRODUCTIVITY, label: 'Productivity', emoji: '📈', description: 'Achieve more with less' },
    ],
  },
];

export function GoalSelection({ onNext, onBack }: GoalSelectionProps) {
  const { selectedGoals, goalPriorities, toggleGoal, setGoalPriority, completeStep } = useOnboardingStore();

  const handleNext = () => {
    if (selectedGoals.length >= 3) {
      completeStep('goals');
      onNext();
    }
  };

  const isGoalSelected = (goal: Goal) => selectedGoals.includes(goal);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-3">What are your wellness goals?</h2>
          <p className="text-gray-600">
            Select at least 3 goals that resonate with you. You can adjust priorities after selecting.
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Selected: {selectedGoals.length} goals
            </span>
            {selectedGoals.length < 3 && (
              <span className="text-sm text-orange-600">
                Select at least {3 - selectedGoals.length} more
              </span>
            )}
          </div>
        </div>

        {/* Goal Categories */}
        <div className="space-y-8">
          {GOAL_CATEGORIES.map((category) => (
            <div key={category.title}>
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                {category.title}
              </h3>
              <div className="grid gap-3">
                {category.goals.map((goal) => {
                  const selected = isGoalSelected(goal.id);
                  const priority = goalPriorities[goal.id] || 3;

                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.button
                        onClick={() => toggleGoal(goal.id)}
                        className={`
                          w-full p-4 rounded-lg border-2 transition-all duration-200
                          ${
                            selected
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 text-left">
                            <span className="text-2xl">{goal.emoji}</span>
                            <div>
                              <p className="font-medium">{goal.label}</p>
                              <p className="text-sm text-gray-600">{goal.description}</p>
                            </div>
                          </div>
                          {selected ? (
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGoalPriority(goal.id, star);
                                    }}
                                    className="p-1"
                                  >
                                    <svg
                                      className={`w-5 h-5 ${
                                        star <= priority
                                          ? 'text-yellow-500'
                                          : 'text-gray-300'
                                      }`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  </button>
                                ))}
                              </div>
                              <svg
                                className="w-6 h-6 text-indigo-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={selectedGoals.length < 3}
          >
            Continue
          </Button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-indigo-50 rounded-lg p-4">
        <p className="text-sm text-indigo-700">
          💡 <strong>Tip:</strong> Use the stars to set priority for each goal. 
          Higher priority goals will influence your daily practice schedule more strongly.
        </p>
      </div>
    </div>
  );
}