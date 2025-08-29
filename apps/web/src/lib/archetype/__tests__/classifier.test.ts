import { describe, it, expect } from 'vitest';
import { ArchetypeClassifier } from '../classifier';
import { Goal, TraitScores, ClassificationInput } from '../types';

describe('ArchetypeClassifier', () => {
  const classifier = new ArchetypeClassifier();

  describe('classify', () => {
    it('should classify a high-openness individual as SAGE', async () => {
      const input: ClassificationInput = {
        traitScores: {
          openness: 0.9,
          conscientiousness: 0.5,
          extraversion: 0.5,
          agreeableness: 0.5,
          neuroticism: 0.3,
        },
        goals: [Goal.WISDOM, Goal.CLARITY],
      };

      const result = await classifier.classify(input);
      
      expect(result.house).toBe('SAGE');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.traits).toHaveLength(3);
    });

    it('should classify a high-discipline individual as WARRIOR_MONK', async () => {
      const input: ClassificationInput = {
        traitScores: {
          openness: 0.5,
          conscientiousness: 0.9,
          extraversion: 0.5,
          agreeableness: 0.5,
          neuroticism: 0.2,
        },
        goals: [Goal.VITALITY, Goal.DISCIPLINE],
      };

      const result = await classifier.classify(input);
      
      expect(result.house).toBe('WARRIOR_MONK');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should classify with lower confidence for ambiguous profiles', async () => {
      const input: ClassificationInput = {
        traitScores: {
          openness: 0.5,
          conscientiousness: 0.5,
          extraversion: 0.5,
          agreeableness: 0.5,
          neuroticism: 0.5,
        },
        goals: [],
      };

      const result = await classifier.classify(input);
      
      expect(result.confidence).toBeLessThan(0.6);
      expect(result.house).toBeTruthy();
    });

    it('should include class assignment when confidence is high', async () => {
      const input: ClassificationInput = {
        traitScores: {
          openness: 0.8,
          conscientiousness: 0.7,
          extraversion: 0.6,
          agreeableness: 0.7,
          neuroticism: 0.3,
        },
        goals: [Goal.CONNECTION, Goal.CLARITY],
      };

      const result = await classifier.classify(input);
      
      if (result.confidence > 0.7) {
        expect(result.class).toBeTruthy();
        expect(result.subclass).toBeTruthy();
      }
    });

    it('should include rationale for classification', async () => {
      const input: ClassificationInput = {
        traitScores: {
          openness: 0.9,
          conscientiousness: 0.6,
          extraversion: 0.4,
          agreeableness: 0.6,
          neuroticism: 0.3,
        },
        goals: [Goal.WISDOM],
      };

      const result = await classifier.classify(input);
      
      expect(result.rationale).toBeTruthy();
      expect(result.rationale.length).toBeGreaterThan(10);
    });

    it('should handle edge case trait scores', async () => {
      const input: ClassificationInput = {
        traitScores: {
          openness: 1.0,
          conscientiousness: 0.0,
          extraversion: 1.0,
          agreeableness: 0.0,
          neuroticism: 1.0,
        },
        goals: [Goal.CALM],
      };

      const result = await classifier.classify(input);
      
      expect(result.house).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('trait calculation', () => {
    it('should identify top traits correctly', async () => {
      const input: ClassificationInput = {
        traitScores: {
          openness: 0.9,
          conscientiousness: 0.8,
          extraversion: 0.3,
          agreeableness: 0.4,
          neuroticism: 0.2,
        },
        goals: [Goal.WISDOM, Goal.DISCIPLINE],
      };

      const result = await classifier.classify(input);
      
      expect(result.traits).toContain('open');
      expect(result.traits).toContain('disciplined');
      expect(result.traits).not.toContain('anxious');
    });
  });
});