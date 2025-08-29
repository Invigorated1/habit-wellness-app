/**
 * Skill Tree System
 * Visual progression paths for each archetype
 */

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon: string; // ASCII icon
  tier: number; // 0-4 (novice to master)
  requiredXP: number;
  prerequisites: string[]; // IDs of required nodes
  benefits: string[];
  unlocked: boolean;
  progress: number; // 0-100
  house?: string; // House-specific nodes
}

export interface SkillTree {
  id: string;
  name: string;
  description: string;
  nodes: SkillNode[];
  connections: Array<{
    from: string;
    to: string;
    type: 'required' | 'optional';
  }>;
}

export interface UserProgress {
  userId: string;
  totalXP: number;
  level: number;
  unlockedNodes: string[];
  nodeProgress: Record<string, number>;
  currentPath: string[];
}

// Core skill trees available to all houses
export const CORE_SKILL_TREE: SkillTree = {
  id: 'core',
  name: 'Core Practices',
  description: 'Fundamental skills for all practitioners',
  nodes: [
    // Tier 0 - Novice
    {
      id: 'first_breath',
      name: 'First Breath',
      description: 'Master basic breathing techniques',
      icon: '◯',
      tier: 0,
      requiredXP: 0,
      prerequisites: [],
      benefits: ['Unlock breath practices', '+5% calm'],
      unlocked: true,
      progress: 100,
    },
    {
      id: 'daily_practice',
      name: 'Daily Practice',
      description: 'Establish consistent practice routine',
      icon: '☀',
      tier: 0,
      requiredXP: 50,
      prerequisites: [],
      benefits: ['Unlock scheduling', '+10% consistency'],
      unlocked: false,
      progress: 0,
    },
    
    // Tier 1 - Apprentice
    {
      id: 'mindful_movement',
      name: 'Mindful Movement',
      description: 'Integrate body and breath',
      icon: '🚶',
      tier: 1,
      requiredXP: 200,
      prerequisites: ['first_breath'],
      benefits: ['Unlock movement practices', '+15% flexibility'],
      unlocked: false,
      progress: 0,
    },
    {
      id: 'focus_foundation',
      name: 'Focus Foundation',
      description: 'Build concentration skills',
      icon: '👁',
      tier: 1,
      requiredXP: 250,
      prerequisites: ['daily_practice'],
      benefits: ['Unlock focus practices', '+20% mental clarity'],
      unlocked: false,
      progress: 0,
    },
    
    // Tier 2 - Practitioner
    {
      id: 'flow_state',
      name: 'Flow State',
      description: 'Access deep states of practice',
      icon: '≈',
      tier: 2,
      requiredXP: 500,
      prerequisites: ['mindful_movement', 'focus_foundation'],
      benefits: ['Unlock flow practices', '+25% performance'],
      unlocked: false,
      progress: 0,
    },
    {
      id: 'community_leader',
      name: 'Community Leader',
      description: 'Guide and inspire others',
      icon: '⚡',
      tier: 2,
      requiredXP: 600,
      prerequisites: ['daily_practice'],
      benefits: ['Become cohort champion', 'Mentor privileges'],
      unlocked: false,
      progress: 0,
    },
    
    // Tier 3 - Adept
    {
      id: 'inner_wisdom',
      name: 'Inner Wisdom',
      description: 'Deep insight and intuition',
      icon: '✦',
      tier: 3,
      requiredXP: 1000,
      prerequisites: ['flow_state'],
      benefits: ['Unlock wisdom practices', '+30% insight'],
      unlocked: false,
      progress: 0,
    },
    
    // Tier 4 - Master
    {
      id: 'transcendence',
      name: 'Transcendence',
      description: 'Beyond the ordinary',
      icon: '★',
      tier: 4,
      requiredXP: 2000,
      prerequisites: ['inner_wisdom'],
      benefits: ['Master status', 'Create custom practices'],
      unlocked: false,
      progress: 0,
    },
  ],
  connections: [
    { from: 'first_breath', to: 'mindful_movement', type: 'required' },
    { from: 'daily_practice', to: 'focus_foundation', type: 'required' },
    { from: 'daily_practice', to: 'community_leader', type: 'required' },
    { from: 'mindful_movement', to: 'flow_state', type: 'required' },
    { from: 'focus_foundation', to: 'flow_state', type: 'required' },
    { from: 'flow_state', to: 'inner_wisdom', type: 'required' },
    { from: 'inner_wisdom', to: 'transcendence', type: 'required' },
  ],
};

// House-specific skill trees
export const HOUSE_SKILL_TREES: Record<string, SkillTree> = {
  MONK: {
    id: 'monk',
    name: 'Path of Stillness',
    description: 'Monk-specific mastery',
    nodes: [
      {
        id: 'vipassana_master',
        name: 'Vipassana Master',
        description: 'Deep body scanning expertise',
        icon: '◉',
        tier: 2,
        requiredXP: 800,
        prerequisites: ['flow_state'],
        benefits: ['60-min sessions', 'Teach others'],
        unlocked: false,
        progress: 0,
        house: 'MONK',
      },
      {
        id: 'emptiness_realization',
        name: 'Emptiness Realization',
        description: 'Understanding of non-self',
        icon: '○',
        tier: 3,
        requiredXP: 1500,
        prerequisites: ['vipassana_master'],
        benefits: ['Ego dissolution', 'Peace mastery'],
        unlocked: false,
        progress: 0,
        house: 'MONK',
      },
    ],
    connections: [
      { from: 'flow_state', to: 'vipassana_master', type: 'required' },
      { from: 'vipassana_master', to: 'emptiness_realization', type: 'required' },
    ],
  },
  
  WARRIOR_MONK: {
    id: 'warrior_monk',
    name: 'Path of Strength',
    description: 'Warrior-Monk mastery',
    nodes: [
      {
        id: 'iron_body',
        name: 'Iron Body',
        description: 'Physical mastery and endurance',
        icon: '💪',
        tier: 2,
        requiredXP: 750,
        prerequisites: ['mindful_movement'],
        benefits: ['Advanced calisthenics', '+50% strength'],
        unlocked: false,
        progress: 0,
        house: 'WARRIOR_MONK',
      },
      {
        id: 'warrior_spirit',
        name: 'Warrior Spirit',
        description: 'Unbreakable will',
        icon: '⚔',
        tier: 3,
        requiredXP: 1400,
        prerequisites: ['iron_body', 'flow_state'],
        benefits: ['Mental fortitude', 'Lead warrior circles'],
        unlocked: false,
        progress: 0,
        house: 'WARRIOR_MONK',
      },
    ],
    connections: [
      { from: 'mindful_movement', to: 'iron_body', type: 'required' },
      { from: 'iron_body', to: 'warrior_spirit', type: 'required' },
      { from: 'flow_state', to: 'warrior_spirit', type: 'required' },
    ],
  },
};

export class SkillTreeSystem {
  /**
   * Get user's complete skill tree with progress
   */
  async getUserSkillTree(userId: string, house: string): Promise<{
    core: SkillTree;
    house: SkillTree;
    progress: UserProgress;
  }> {
    // Get user progress from database
    const progress = await this.getUserProgress(userId);
    
    // Merge core and house trees
    const coreTree = this.applyProgressToTree(CORE_SKILL_TREE, progress);
    const houseTree = this.applyProgressToTree(HOUSE_SKILL_TREES[house], progress);
    
    return { core: coreTree, house: houseTree, progress };
  }
  
  /**
   * Check if node can be unlocked
   */
  canUnlockNode(node: SkillNode, progress: UserProgress): boolean {
    // Check XP requirement
    if (progress.totalXP < node.requiredXP) return false;
    
    // Check prerequisites
    for (const prereq of node.prerequisites) {
      if (!progress.unlockedNodes.includes(prereq)) return false;
    }
    
    return true;
  }
  
  /**
   * Unlock a skill node
   */
  async unlockNode(userId: string, nodeId: string): Promise<boolean> {
    const progress = await this.getUserProgress(userId);
    const node = this.findNode(nodeId);
    
    if (!node || !this.canUnlockNode(node, progress)) {
      return false;
    }
    
    // Update progress
    progress.unlockedNodes.push(nodeId);
    progress.nodeProgress[nodeId] = 0;
    
    // Save to database
    await this.saveUserProgress(userId, progress);
    
    // Award benefits
    await this.awardNodeBenefits(userId, node);
    
    return true;
  }
  
  /**
   * Update node progress
   */
  async updateNodeProgress(
    userId: string, 
    nodeId: string, 
    progressDelta: number
  ): Promise<void> {
    const progress = await this.getUserProgress(userId);
    
    if (!progress.unlockedNodes.includes(nodeId)) return;
    
    progress.nodeProgress[nodeId] = Math.min(
      100,
      (progress.nodeProgress[nodeId] || 0) + progressDelta
    );
    
    await this.saveUserProgress(userId, progress);
  }
  
  /**
   * Calculate suggested next nodes
   */
  getSuggestedPath(progress: UserProgress, house: string): SkillNode[] {
    const allNodes = [
      ...CORE_SKILL_TREE.nodes,
      ...(HOUSE_SKILL_TREES[house]?.nodes || []),
    ];
    
    // Find unlockable nodes
    const unlockable = allNodes.filter(node => 
      !progress.unlockedNodes.includes(node.id) &&
      this.canUnlockNode(node, progress)
    );
    
    // Sort by tier and required XP
    unlockable.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return a.requiredXP - b.requiredXP;
    });
    
    return unlockable.slice(0, 3);
  }
  
  // Helper methods
  private async getUserProgress(userId: string): Promise<UserProgress> {
    // In real app, fetch from database
    return {
      userId,
      totalXP: 350,
      level: 5,
      unlockedNodes: ['first_breath', 'daily_practice'],
      nodeProgress: {
        first_breath: 100,
        daily_practice: 100,
        mindful_movement: 45,
      },
      currentPath: ['mindful_movement'],
    };
  }
  
  private async saveUserProgress(userId: string, progress: UserProgress): Promise<void> {
    // In real app, save to database
    console.log('Saving progress:', progress);
  }
  
  private applyProgressToTree(tree: SkillTree, progress: UserProgress): SkillTree {
    return {
      ...tree,
      nodes: tree.nodes.map(node => ({
        ...node,
        unlocked: progress.unlockedNodes.includes(node.id),
        progress: progress.nodeProgress[node.id] || 0,
      })),
    };
  }
  
  private findNode(nodeId: string): SkillNode | null {
    const allNodes = [
      ...CORE_SKILL_TREE.nodes,
      ...Object.values(HOUSE_SKILL_TREES).flatMap(tree => tree.nodes),
    ];
    
    return allNodes.find(node => node.id === nodeId) || null;
  }
  
  private async awardNodeBenefits(userId: string, node: SkillNode): Promise<void> {
    // Award benefits based on node
    console.log(`Awarding benefits for ${node.name}:`, node.benefits);
  }
}

export const skillTreeSystem = new SkillTreeSystem();