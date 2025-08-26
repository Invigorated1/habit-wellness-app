import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNotifications } from '../providers/NotificationProvider';
import { NotificationPreferences } from '@habit-app/shared';
import Constants from 'expo-constants';

export function NotificationSettingsScreen() {
  const { registerForPushNotifications } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    userId: '',
    habitReminders: true,
    reminderTime: '09:00',
    streakMilestones: true,
    achievements: true,
    weeklySummary: true,
    pushEnabled: true,
    emailEnabled: false,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch(
        `${Constants.expoConfig?.extra?.apiUrl}/api/notifications/preferences`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch(
        `${Constants.expoConfig?.extra?.apiUrl}/api/notifications/preferences`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preferences),
        }
      );

      if (response.ok) {
        Alert.alert('Success', 'Notification preferences saved');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      setPreferences(prev => ({
        ...prev,
        reminderTime: `${hours}:${minutes}`,
      }));
    }
  };

  const handleEnableNotifications = async () => {
    const token = await registerForPushNotifications();
    if (token) {
      setPreferences(prev => ({ ...prev, pushEnabled: true }));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const [hours, minutes] = preferences.reminderTime.split(':');
  const reminderDate = new Date();
  reminderDate.setHours(parseInt(hours, 10));
  reminderDate.setMinutes(parseInt(minutes, 10));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Push Notifications</Text>
        
        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Enable Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive push notifications for reminders and updates
            </Text>
          </View>
          <Switch
            value={preferences.pushEnabled}
            onValueChange={() => {
              if (!preferences.pushEnabled) {
                handleEnableNotifications();
              } else {
                handleToggle('pushEnabled');
              }
            }}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor={preferences.pushEnabled ? '#3b82f6' : '#f3f4f6'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        
        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Daily Reminders</Text>
            <Text style={styles.settingDescription}>
              Get reminded to complete your habits
            </Text>
          </View>
          <Switch
            value={preferences.habitReminders}
            onValueChange={() => handleToggle('habitReminders')}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor={preferences.habitReminders ? '#3b82f6' : '#f3f4f6'}
            disabled={!preferences.pushEnabled}
          />
        </View>

        {preferences.habitReminders && (
          <TouchableOpacity
            style={styles.timeSetting}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.settingTitle}>Reminder Time</Text>
            <Text style={styles.timeValue}>{preferences.reminderTime}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Streak Milestones</Text>
            <Text style={styles.settingDescription}>
              Celebrate when you reach streak milestones
            </Text>
          </View>
          <Switch
            value={preferences.streakMilestones}
            onValueChange={() => handleToggle('streakMilestones')}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor={preferences.streakMilestones ? '#3b82f6' : '#f3f4f6'}
            disabled={!preferences.pushEnabled}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Achievements</Text>
            <Text style={styles.settingDescription}>
              Get notified when you unlock achievements
            </Text>
          </View>
          <Switch
            value={preferences.achievements}
            onValueChange={() => handleToggle('achievements')}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor={preferences.achievements ? '#3b82f6' : '#f3f4f6'}
            disabled={!preferences.pushEnabled}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Weekly Summary</Text>
            <Text style={styles.settingDescription}>
              Receive a summary of your progress each week
            </Text>
          </View>
          <Switch
            value={preferences.weeklySummary}
            onValueChange={() => handleToggle('weeklySummary')}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor={preferences.weeklySummary ? '#3b82f6' : '#f3f4f6'}
            disabled={!preferences.pushEnabled}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={savePreferences}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        )}
      </TouchableOpacity>

      {showTimePicker && (
        <DateTimePicker
          value={reminderDate}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: 'white',
    marginVertical: 8,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  timeSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  timeValue: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});