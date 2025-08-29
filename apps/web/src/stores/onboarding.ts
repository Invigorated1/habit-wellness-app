/**
 * Onboarding state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Trait, Goal } from '@/lib/archetype/types';

export interface PersonalityAnswer {
  questionId: string;
  value: number; // 1-5 scale
  trait: Trait;
  reversed?: boolean; // For reverse-scored items
}

export interface OnboardingState {
  // Progress tracking
  currentStep: number;
  completedSteps: string[];
  
  // Personality assessment
  personalityAnswers: PersonalityAnswer[];
  
  // Goals
  selectedGoals: Goal[];
  goalPriorities: Record<Goal, number>; // 1-5 priority
  
  // Schedule preferences
  timezone: string;
  morningWindow: { start: string; end: string } | null;
  middayWindow: { start: string; end: string } | null;
  eveningWindow: { start: string; end: string } | null;
  dndWindows: Array<{ start: string; end: string }>;
  
  // Preferences
  intensity: 'low' | 'medium' | 'high';
  timeCommitment: 'minimal' | 'moderate' | 'dedicated';
  socialPreference: 'solo' | 'community' | 'mixed';
  
  // Results
  assignedHouse?: string;
  assignedClass?: string;
  confidence?: number;
  rationale?: string;
  
  // Actions
  setCurrentStep: (step: number) => void;
  completeStep: (stepId: string) => void;
  
  // Personality
  addPersonalityAnswer: (answer: PersonalityAnswer) => void;
  clearPersonalityAnswers: () => void;
  
  // Goals
  toggleGoal: (goal: Goal) => void;
  setGoalPriority: (goal: Goal, priority: number) => void;
  
  // Schedule
  setTimezone: (timezone: string) => void;
  setMorningWindow: (window: { start: string; end: string } | null) => void;
  setMiddayWindow: (window: { start: string; end: string } | null) => void;
  setEveningWindow: (window: { start: string; end: string } | null) => void;
  addDndWindow: (window: { start: string; end: string }) => void;
  removeDndWindow: (index: number) => void;
  
  // Preferences
  setIntensity: (intensity: 'low' | 'medium' | 'high') => void;
  setTimeCommitment: (commitment: 'minimal' | 'moderate' | 'dedicated') => void;
  setSocialPreference: (pref: 'solo' | 'community' | 'mixed') => void;
  
  // Results
  setArchetypeResult: (result: {
    house: string;
    class: string;
    confidence: number;
    rationale: string;
  }) => void;
  
  // Utility
  reset: () => void;
  isStepComplete: (stepId: string) => boolean;
  getProgress: () => number;
}

const initialState = {
  currentStep: 0,
  completedSteps: [],
  personalityAnswers: [],
  selectedGoals: [],
  goalPriorities: {},
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  morningWindow: { start: '07:00', end: '09:00' },
  middayWindow: null,
  eveningWindow: { start: '18:00', end: '20:00' },
  dndWindows: [],
  intensity: 'medium' as const,
  timeCommitment: 'moderate' as const,
  socialPreference: 'mixed' as const,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Progress
      setCurrentStep: (step) => set({ currentStep: step }),
      completeStep: (stepId) => set((state) => ({
        completedSteps: [...new Set([...state.completedSteps, stepId])]
      })),
      
      // Personality
      addPersonalityAnswer: (answer) => set((state) => ({
        personalityAnswers: [
          ...state.personalityAnswers.filter(a => a.questionId !== answer.questionId),
          answer
        ]
      })),
      clearPersonalityAnswers: () => set({ personalityAnswers: [] }),
      
      // Goals
      toggleGoal: (goal) => set((state) => {
        const isSelected = state.selectedGoals.includes(goal);
        if (isSelected) {
          const { [goal]: _, ...newPriorities } = state.goalPriorities;
          return {
            selectedGoals: state.selectedGoals.filter(g => g !== goal),
            goalPriorities: newPriorities
          };
        } else {
          return {
            selectedGoals: [...state.selectedGoals, goal],
            goalPriorities: { ...state.goalPriorities, [goal]: 3 } // Default priority
          };
        }
      }),
      setGoalPriority: (goal, priority) => set((state) => ({
        goalPriorities: { ...state.goalPriorities, [goal]: priority }
      })),
      
      // Schedule
      setTimezone: (timezone) => set({ timezone }),
      setMorningWindow: (window) => set({ morningWindow: window }),
      setMiddayWindow: (window) => set({ middayWindow: window }),
      setEveningWindow: (window) => set({ eveningWindow: window }),
      addDndWindow: (window) => set((state) => ({
        dndWindows: [...state.dndWindows, window]
      })),
      removeDndWindow: (index) => set((state) => ({
        dndWindows: state.dndWindows.filter((_, i) => i !== index)
      })),
      
      // Preferences
      setIntensity: (intensity) => set({ intensity }),
      setTimeCommitment: (timeCommitment) => set({ timeCommitment }),
      setSocialPreference: (socialPreference) => set({ socialPreference }),
      
      // Results
      setArchetypeResult: (result) => set({
        assignedHouse: result.house,
        assignedClass: result.class,
        confidence: result.confidence,
        rationale: result.rationale
      }),
      
      // Utility
      reset: () => set(initialState),
      isStepComplete: (stepId) => get().completedSteps.includes(stepId),
      getProgress: () => {
        const state = get();
        const totalSteps = 5; // personality, goals, schedule, preferences, review
        const completed = state.completedSteps.length;
        return (completed / totalSteps) * 100;
      }
    }),
    {
      name: 'habitstory-onboarding',
      partialize: (state) => ({
        // Persist everything except current step
        completedSteps: state.completedSteps,
        personalityAnswers: state.personalityAnswers,
        selectedGoals: state.selectedGoals,
        goalPriorities: state.goalPriorities,
        timezone: state.timezone,
        morningWindow: state.morningWindow,
        middayWindow: state.middayWindow,
        eveningWindow: state.eveningWindow,
        dndWindows: state.dndWindows,
        intensity: state.intensity,
        timeCommitment: state.timeCommitment,
        socialPreference: state.socialPreference,
      })
    }
  )
);