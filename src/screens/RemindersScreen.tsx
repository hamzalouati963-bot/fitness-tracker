import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { MoreScreenProps } from '../navigation/types';
import { settingsRepo } from '../database/repositories';
import type { NotificationSettings } from '../models';
import { scheduleReminders, cancelAllReminders, requestNotificationPermissions } from '../utils/notifications';
import { useTheme } from '../context/ThemeContext';

export default function RemindersScreen({ navigation }: MoreScreenProps<'Reminders'>) {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<NotificationSettings>({
    workout_reminder: { enabled: true, time: '08:00' },
    hydration_reminder: { enabled: true, interval_minutes: 60 },
    meal_logging_reminder: { enabled: true, time: '12:00' },
    measurement_reminder: { enabled: false, interval_days: 7 },
    weekly_review_reminder: { enabled: true, day: 'sunday', time: '20:00' },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loaded = await settingsRepo.getNotificationSettings();
    setSettings(loaded);
  };

  const toggleReminder = async (key: keyof NotificationSettings, field: string, value: boolean) => {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
      return;
    }

    const updated = { ...settings };
    const section = { ...updated[key] } as any;
    section[field] = value;
    (updated as any)[key] = section;

    setSettings(updated);
    await settingsRepo.updateNotificationSettings({ [key]: section });
    await scheduleReminders();
  };

  const reminders = [
    {
      key: 'workout_reminder' as const,
      title: 'Workout Reminder',
      icon: 'fitness-center',
      color: '#DC2626',
      enabled: settings.workout_reminder.enabled,
      detail: `Daily at ${settings.workout_reminder.time}`,
    },
    {
      key: 'meal_logging_reminder' as const,
      title: 'Meal Reminder',
      icon: 'restaurant',
      color: '#CA8A04',
      enabled: settings.meal_logging_reminder.enabled,
      detail: `Daily at ${settings.meal_logging_reminder.time}`,
    },
    {
      key: 'hydration_reminder' as const,
      title: 'Hydration Reminder',
      icon: 'water',
      color: '#06B6D4',
      enabled: settings.hydration_reminder.enabled,
      detail: `Every ${settings.hydration_reminder.interval_minutes} minutes`,
    },
    {
      key: 'measurement_reminder' as const,
      title: 'Measurement Reminder',
      icon: 'measure',
      color: '#D97706',
      enabled: settings.measurement_reminder.enabled,
      detail: `Every ${settings.measurement_reminder.interval_days} days`,
    },
    {
      key: 'weekly_review_reminder' as const,
      title: 'Weekly Review',
      icon: 'assessment',
      color: '#7C3AED',
      enabled: settings.weekly_review_reminder.enabled,
      detail: `${settings.weekly_review_reminder.day} at ${settings.weekly_review_reminder.time}`,
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Reminders</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
        <Icon name="notifications-active" size={32} color="#2563EB" />
        <Text style={[styles.infoTitle, { color: colors.text }]}>Stay on Track</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Enable reminders to maintain your fitness routine. Notifications are sent locally on your device.
        </Text>
      </View>

      <View style={styles.remindersList}>
        {reminders.map((reminder) => (
          <View key={reminder.key} style={[styles.reminderCard, { backgroundColor: colors.card }]}>
            <View style={[styles.reminderIcon, { backgroundColor: reminder.color + '15' }]}>
              <Icon name={reminder.icon as any} size={24} color={reminder.color} />
            </View>
            <View style={styles.reminderInfo}>
              <Text style={[styles.reminderTitle, { color: colors.text }]}>{reminder.title}</Text>
              <Text style={[styles.reminderDetail, { color: colors.textSecondary }]}>{reminder.detail}</Text>
            </View>
            <Switch
              value={reminder.enabled}
              onValueChange={(value) => toggleReminder(reminder.key, 'enabled', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={reminder.enabled ? '#2563EB' : '#F3F4F6'}
            />
          </View>
        ))}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  infoCard: {
    marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  infoTitle: { fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  infoText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  remindersList: { paddingHorizontal: 16, gap: 8 },
  reminderCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  reminderIcon: {
    width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  reminderInfo: { flex: 1 },
  reminderTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  reminderDetail: { fontSize: 13 },
  bottomSpacer: { height: 20 },
});
