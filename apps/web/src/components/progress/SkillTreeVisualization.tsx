'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AsciiArt } from '@/components/AsciiArt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  SkillTree, 
  SkillNode, 
  UserProgress, 
  skillTreeSystem 
} from '@/lib/progress/skill-tree';
import { cn } from '@/lib/utils';
import { Lock, Star, Zap } from 'lucide-react';

interface SkillTreeVisualizationProps {
  userId: string;
  house: string;
}

export function SkillTreeVisualization({ userId, house }: SkillTreeVisualizationProps) {
  const [selectedTree, setSelectedTree] = useState<'core' | 'house'>('core');
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [trees, setTrees] = useState<{
    core: SkillTree;
    house: SkillTree;
    progress: UserProgress;
  } | null>(null);
  
  useEffect(() => {
    skillTreeSystem.getUserSkillTree(userId, house).then(setTrees);
  }, [userId, house]);
  
  if (!trees) {
    return <div className="animate-pulse">Loading skill tree...</div>;
  }
  
  const currentTree = selectedTree === 'core' ? trees.core : trees.house;
  const { progress } = trees;
  
  // Group nodes by tier
  const nodesByTier = currentTree.nodes.reduce((acc, node) => {
    if (!acc[node.tier]) acc[node.tier] = [];
    acc[node.tier].push(node);
    return acc;
  }, {} as Record<number, SkillNode[]>);
  
  const canUnlock = (node: SkillNode) => 
    skillTreeSystem.canUnlockNode(node, progress);
  
  const getNodeStatus = (node: SkillNode) => {
    if (node.unlocked) return 'unlocked';
    if (canUnlock(node)) return 'available';
    return 'locked';
  };
  
  const getNodeColor = (status: string) => {
    switch (status) {
      case 'unlocked': return 'text-[var(--accent)] border-[var(--accent)]';
      case 'available': return 'text-yellow-500 border-yellow-500 animate-pulse';
      case 'locked': return 'text-[var(--muted)] border-[var(--muted)]';
      default: return '';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Tree Selector */}
      <div className="flex gap-2">
        <Button
          variant={selectedTree === 'core' ? 'default' : 'outline'}
          onClick={() => setSelectedTree('core')}
        >
          Core Skills
        </Button>
        <Button
          variant={selectedTree === 'house' ? 'default' : 'outline'}
          onClick={() => setSelectedTree('house')}
        >
          {house} Path
        </Button>
      </div>
      
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[var(--accent)]">
                Level {progress.level}
              </p>
              <p className="text-xs text-[var(--muted)]">Current Level</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {progress.totalXP} XP
              </p>
              <p className="text-xs text-[var(--muted)]">Total Experience</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {progress.unlockedNodes.length}
              </p>
              <p className="text-xs text-[var(--muted)]">Skills Unlocked</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Skill Tree Visualization */}
      <div className="relative overflow-x-auto">
        <div className="min-w-[800px] p-8">
          {/* Render tiers from bottom to top */}
          {Object.entries(nodesByTier)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([tier, nodes]) => (
              <div key={tier} className="mb-12">
                {/* Tier Label */}
                <div className="text-center mb-6">
                  <span className="text-sm text-[var(--muted)] uppercase tracking-wide">
                    Tier {tier} - {getTierName(Number(tier))}
                  </span>
                </div>
                
                {/* Nodes in tier */}
                <div className="flex justify-center gap-8">
                  {nodes.map(node => {
                    const status = getNodeStatus(node);
                    const isSelected = selectedNode?.id === node.id;
                    
                    return (
                      <motion.div
                        key={node.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: Number(tier) * 0.1 }}
                      >
                        <button
                          onClick={() => setSelectedNode(node)}
                          className={cn(
                            'relative w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center transition-all',
                            getNodeColor(status),
                            isSelected && 'ring-4 ring-[var(--accent)] ring-opacity-50',
                            status === 'available' && 'hover:scale-110'
                          )}
                        >
                          {/* Node Icon */}
                          <span className="text-3xl mb-1">{node.icon}</span>
                          
                          {/* Node Name */}
                          <span className="text-xs font-medium text-center px-1">
                            {node.name}
                          </span>
                          
                          {/* Lock Icon for locked nodes */}
                          {status === 'locked' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                              <Lock className="w-6 h-6" />
                            </div>
                          )}
                          
                          {/* Progress Ring for unlocked nodes */}
                          {node.unlocked && node.progress < 100 && (
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                              <circle
                                cx="48"
                                cy="48"
                                r="46"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                                opacity="0.2"
                              />
                              <circle
                                cx="48"
                                cy="48"
                                r="46"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 46}`}
                                strokeDashoffset={`${2 * Math.PI * 46 * (1 - node.progress / 100)}`}
                                className="transition-all duration-500"
                              />
                            </svg>
                          )}
                          
                          {/* Completion Star */}
                          {node.progress === 100 && (
                            <Star className="absolute -top-2 -right-2 w-5 h-5 fill-yellow-500 text-yellow-500" />
                          )}
                        </button>
                        
                        {/* Connection Lines */}
                        {tier !== '0' && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full h-12 w-0.5 bg-[var(--border)]" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>
      
      {/* Selected Node Details */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selectedNode.icon}</span>
                  {selectedNode.name}
                </CardTitle>
                <CardDescription>{selectedNode.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Requirements */}
                <div>
                  <h4 className="font-semibold mb-2">Requirements</h4>
                  <ul className="space-y-1 text-sm">
                    <li className={cn(
                      'flex items-center gap-2',
                      progress.totalXP >= selectedNode.requiredXP
                        ? 'text-green-500'
                        : 'text-[var(--muted)]'
                    )}>
                      <Zap className="w-4 h-4" />
                      {selectedNode.requiredXP} XP
                    </li>
                    {selectedNode.prerequisites.map(prereq => {
                      const prereqNode = currentTree.nodes.find(n => n.id === prereq);
                      const isUnlocked = progress.unlockedNodes.includes(prereq);
                      return (
                        <li key={prereq} className={cn(
                          'flex items-center gap-2',
                          isUnlocked ? 'text-green-500' : 'text-[var(--muted)]'
                        )}>
                          {isUnlocked ? '✓' : '○'}
                          {prereqNode?.name || prereq}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                
                {/* Benefits */}
                <div>
                  <h4 className="font-semibold mb-2">Benefits</h4>
                  <ul className="space-y-1 text-sm">
                    {selectedNode.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[var(--accent)]">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Progress or Unlock Button */}
                {selectedNode.unlocked ? (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Mastery Progress</span>
                      <span>{selectedNode.progress}%</span>
                    </div>
                    <Progress value={selectedNode.progress} className="h-2" />
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    disabled={!canUnlock(selectedNode)}
                    onClick={() => {
                      skillTreeSystem.unlockNode(userId, selectedNode.id)
                        .then(() => {
                          // Refresh tree
                          skillTreeSystem.getUserSkillTree(userId, house).then(setTrees);
                        });
                    }}
                  >
                    {canUnlock(selectedNode) ? 'Unlock Skill' : 'Requirements Not Met'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Suggested Path */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Suggested Next Skills</CardTitle>
          <CardDescription>
            Based on your current progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {skillTreeSystem.getSuggestedPath(progress, house).map(node => (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className="w-full p-3 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{node.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium">{node.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {node.requiredXP - progress.totalXP} XP needed
                    </p>
                  </div>
                  <span className="text-yellow-500">
                    <Zap className="w-5 h-5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getTierName(tier: number): string {
  const names = ['Novice', 'Apprentice', 'Practitioner', 'Adept', 'Master'];
  return names[tier] || 'Unknown';
}