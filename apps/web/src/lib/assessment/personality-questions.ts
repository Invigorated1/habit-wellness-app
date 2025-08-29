/**
 * Personality assessment questions based on Big Five traits
 * Using IPIP (International Personality Item Pool) inspired items
 */

import { Trait } from '@/lib/archetype/types';

export interface PersonalityQuestion {
  id: string;
  text: string;
  trait: Trait;
  reversed: boolean; // True if low scores indicate high trait
  category: string;
}

export const personalityQuestions: PersonalityQuestion[] = [
  // ==================== OPENNESS ====================
  {
    id: 'O1',
    text: 'I have a vivid imagination and often daydream',
    trait: Trait.BIG5_OPENNESS,
    reversed: false,
    category: 'Imagination'
  },
  {
    id: 'O2',
    text: 'I prefer routine over variety',
    trait: Trait.BIG5_OPENNESS,
    reversed: true,
    category: 'Variety'
  },
  {
    id: 'O3',
    text: 'I enjoy exploring new ideas and concepts',
    trait: Trait.BIG5_OPENNESS,
    reversed: false,
    category: 'Ideas'
  },
  {
    id: 'O4',
    text: 'I find philosophical discussions boring',
    trait: Trait.BIG5_OPENNESS,
    reversed: true,
    category: 'Philosophy'
  },
  
  // ==================== CONSCIENTIOUSNESS ====================
  {
    id: 'C1',
    text: 'I always complete tasks on time',
    trait: Trait.BIG5_CONSCIENTIOUSNESS,
    reversed: false,
    category: 'Reliability'
  },
  {
    id: 'C2',
    text: 'I often forget to put things back in their place',
    trait: Trait.BIG5_CONSCIENTIOUSNESS,
    reversed: true,
    category: 'Organization'
  },
  {
    id: 'C3',
    text: 'I set clear goals and work systematically toward them',
    trait: Trait.BIG5_CONSCIENTIOUSNESS,
    reversed: false,
    category: 'Goals'
  },
  {
    id: 'C4',
    text: 'I tend to be spontaneous rather than planning ahead',
    trait: Trait.BIG5_CONSCIENTIOUSNESS,
    reversed: true,
    category: 'Planning'
  },
  
  // ==================== EXTRAVERSION ====================
  {
    id: 'E1',
    text: 'I feel energized when I\'m around other people',
    trait: Trait.BIG5_EXTRAVERSION,
    reversed: false,
    category: 'Social Energy'
  },
  {
    id: 'E2',
    text: 'I prefer to work alone rather than in groups',
    trait: Trait.BIG5_EXTRAVERSION,
    reversed: true,
    category: 'Collaboration'
  },
  {
    id: 'E3',
    text: 'I enjoy being the center of attention',
    trait: Trait.BIG5_EXTRAVERSION,
    reversed: false,
    category: 'Attention'
  },
  {
    id: 'E4',
    text: 'Large social gatherings drain my energy',
    trait: Trait.BIG5_EXTRAVERSION,
    reversed: true,
    category: 'Gatherings'
  },
  
  // ==================== AGREEABLENESS ====================
  {
    id: 'A1',
    text: 'I often go out of my way to help others',
    trait: Trait.BIG5_AGREEABLENESS,
    reversed: false,
    category: 'Helping'
  },
  {
    id: 'A2',
    text: 'I find it hard to trust people',
    trait: Trait.BIG5_AGREEABLENESS,
    reversed: true,
    category: 'Trust'
  },
  {
    id: 'A3',
    text: 'I believe most people have good intentions',
    trait: Trait.BIG5_AGREEABLENESS,
    reversed: false,
    category: 'Belief'
  },
  {
    id: 'A4',
    text: 'I often criticize others\' choices',
    trait: Trait.BIG5_AGREEABLENESS,
    reversed: true,
    category: 'Criticism'
  },
  
  // ==================== NEUROTICISM (Emotional Stability) ====================
  {
    id: 'N1',
    text: 'I rarely feel anxious or stressed',
    trait: Trait.BIG5_NEUROTICISM,
    reversed: true, // Low neuroticism = high emotional stability
    category: 'Anxiety'
  },
  {
    id: 'N2',
    text: 'Small setbacks often upset me',
    trait: Trait.BIG5_NEUROTICISM,
    reversed: false,
    category: 'Resilience'
  },
  {
    id: 'N3',
    text: 'I remain calm under pressure',
    trait: Trait.BIG5_NEUROTICISM,
    reversed: true,
    category: 'Pressure'
  },
  {
    id: 'N4',
    text: 'My mood changes frequently',
    trait: Trait.BIG5_NEUROTICISM,
    reversed: false,
    category: 'Mood'
  },
  
  // ==================== WELLNESS TRAITS ====================
  {
    id: 'W1',
    text: 'Physical exercise is essential to my well-being',
    trait: Trait.WELLNESS_PHYSICALITY,
    reversed: false,
    category: 'Physicality'
  },
  {
    id: 'W2',
    text: 'I feel connected to something greater than myself',
    trait: Trait.WELLNESS_SPIRITUALITY,
    reversed: false,
    category: 'Spirituality'
  },
  {
    id: 'W3',
    text: 'I thrive on structure and routine',
    trait: Trait.WELLNESS_DISCIPLINE,
    reversed: false,
    category: 'Discipline'
  },
  {
    id: 'W4',
    text: 'I prefer flexibility over strict schedules',
    trait: Trait.WELLNESS_DISCIPLINE,
    reversed: true,
    category: 'Flexibility'
  }
];

// Response options for Likert scale
export const responseOptions = [
  { value: 1, label: 'Strongly Disagree', emoji: '😠' },
  { value: 2, label: 'Disagree', emoji: '🙁' },
  { value: 3, label: 'Neutral', emoji: '😐' },
  { value: 4, label: 'Agree', emoji: '🙂' },
  { value: 5, label: 'Strongly Agree', emoji: '😊' }
];

/**
 * Calculate trait scores from answers
 */
export function calculateTraitScores(answers: Array<{
  questionId: string;
  value: number;
  trait: Trait;
  reversed?: boolean;
}>) {
  const traitGroups = new Map<Trait, number[]>();
  
  // Group scores by trait
  answers.forEach(answer => {
    const question = personalityQuestions.find(q => q.id === answer.questionId);
    if (!question) return;
    
    // Reverse score if needed
    const score = question.reversed ? (6 - answer.value) : answer.value;
    
    if (!traitGroups.has(question.trait)) {
      traitGroups.set(question.trait, []);
    }
    traitGroups.get(question.trait)!.push(score);
  });
  
  // Calculate average for each trait
  const traitScores = Array.from(traitGroups.entries()).map(([trait, scores]) => {
    const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const normalized = (average - 1) / 4; // Convert 1-5 to 0-1
    
    return {
      trait,
      score: normalized,
      confidence: Math.min(scores.length / 4, 1), // Higher confidence with more questions
      source: 'onboarding-v1'
    };
  });
  
  return traitScores;
}