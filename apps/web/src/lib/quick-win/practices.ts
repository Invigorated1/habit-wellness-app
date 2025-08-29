/**
 * Quick Win Practices - 2-minute intro experiences for each archetype
 */

export interface QuickWinPractice {
  id: string;
  house: string;
  title: string;
  description: string;
  duration: number; // seconds
  type: 'breath' | 'meditation' | 'movement' | 'visualization';
  instructions: string[];
  milestones: {
    time: number; // seconds
    message: string;
  }[];
  completionMessage: string;
  reward: {
    badge: string;
    xp: number;
  };
}

export const QUICK_WIN_PRACTICES: Record<string, QuickWinPractice> = {
  MONK: {
    id: 'monk_first_breath',
    house: 'MONK',
    title: 'Your First Mindful Breath',
    description: 'Experience the power of conscious breathing',
    duration: 120,
    type: 'breath',
    instructions: [
      'Find a comfortable seated position',
      'Close your eyes or soften your gaze',
      'Breathe naturally and observe',
      'Notice the sensation of air entering and leaving'
    ],
    milestones: [
      { time: 30, message: 'Settling into awareness...' },
      { time: 60, message: 'Notice the rhythm of your breath' },
      { time: 90, message: 'Almost there, stay present' },
      { time: 120, message: 'Complete! You did it!' }
    ],
    completionMessage: 'Welcome to the path of mindfulness, Monk.',
    reward: {
      badge: 'FIRST_BREATH',
      xp: 50
    }
  },
  
  WARRIOR_MONK: {
    id: 'warrior_monk_power_stance',
    house: 'WARRIOR_MONK',
    title: 'Warrior Stance Activation',
    description: 'Awaken your inner strength',
    duration: 120,
    type: 'movement',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Arms at your sides, shoulders back',
      'Take 5 deep power breaths',
      'Hold warrior stance for remaining time'
    ],
    milestones: [
      { time: 30, message: 'Feel your power building...' },
      { time: 60, message: 'Strength flows through you' },
      { time: 90, message: 'Unshakeable like a mountain' },
      { time: 120, message: 'Warrior awakened!' }
    ],
    completionMessage: 'Your warrior spirit is alive, Warrior-Monk.',
    reward: {
      badge: 'FIRST_STANCE',
      xp: 50
    }
  },
  
  SAGE: {
    id: 'sage_wisdom_reflection',
    house: 'SAGE',
    title: 'Wisdom Seed Contemplation',
    description: 'Plant your first seed of insight',
    duration: 120,
    type: 'meditation',
    instructions: [
      'Sit comfortably with journal nearby',
      'Consider: "What wisdom do I seek?"',
      'Let insights arise naturally',
      'Jot down one key thought at the end'
    ],
    milestones: [
      { time: 30, message: 'Opening to wisdom...' },
      { time: 60, message: 'Insights beginning to surface' },
      { time: 90, message: 'Clarity emerging' },
      { time: 120, message: 'Wisdom received!' }
    ],
    completionMessage: 'The journey of a thousand insights begins, Sage.',
    reward: {
      badge: 'FIRST_INSIGHT',
      xp: 50
    }
  },
  
  ARTISAN: {
    id: 'artisan_creative_vision',
    house: 'ARTISAN',
    title: 'Creative Vision Quest',
    description: 'Unlock your creative potential',
    duration: 120,
    type: 'visualization',
    instructions: [
      'Close your eyes and relax',
      'Visualize a blank canvas',
      'Let colors and shapes appear',
      'Watch your creation unfold'
    ],
    milestones: [
      { time: 30, message: 'Canvas awakening...' },
      { time: 60, message: 'Creativity flowing freely' },
      { time: 90, message: 'Masterpiece emerging' },
      { time: 120, message: 'Vision complete!' }
    ],
    completionMessage: 'Your creative journey has begun, Artisan.',
    reward: {
      badge: 'FIRST_VISION',
      xp: 50
    }
  },
  
  OPERATIVE: {
    id: 'operative_focus_drill',
    house: 'OPERATIVE',
    title: 'Laser Focus Activation',
    description: 'Sharpen your mental precision',
    duration: 120,
    type: 'breath',
    instructions: [
      'Sit upright, eyes focused ahead',
      'Breathe in for 4, hold for 4, out for 4',
      'Maintain unwavering focus',
      'Count each breath cycle'
    ],
    milestones: [
      { time: 30, message: 'Focus sharpening...' },
      { time: 60, message: 'Precision increasing' },
      { time: 90, message: 'Laser-like clarity' },
      { time: 120, message: 'Mission complete!' }
    ],
    completionMessage: 'Your focus is your weapon, Operative.',
    reward: {
      badge: 'FIRST_FOCUS',
      xp: 50
    }
  },
  
  COUNCILOR: {
    id: 'councilor_connection_practice',
    house: 'COUNCILOR',
    title: 'Heart Connection Practice',
    description: 'Open your heart to lead with wisdom',
    duration: 120,
    type: 'meditation',
    instructions: [
      'Place hand on heart',
      'Breathe into your heart center',
      'Send loving kindness to yourself',
      'Extend it to your future community'
    ],
    milestones: [
      { time: 30, message: 'Heart opening...' },
      { time: 60, message: 'Compassion flowing' },
      { time: 90, message: 'Connection deepening' },
      { time: 120, message: 'Heart awakened!' }
    ],
    completionMessage: 'Lead with your heart, Councilor.',
    reward: {
      badge: 'FIRST_CONNECTION',
      xp: 50
    }
  }
};

// Helper function to get practice by house
export function getQuickWinPractice(house: string): QuickWinPractice | null {
  return QUICK_WIN_PRACTICES[house.toUpperCase()] || null;
}