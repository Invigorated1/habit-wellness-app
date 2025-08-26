import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit, getStreakMessage } from '@habit-app/shared';
import * as Haptics from 'expo-haptics';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onToggle: () => void;
  onPress: () => void;
}

export function HabitCard({ habit, isCompleted, onToggle, onPress }: HabitCardProps) {
  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <TouchableOpacity 
          style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
          onPress={handleToggle}
        >
          {isCompleted && (
            <Ionicons name="checkmark" size={18} color="white" />
          )}
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={[styles.name, isCompleted && styles.nameCompleted]}>
            {habit.name}
          </Text>
          {habit.description && (
            <Text style={styles.description} numberOfLines={1}>
              {habit.description}
            </Text>
          )}
        </View>

        <View style={styles.stats}>
          <View style={styles.streak}>
            <Ionicons 
              name="flame" 
              size={16} 
              color={habit.streak > 0 ? '#f97316' : '#9ca3af'} 
            />
            <Text style={[styles.streakText, habit.streak > 0 && styles.streakTextActive]}>
              {habit.streak}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  nameCompleted: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
  },
  stats: {
    alignItems: 'flex-end',
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  streakTextActive: {
    color: '#f97316',
  },
});