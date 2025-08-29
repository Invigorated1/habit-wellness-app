/**
 * HabitStory Archetype System Types
 */

// ==================== CORE TYPES ====================

export enum House {
  MONK = 'MONK',
  WARRIOR_MONK = 'WARRIOR_MONK',
  SAGE = 'SAGE',
  ARTISAN = 'ARTISAN',
  OPERATIVE = 'OPERATIVE',
  COUNCILOR = 'COUNCILOR',
}

export enum HouseClass {
  // Monk classes
  VIPASSANA_FIRST = 'VIPASSANA_FIRST',
  BREATH_FIRST = 'BREATH_FIRST',
  
  // Warrior-Monk classes
  MOBILITY_FOCUS = 'MOBILITY_FOCUS',
  POWER_FOCUS = 'POWER_FOCUS',
  
  // Sage classes
  REFLECTION_PATH = 'REFLECTION_PATH',
  STUDY_PATH = 'STUDY_PATH',
  
  // Artisan classes
  VISUAL_CREATIVE = 'VISUAL_CREATIVE',
  MOVEMENT_CREATIVE = 'MOVEMENT_CREATIVE',
  
  // Operative classes
  PRECISION_TRAINING = 'PRECISION_TRAINING',
  ENDURANCE_TRAINING = 'ENDURANCE_TRAINING',
  
  // Councilor classes
  STRATEGIC_MIND = 'STRATEGIC_MIND',
  EMPATHIC_LEADER = 'EMPATHIC_LEADER',
}

export enum Trait {
  // Big Five
  BIG5_OPENNESS = 'BIG5_OPENNESS',
  BIG5_CONSCIENTIOUSNESS = 'BIG5_CONSCIENTIOUSNESS',
  BIG5_EXTRAVERSION = 'BIG5_EXTRAVERSION',
  BIG5_AGREEABLENESS = 'BIG5_AGREEABLENESS',
  BIG5_NEUROTICISM = 'BIG5_NEUROTICISM',
  
  // HEXACO (optional)
  HEXACO_HONESTY = 'HEXACO_HONESTY',
  
  // Custom wellness traits
  WELLNESS_DISCIPLINE = 'WELLNESS_DISCIPLINE',
  WELLNESS_SPIRITUALITY = 'WELLNESS_SPIRITUALITY',
  WELLNESS_PHYSICALITY = 'WELLNESS_PHYSICALITY',
}

export enum Goal {
  // Mental
  CALM = 'CALM',
  FOCUS = 'FOCUS',
  CLARITY = 'CLARITY',
  CREATIVITY = 'CREATIVITY',
  
  // Physical
  STRENGTH = 'STRENGTH',
  FLEXIBILITY = 'FLEXIBILITY',
  ENDURANCE = 'ENDURANCE',
  BALANCE = 'BALANCE',
  
  // Emotional
  STRESS_RELIEF = 'STRESS_RELIEF',
  EMOTIONAL_REGULATION = 'EMOTIONAL_REGULATION',
  CONFIDENCE = 'CONFIDENCE',
  
  // Spiritual
  MINDFULNESS = 'MINDFULNESS',
  CONNECTION = 'CONNECTION',
  PURPOSE = 'PURPOSE',
  
  // Behavioral
  DISCIPLINE = 'DISCIPLINE',
  CONSISTENCY = 'CONSISTENCY',
  PRODUCTIVITY = 'PRODUCTIVITY',
}

// ==================== DATA STRUCTURES ====================

export interface TraitScore {
  trait: Trait;
  score: number; // 0.0 to 1.0
  confidence: number; // 0.0 to 1.0
  source: string; // questionnaire version
}

export interface UserGoal {
  goal: Goal;
  priority: number; // 1 to 5
}

export interface ArchetypeProfile {
  house: House;
  name: string;
  emoji: string;
  lore: string;
  shortDescription: string;
  traits: {
    primary: Trait[];
    secondary: Trait[];
  };
  goals: {
    primary: Goal[];
    secondary: Goal[];
  };
  practices: {
    core: string[]; // task template keys
    recommended: string[];
    advanced: string[];
  };
  schedule: {
    morning?: string[];
    midday?: string[];
    evening?: string[];
  };
}

export interface ClassProfile {
  class: HouseClass;
  house: House;
  name: string;
  description: string;
  focusAreas: string[];
  defaults: {
    morning?: string;
    midday?: string;
    evening?: string;
  };
}

// ==================== CLASSIFICATION TYPES ====================

export interface ClassificationInput {
  traitScores: TraitScore[];
  goals: UserGoal[];
  preferences?: {
    intensity?: 'low' | 'medium' | 'high';
    timeCommitment?: 'minimal' | 'moderate' | 'dedicated';
    socialPreference?: 'solo' | 'community' | 'mixed';
  };
}

export interface ClassificationRule {
  id: string;
  conditions: RuleCondition[];
  outcome: RuleOutcome;
  weight: number;
  priority: number;
}

export interface RuleCondition {
  type: 'trait' | 'goal' | 'preference';
  key: string;
  operator: 'gte' | 'lte' | 'eq' | 'contains';
  value: any;
}

export interface RuleOutcome {
  house: House;
  class?: HouseClass;
  confidenceBoost?: number;
}

export interface ClassificationResult {
  house: House;
  class: HouseClass;
  confidence: number; // 0.0 to 1.0
  rationale: string;
  alternativeHouses: Array<{
    house: House;
    confidence: number;
  }>;
  recommendedReassessment?: Date;
}

// ==================== TASK TYPES ====================

export enum TaskModality {
  MEDITATION = 'MEDITATION',
  BREATH = 'BREATH',
  MOBILITY = 'MOBILITY',
  STRENGTH = 'STRENGTH',
  VISUALIZATION = 'VISUALIZATION',
  JOURNAL = 'JOURNAL',
  REFLECTION = 'REFLECTION',
}

export interface TaskPersonalization {
  duration?: number;
  intensity?: 'gentle' | 'moderate' | 'intense';
  guidance?: 'minimal' | 'detailed' | 'step-by-step';
  music?: 'none' | 'ambient' | 'nature' | 'binaural';
  voice?: 'none' | 'male' | 'female' | 'neutral';
}

// ==================== CONFIG TYPES ====================

export interface ArchetypeConfig {
  houses: ArchetypeProfile[];
  classes: ClassProfile[];
  rules: ClassificationRule[];
  defaultSchedules: Record<House, any>;
  reassessmentIntervals: {
    initial: number; // days
    regular: number; // days
    maximum: number; // days
  };
}