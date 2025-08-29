'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding';
import { personalityQuestions, responseOptions } from '@/lib/assessment/personality-questions';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface PersonalityAssessmentProps {
  onNext: () => void;
  onBack: () => void;
}

export function PersonalityAssessment({ onNext }: PersonalityAssessmentProps) {
  const { personalityAnswers, addPersonalityAnswer, completeStep } = useOnboardingStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  const currentQuestion = personalityQuestions[currentQuestionIndex];
  const totalQuestions = personalityQuestions.length;
  const questionProgress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Load existing answer if returning to question
  useEffect(() => {
    const existingAnswer = personalityAnswers.find(
      a => a.questionId === currentQuestion.id
    );
    setSelectedValue(existingAnswer?.value || null);
  }, [currentQuestionIndex, currentQuestion.id, personalityAnswers]);

  const handleAnswer = (value: number) => {
    setSelectedValue(value);
  };

  const handleNext = () => {
    if (selectedValue === null) return;

    // Save answer
    addPersonalityAnswer({
      questionId: currentQuestion.id,
      value: selectedValue,
      trait: currentQuestion.trait,
      reversed: currentQuestion.reversed,
    });

    // Move to next question or complete
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedValue(null);
    } else {
      completeStep('personality');
      onNext();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span>{Math.round(questionProgress)}%</span>
          </div>
          <Progress value={questionProgress} className="h-2" />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold mb-2">{currentQuestion.text}</h2>
            <p className="text-gray-600">
              This helps us understand your {currentQuestion.category.toLowerCase()} preferences.
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Response Options */}
        <div className="space-y-3">
          {responseOptions.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              className={`
                w-full p-4 rounded-lg border-2 transition-all duration-200
                flex items-center justify-between
                ${
                  selectedValue === option.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{option.emoji}</span>
                <span className="font-medium">{option.label}</span>
              </div>
              <div
                className={`
                  w-6 h-6 rounded-full border-2 transition-colors
                  ${
                    selectedValue === option.value
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-gray-300'
                  }
                `}
              >
                {selectedValue === option.value && (
                  <svg
                    className="w-full h-full text-white p-0.5"
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

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={selectedValue === null}
          >
            {currentQuestionIndex === totalQuestions - 1 ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-indigo-50 rounded-lg p-4">
        <p className="text-sm text-indigo-700">
          💡 <strong>Tip:</strong> Answer honestly based on how you typically feel and behave. 
          There are no right or wrong answers!
        </p>
      </div>
    </div>
  );
}