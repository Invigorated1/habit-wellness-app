/**
 * Default task templates for HabitStory
 * These are the core practices for each archetype
 */

export const defaultTaskTemplates = [
  // ==================== MEDITATION ====================
  {
    key: 'vipassana_scan_30min',
    title: 'Vipassana Body Scan',
    description: 'Systematic observation of bodily sensations without judgment',
    instructions: 'Sit comfortably with eyes closed. Start at the top of your head and slowly scan down through your body, observing sensations without trying to change them. Notice temperature, pressure, tingling, or absence of sensation. When you reach your feet, scan back up to your head.',
    modality: 'MEDITATION',
    minDuration: 1800, // 30 minutes
    maxDuration: 3600, // 60 minutes
    difficulty: 3,
    houseTags: ['MONK', 'SAGE'],
    captureType: 'AUDIO',
    isCore: true
  },
  {
    key: 'vipassana_scan_20min',
    title: 'Short Vipassana Scan',
    description: 'Condensed body scan meditation',
    instructions: 'A shorter version of the body scan, moving through larger sections of the body. Perfect for busy mornings or when building your practice.',
    modality: 'MEDITATION',
    minDuration: 1200, // 20 minutes
    maxDuration: 1800,
    difficulty: 2,
    houseTags: ['MONK', 'WARRIOR_MONK'],
    captureType: 'AUDIO',
    isCore: true
  },
  {
    key: 'loving_kindness_20min',
    title: 'Loving Kindness Meditation',
    description: 'Cultivate compassion for self and others',
    instructions: 'Begin by directing loving wishes toward yourself. Then expand to loved ones, neutral people, difficult people, and all beings. Use phrases like "May you be happy, may you be peaceful, may you be free from suffering."',
    modality: 'MEDITATION',
    minDuration: 1200,
    maxDuration: 2400,
    difficulty: 2,
    houseTags: ['MONK', 'COUNCILOR'],
    captureType: 'AUDIO',
    isCore: false
  },

  // ==================== BREATHING ====================
  {
    key: 'breath_box_10min',
    title: 'Box Breathing',
    description: '4-4-4-4 breathing pattern for calm and focus',
    instructions: 'Inhale for 4 counts, hold for 4, exhale for 4, hold empty for 4. Repeat. This Navy SEAL technique quickly calms the nervous system.',
    modality: 'BREATH',
    minDuration: 600, // 10 minutes
    maxDuration: 900,
    difficulty: 1,
    houseTags: ['MONK', 'OPERATIVE', 'WARRIOR_MONK'],
    captureType: 'AUDIO',
    isCore: true
  },
  {
    key: 'breath_box_5min',
    title: 'Quick Box Breathing',
    description: 'Short box breathing session',
    instructions: 'A 5-minute box breathing session perfect for quick resets during the day.',
    modality: 'BREATH',
    minDuration: 300,
    maxDuration: 600,
    difficulty: 1,
    houseTags: ['ALL'],
    captureType: 'NONE',
    isCore: true
  },
  {
    key: 'power_breath_10min',
    title: 'Power Breathing',
    description: 'Energizing breath work for warriors',
    instructions: 'Rapid belly breathing followed by breath holds. 30 power breaths, exhale and hold, inhale and hold 15 seconds. Repeat 3 rounds.',
    modality: 'BREATH',
    minDuration: 600,
    maxDuration: 900,
    difficulty: 3,
    houseTags: ['WARRIOR_MONK', 'OPERATIVE'],
    captureType: 'VIDEO',
    isCore: false
  },

  // ==================== MOVEMENT ====================
  {
    key: 'mobility_flow_15min',
    title: 'Morning Mobility Flow',
    description: 'Full body movement to awaken and energize',
    instructions: 'Flow through: neck rolls, shoulder circles, cat-cow, hip circles, leg swings, and spinal waves. Move slowly and breathe deeply.',
    modality: 'MOBILITY',
    minDuration: 900, // 15 minutes
    maxDuration: 1200,
    difficulty: 2,
    houseTags: ['WARRIOR_MONK', 'ARTISAN'],
    captureType: 'POSE',
    isCore: true
  },
  {
    key: 'calisthenics_pyramid',
    title: 'Calisthenics Pyramid',
    description: 'Progressive bodyweight strength training',
    instructions: 'Pyramid up and down: 1 pushup, 2 squats, 3 lunges (each leg). Then 2 pushups, 4 squats, 6 lunges. Continue to 5 and back down.',
    modality: 'STRENGTH',
    minDuration: 900,
    maxDuration: 1800,
    difficulty: 3,
    houseTags: ['WARRIOR_MONK', 'OPERATIVE'],
    captureType: 'VIDEO',
    isCore: false
  },
  {
    key: 'stretch_restore_10min',
    title: 'Evening Restoration',
    description: 'Gentle stretching for recovery',
    instructions: 'Hold each stretch for 60 seconds: forward fold, figure-4 hip stretch, spinal twist, child\'s pose, legs up the wall.',
    modality: 'MOBILITY',
    minDuration: 600,
    maxDuration: 900,
    difficulty: 1,
    houseTags: ['ALL'],
    captureType: 'NONE',
    isCore: true
  },

  // ==================== VISUALIZATION ====================
  {
    key: 'strategic_visualization',
    title: 'Strategic Visualization',
    description: 'Mental rehearsal for leaders',
    instructions: 'Visualize tomorrow\'s key interactions and decisions. See yourself responding with wisdom and calm. Practice different scenarios.',
    modality: 'VISUALIZATION',
    minDuration: 600,
    maxDuration: 1200,
    difficulty: 2,
    houseTags: ['COUNCILOR', 'OPERATIVE'],
    captureType: 'AUDIO',
    isCore: false
  },
  {
    key: 'creative_flow_20min',
    title: 'Creative Visualization',
    description: 'Unlock creative potential through imagery',
    instructions: 'Journey through an imaginary landscape that represents your creative project. Let images, colors, and movements arise spontaneously.',
    modality: 'VISUALIZATION',
    minDuration: 1200,
    maxDuration: 1800,
    difficulty: 2,
    houseTags: ['ARTISAN', 'SAGE'],
    captureType: 'NONE',
    isCore: false
  },

  // ==================== REFLECTION ====================
  {
    key: 'reflection_journal_15min',
    title: 'Evening Reflection',
    description: 'Written exploration of the day\'s lessons',
    instructions: 'Write about: What went well today? What challenged me? What did I learn? What am I grateful for? What is my intention for tomorrow?',
    modality: 'JOURNAL',
    minDuration: 900,
    maxDuration: 1800,
    difficulty: 1,
    houseTags: ['SAGE', 'COUNCILOR'],
    captureType: 'NONE',
    isCore: true
  },
  {
    key: 'gratitude_reflection',
    title: 'Gratitude Practice',
    description: 'Cultivate appreciation and abundance mindset',
    instructions: 'List 10 things you\'re grateful for. Include small things. For 3 items, write why you\'re grateful in detail.',
    modality: 'JOURNAL',
    minDuration: 600,
    maxDuration: 900,
    difficulty: 1,
    houseTags: ['ALL'],
    captureType: 'NONE',
    isCore: true
  },

  // ==================== SPECIALTY PRACTICES ====================
  {
    key: 'tactical_meditation',
    title: 'Tactical Meditation',
    description: 'High-performance focus training',
    instructions: 'Alternate between narrow focus (counting breaths) and open awareness (noticing all sensations). Switch every 2 minutes.',
    modality: 'MEDITATION',
    minDuration: 900,
    maxDuration: 1200,
    difficulty: 3,
    houseTags: ['OPERATIVE'],
    captureType: 'AUDIO',
    isCore: false
  },
  {
    key: 'empathy_meditation',
    title: 'Empathic Attunement',
    description: 'Develop deeper connection with others',
    instructions: 'Bring to mind someone you\'ll interact with today. Imagine their perspective, feelings, and needs. Send them positive intentions.',
    modality: 'MEDITATION',
    minDuration: 600,
    maxDuration: 1200,
    difficulty: 2,
    houseTags: ['COUNCILOR'],
    captureType: 'NONE',
    isCore: false
  },
  {
    key: 'expressive_movement',
    title: 'Expressive Movement',
    description: 'Free-form movement meditation',
    instructions: 'Put on music and move however your body wants. No choreography, just authentic expression. Notice emotions that arise.',
    modality: 'MOBILITY',
    minDuration: 900,
    maxDuration: 1800,
    difficulty: 2,
    houseTags: ['ARTISAN'],
    captureType: 'VIDEO',
    isCore: false
  },
  {
    key: 'contemplation_walk',
    title: 'Walking Contemplation',
    description: 'Mindful walking with philosophical inquiry',
    instructions: 'Walk slowly while pondering a question or concept. Let insights arise naturally. Notice how movement affects thinking.',
    modality: 'REFLECTION',
    minDuration: 1200,
    maxDuration: 2400,
    difficulty: 2,
    houseTags: ['SAGE'],
    captureType: 'NONE',
    isCore: false
  }
];