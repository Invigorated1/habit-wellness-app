/**
 * HabitStory Archetype Classification Engine
 * 
 * This engine assigns users to archetypes based on personality traits and goals
 */

import { 
  House, 
  HouseClass, 
  ClassificationInput, 
  ClassificationResult,
  ClassificationRule,
  RuleCondition,
  ArchetypeConfig,
  TraitScore,
  UserGoal,
  Trait,
  Goal
} from './types';
import archetypeConfig from './config.json';
import { logger } from '@/lib/logger';

/**
 * Classifies users into archetypes based on personality traits and goals
 * Uses a rule-based system with confidence scoring
 */
export class ArchetypeClassifier {
  private config: ArchetypeConfig;

  /**
   * Creates a new ArchetypeClassifier instance
   * @param config - Optional custom configuration (defaults to built-in config)
   */
  constructor(config?: ArchetypeConfig) {
    this.config = config || (archetypeConfig as ArchetypeConfig);
  }

  /**
   * Classifies a user based on their traits and goals
   * @param input - User's trait scores and goals
   * @returns Classification result with house, class, and confidence score
   * @example
   * ```ts
   * const result = await classifier.classify({
   *   traitScores: { openness: 0.8, conscientiousness: 0.7, ... },
   *   goals: [Goal.CALM, Goal.FOCUS]
   * });
   * ```
   */
  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    logger.info('Starting archetype classification', {
      traits: input.traitScores.length,
      goals: input.goals.length
    });

    // Calculate scores for each house
    const houseScores = this.calculateHouseScores(input);
    
    // Sort by score
    const sortedHouses = Object.entries(houseScores)
      .sort(([, a], [, b]) => b.score - a.score);

    // Get the best match
    const [topHouse, topScore] = sortedHouses[0];
    
    // Determine class within house
    const assignedClass = this.determineClass(
      topHouse as House, 
      input
    );

    // Calculate confidence
    const confidence = this.calculateConfidence(
      topScore.score,
      sortedHouses
    );

    // Generate rationale
    const rationale = this.generateRationale(
      topHouse as House,
      assignedClass,
      input,
      topScore.matchedRules
    );

    // Get alternatives
    const alternativeHouses = sortedHouses.slice(1, 4).map(([house, score]) => ({
      house: house as House,
      confidence: this.normalizeScore(score.score)
    }));

    // Determine reassessment date
    const recommendedReassessment = this.calculateReassessmentDate(confidence);

    const result: ClassificationResult = {
      house: topHouse as House,
      class: assignedClass,
      confidence,
      rationale,
      alternativeHouses,
      recommendedReassessment
    };

    logger.info('Classification complete', {
      house: result.house,
      class: result.class,
      confidence: result.confidence
    });

    return result;
  }

  /**
   * Calculate scores for each house based on rules
   */
  private calculateHouseScores(input: ClassificationInput): Record<House, {
    score: number;
    matchedRules: ClassificationRule[];
  }> {
    const scores: Record<string, {
      score: number;
      matchedRules: ClassificationRule[];
    }> = {};

    // Initialize scores
    Object.values(House).forEach(house => {
      scores[house] = { score: 0, matchedRules: [] };
    });

    // Apply rules
    for (const rule of this.config.rules) {
      if (this.evaluateRule(rule, input)) {
        const house = rule.outcome.house;
        scores[house].score += rule.weight;
        scores[house].matchedRules.push(rule);
        
        // Apply confidence boost if specified
        if (rule.outcome.confidenceBoost) {
          scores[house].score += rule.outcome.confidenceBoost;
        }
      }
    }

    // Apply trait-based scoring
    this.applyTraitScoring(scores, input.traitScores);
    
    // Apply goal-based scoring
    this.applyGoalScoring(scores, input.goals);

    return scores as Record<House, {
      score: number;
      matchedRules: ClassificationRule[];
    }>;
  }

  /**
   * Evaluate if a rule matches the input
   */
  private evaluateRule(rule: ClassificationRule, input: ClassificationInput): boolean {
    return rule.conditions.every(condition => 
      this.evaluateCondition(condition, input)
    );
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: RuleCondition, input: ClassificationInput): boolean {
    switch (condition.type) {
      case 'trait': {
        const trait = input.traitScores.find(t => t.trait === condition.key);
        if (!trait) return false;
        
        switch (condition.operator) {
          case 'gte': return trait.score >= condition.value;
          case 'lte': return trait.score <= condition.value;
          case 'eq': return trait.score === condition.value;
          default: return false;
        }
      }
      
      case 'goal': {
        const hasGoal = input.goals.some(g => g.goal === condition.key);
        return condition.operator === 'contains' ? hasGoal : !hasGoal;
      }
      
      case 'preference': {
        if (!input.preferences) return false;
        const prefValue = input.preferences[condition.key as keyof typeof input.preferences];
        return prefValue === condition.value;
      }
      
      default:
        return false;
    }
  }

  /**
   * Apply additional scoring based on trait alignment
   */
  private applyTraitScoring(
    scores: Record<string, { score: number; matchedRules: ClassificationRule[] }>,
    traits: TraitScore[]
  ): void {
    for (const house of this.config.houses) {
      const houseScore = scores[house.house];
      
      // Primary traits
      for (const primaryTrait of house.traits.primary) {
        const traitScore = traits.find(t => t.trait === primaryTrait);
        if (traitScore) {
          houseScore.score += traitScore.score * 0.3;
        }
      }
      
      // Secondary traits
      for (const secondaryTrait of house.traits.secondary) {
        const traitScore = traits.find(t => t.trait === secondaryTrait);
        if (traitScore) {
          houseScore.score += traitScore.score * 0.15;
        }
      }
    }
  }

  /**
   * Apply additional scoring based on goal alignment
   */
  private applyGoalScoring(
    scores: Record<string, { score: number; matchedRules: ClassificationRule[] }>,
    goals: UserGoal[]
  ): void {
    for (const house of this.config.houses) {
      const houseScore = scores[house.house];
      
      // Primary goals
      for (const primaryGoal of house.goals.primary) {
        const userGoal = goals.find(g => g.goal === primaryGoal);
        if (userGoal) {
          houseScore.score += (0.25 * userGoal.priority) / 5;
        }
      }
      
      // Secondary goals
      for (const secondaryGoal of house.goals.secondary) {
        const userGoal = goals.find(g => g.goal === secondaryGoal);
        if (userGoal) {
          houseScore.score += (0.1 * userGoal.priority) / 5;
        }
      }
    }
  }

  /**
   * Determine the specific class within a house
   */
  private determineClass(house: House, input: ClassificationInput): HouseClass {
    // Find rules that match and specify a class
    const matchingRules = this.config.rules
      .filter(rule => 
        rule.outcome.house === house && 
        rule.outcome.class &&
        this.evaluateRule(rule, input)
      )
      .sort((a, b) => b.priority - a.priority);

    if (matchingRules.length > 0) {
      return matchingRules[0].outcome.class!;
    }

    // Default to first class for the house
    const houseClasses = this.config.classes.filter(c => c.house === house);
    return houseClasses[0]?.class as HouseClass || HouseClass.VIPASSANA_FIRST;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    topScore: number, 
    sortedHouses: Array<[string, { score: number; matchedRules: ClassificationRule[] }]>
  ): number {
    // Normalize the top score
    const normalizedTop = this.normalizeScore(topScore);
    
    // Calculate separation from next best
    const secondScore = sortedHouses[1]?.[1].score || 0;
    const separation = topScore - secondScore;
    const separationBonus = Math.min(separation * 0.1, 0.2);
    
    // Final confidence
    const confidence = Math.min(normalizedTop + separationBonus, 0.95);
    return Math.round(confidence * 100) / 100;
  }

  /**
   * Normalize score to 0-1 range
   */
  private normalizeScore(score: number): number {
    // Assuming max possible score is around 3.0
    return Math.min(score / 3.0, 1.0);
  }

  /**
   * Generate human-readable rationale
   */
  private generateRationale(
    house: House,
    assignedClass: HouseClass,
    input: ClassificationInput,
    matchedRules: ClassificationRule[]
  ): string {
    const houseProfile = this.config.houses.find(h => h.house === house);
    const classProfile = this.config.classes.find(c => c.class === assignedClass);
    
    if (!houseProfile) return 'Classification based on personality and goals.';

    const parts: string[] = [];
    
    // Trait-based reasoning
    const highTraits = input.traitScores
      .filter(t => t.score >= 0.7)
      .map(t => this.getTraitName(t.trait));
    
    if (highTraits.length > 0) {
      parts.push(`Your high ${highTraits.join(' and ')} align well with the ${houseProfile.name} path.`);
    }
    
    // Goal-based reasoning
    const primaryGoals = input.goals
      .filter(g => houseProfile.goals.primary.includes(g.goal as Goal))
      .map(g => this.getGoalName(g.goal as Goal));
    
    if (primaryGoals.length > 0) {
      parts.push(`Your goals of ${primaryGoals.join(' and ')} are central to this archetype.`);
    }
    
    // Class-specific reasoning
    if (classProfile) {
      parts.push(`The ${classProfile.name} specialization matches your preferences.`);
    }
    
    return parts.join(' ') || houseProfile.lore;
  }

  /**
   * Calculate when reassessment should occur
   */
  private calculateReassessmentDate(confidence: number): Date {
    const now = new Date();
    const intervals = this.config.reassessmentIntervals;
    
    let days: number;
    if (confidence < 0.6) {
      days = intervals.initial;
    } else if (confidence < 0.8) {
      days = intervals.regular;
    } else {
      days = intervals.maximum;
    }
    
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  /**
   * Get human-readable trait name
   */
  private getTraitName(trait: Trait): string {
    const traitNames: Record<Trait, string> = {
      [Trait.BIG5_OPENNESS]: 'openness',
      [Trait.BIG5_CONSCIENTIOUSNESS]: 'conscientiousness',
      [Trait.BIG5_EXTRAVERSION]: 'extraversion',
      [Trait.BIG5_AGREEABLENESS]: 'agreeableness',
      [Trait.BIG5_NEUROTICISM]: 'emotional stability',
      [Trait.HEXACO_HONESTY]: 'honesty',
      [Trait.WELLNESS_DISCIPLINE]: 'discipline',
      [Trait.WELLNESS_SPIRITUALITY]: 'spirituality',
      [Trait.WELLNESS_PHYSICALITY]: 'physicality',
    };
    return traitNames[trait] || trait.toLowerCase();
  }

  /**
   * Get human-readable goal name
   */
  private getGoalName(goal: Goal): string {
    return goal.toLowerCase().replace('_', ' ');
  }
}

// Export singleton instance
export const archetypeClassifier = new ArchetypeClassifier();