import { analytics } from '../analytics/analytics-service';

// Experiment definitions
export const Experiments = {
  ONBOARDING_FLOW: {
    key: 'exp_onboarding_flow',
    name: 'Onboarding Flow Test',
    description: 'Test guided vs self-serve onboarding',
    variants: {
      control: 'self_serve',
      treatment: 'guided_tour',
    },
    metrics: ['activation_rate', 'first_habit_created_time'],
    allocation: 0.5, // 50% get the experiment
  },
  
  HABIT_TEMPLATES: {
    key: 'exp_habit_templates',
    name: 'Habit Templates',
    description: 'Show suggested habit templates',
    variants: {
      control: 'no_templates',
      treatment_a: 'basic_templates',
      treatment_b: 'ai_personalized',
    },
    metrics: ['habits_created', 'activation_rate', 'd7_retention'],
    allocation: 0.3,
  },
  
  GAMIFICATION: {
    key: 'exp_gamification',
    name: 'Gamification Elements',
    description: 'Test impact of badges and achievements',
    variants: {
      control: 'no_gamification',
      treatment: 'badges_enabled',
    },
    metrics: ['d7_retention', 'd30_retention', 'habits_completed'],
    allocation: 0.5,
  },
  
  NOTIFICATION_TIMING: {
    key: 'exp_notification_timing',
    name: 'Notification Timing',
    description: 'Optimize reminder notification timing',
    variants: {
      control: 'morning_9am',
      treatment_a: 'user_preferred',
      treatment_b: 'smart_timing',
    },
    metrics: ['notification_click_rate', 'habits_completed', 'churn_rate'],
    allocation: 0.4,
  },
} as const;

export type ExperimentKey = keyof typeof Experiments;
export type ExperimentVariant<K extends ExperimentKey> = keyof typeof Experiments[K]['variants'];

// Feature flags (non-experiment toggles)
export const FeatureFlags = {
  SOCIAL_SHARING: 'feature_social_sharing',
  ADVANCED_ANALYTICS: 'feature_advanced_analytics',
  HABIT_INSIGHTS: 'feature_habit_insights',
  TEAM_HABITS: 'feature_team_habits',
  DARK_MODE: 'feature_dark_mode',
  BETA_FEATURES: 'feature_beta_access',
} as const;

export type FeatureFlagKey = typeof FeatureFlags[keyof typeof FeatureFlags];

// Experiment service
class ExperimentService {
  private variantCache: Map<string, string> = new Map();
  
  getVariant<K extends ExperimentKey>(
    experimentKey: K
  ): ExperimentVariant<K> | null {
    const experiment = Experiments[experimentKey];
    
    // Check cache first
    const cached = this.variantCache.get(experiment.key);
    if (cached) {
      return cached as ExperimentVariant<K>;
    }
    
    // Get variant from analytics service
    const variant = analytics.getExperiment(experiment.key);
    
    if (variant && variant in experiment.variants) {
      this.variantCache.set(experiment.key, variant);
      
      // Track experiment exposure
      analytics.trackEvent('experiment.exposed', {
        experiment_key: experiment.key,
        experiment_name: experiment.name,
        variant,
        timestamp: new Date().toISOString(),
      });
      
      return variant as ExperimentVariant<K>;
    }
    
    // Return control if not in experiment
    return 'control' as ExperimentVariant<K>;
  }
  
  isInExperiment<K extends ExperimentKey>(experimentKey: K): boolean {
    const variant = this.getVariant(experimentKey);
    return variant !== null && variant !== 'control';
  }
  
  trackConversion(experimentKey: ExperimentKey, metric: string, value?: number) {
    const variant = this.variantCache.get(Experiments[experimentKey].key);
    
    if (variant) {
      analytics.trackEvent('experiment.conversion', {
        experiment_key: Experiments[experimentKey].key,
        experiment_name: Experiments[experimentKey].name,
        variant,
        metric,
        value,
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  // Feature flags
  isFeatureEnabled(flag: FeatureFlagKey): boolean {
    return analytics.isFeatureEnabled(flag);
  }
  
  getAllFeatureFlags(): Record<string, boolean> {
    const flags = analytics.getFeatureFlags();
    const result: Record<string, boolean> = {};
    
    // Filter to only our defined flags
    Object.values(FeatureFlags).forEach(flag => {
      result[flag] = flags[flag] === true;
    });
    
    return result;
  }
}

export const experiments = new ExperimentService();

// React hooks for experiments
import { useEffect, useState } from 'react';

export function useExperiment<K extends ExperimentKey>(
  experimentKey: K
): ExperimentVariant<K> | null {
  const [variant, setVariant] = useState<ExperimentVariant<K> | null>(null);
  
  useEffect(() => {
    const v = experiments.getVariant(experimentKey);
    setVariant(v);
  }, [experimentKey]);
  
  return variant;
}

export function useFeatureFlag(flag: FeatureFlagKey): boolean {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    setEnabled(experiments.isFeatureEnabled(flag));
  }, [flag]);
  
  return enabled;
}

// HOC for feature flags
export function withFeatureFlag<P extends object>(
  flag: FeatureFlagKey,
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureFlaggedComponent(props: P) {
    const enabled = useFeatureFlag(flag);
    
    if (enabled) {
      return <Component {...props} />;
    }
    
    if (FallbackComponent) {
      return <FallbackComponent {...props} />;
    }
    
    return null;
  };
}