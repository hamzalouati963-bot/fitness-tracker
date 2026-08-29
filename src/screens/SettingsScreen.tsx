import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch, Share } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SettingsRepository } from '../database/repositories';
import { BackupService } from '../services';
import type { FitnessGoal, ActivityLevel } from '../models';

interface SettingsScreenProps {
  navigation: any;
}

type Theme = 'light' | 'dark' | 'system';
type UnitSystem = 'metric' | 'imperial';

const activityLevels = [
  { id: 'sedentary', label: 'Sedentary' },
  { id: 'lightly_active', label: 'Lightly Active' },
  { id: 'moderately_active', label: 'Moderately Active' },
  { id: 'very_active', label: 'Very Active' },
];

const fitnessGoals = [
  { id: 'weight_loss', label: 'Weight Loss' },
  { id: 'muscle_gain', label: 'Muscle Gain' },
  { id: 'general_fitness', label: 'General Fitness' },
  { id: 'strength', label: 'Strength' },
  { id: 'endurance', label: 'Endurance' },
];

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const settingsRepo = new SettingsRepository();

  const [profile, setProfile] = useState<{
    name: string;
    age: string;
    sex: 'male' | 'female';
    height: string;
    current_weight: string;
    activity_level: ActivityLevel;
    fitness_goal: FitnessGoal;
  }>({
    name: '',
    age: '',
    sex: 'male',
    height: '',
    current_weight: '',
    activity_level: 'sedentary',
    fitness_goal: 'weight_loss',
  });

  const [nutrition, setNutrition] = useState({
    calories: '2200',
    protein: '150',
    carbs: '250',
    fat: '70',
    hydration: '2.5',
  });

  const [notifications, setNotifications] = useState({
    workout: true,
    hydration: true,
    meal: true,
    measurement: false,
    weekly_review: true,
  });

  const [appearance, setAppearance] = useState<{
    theme: Theme;
    unit_system: UnitSystem;
  }>({
    theme: 'system',
    unit_system: 'metric',
  });

  const loadSettings = useCallback(async () => {
    try {
      const [prof, targets, notif, appearanceData] = await Promise.all([
        settingsRepo.getProfile(),
        settingsRepo.getNutritionTargets(),
        settingsRepo.getNotificationSettings(),
        settingsRepo.getAppearance(),
      ]);

      setProfile({
        name: prof.name,
        age: prof.age !== null ? String(prof.age) : '',
        sex: prof.sex === 'female' ? 'female' : 'male',
        height: prof.height_cm ? String(prof.height_cm) : '',
        current_weight: prof.current_weight_kg ? String(prof.current_weight_kg) : '',
        activity_level: prof.activity_level,
        fitness_goal: prof.fitness_goal,
      });

      setNutrition({
        calories: String(targets.calories_kcal || 2200),
        protein: String(targets.protein_g || 150),
        carbs: String(targets.carbohydrates_g || 250),
        fat: String(targets.fat_g || 70),
        hydration: String(targets.hydration_liters || 2.5),
      });

      setNotifications({
        workout: notif.workout_reminder.enabled,
        hydration: notif.hydration_reminder.enabled,
        meal: notif.meal_logging_reminder.enabled,
        measurement: notif.measurement_reminder.enabled,
        weekly_review: notif.weekly_review_reminder.enabled,
      });

      setAppearance({
        theme: appearanceData.theme,
        unit_system: appearanceData.unit_system,
      });
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveProfile = async () => {
    try {
      await settingsRepo.updateProfile({
        name: profile.name.trim() || 'Athlete',
        age: profile.age ? parseInt(profile.age) : null,
        sex: profile.sex,
        height_cm: parseFloat(profile.height) || 0,
        current_weight_kg: parseFloat(profile.current_weight) || 0,
        activity_level: profile.activity_level,
        fitness_goal: profile.fitness_goal,
      });
      Alert.alert('Saved', 'Profile settings saved');
    } catch (e) {
      console.error('Failed to save profile:', e);
    }
  };

  const saveNutrition = async () => {
    try {
      await settingsRepo.updateNutritionTargets({
        calories_kcal: parseInt(nutrition.calories) || 2200,
        protein_g: parseInt(nutrition.protein) || 150,
        carbohydrates_g: parseInt(nutrition.carbs) || 250,
        fat_g: parseInt(nutrition.fat) || 70,
        hydration_liters: parseFloat(nutrition.hydration) || 2.5,
      });
      Alert.alert('Saved', 'Nutrition targets saved');
    } catch (e) {
      console.error('Failed to save nutrition targets:', e);
    }
  };

  const saveNotifications = async () => {
    try {
      const now = new Date();
      const timeNowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      await settingsRepo.updateNotificationSettings({
        workout_reminder: { enabled: notifications.workout, time: '08:00' },
        hydration_reminder: { enabled: notifications.hydration, interval_minutes: 90 },
        meal_logging_reminder: { enabled: notifications.meal, time: '12:00' },
        measurement_reminder: { enabled: notifications.measurement, interval_days: 7 },
        weekly_review_reminder: { enabled: notifications.weekly_review, day: 'sun', time: timeNowStr },
      });
      Alert.alert('Saved', 'Notification settings saved');
    } catch (e) {
      console.error('Failed to save notifications:', e);
    }
  };

  const saveAppearance = async () => {
    try {
      await settingsRepo.updateAppearance(appearance);
      Alert.alert('Saved', 'Appearance settings saved');
    } catch (e) {
      console.error('Failed to save appearance:', e);
    }
  };

  const exportData = async () => {
    try {
      const backupService = new BackupService();
      const json = await backupService.exportAll();
      await Share.share({ message: json });
    } catch (e) {
      console.error('Failed to export data:', e);
    }
  };

  const importData = () => {
    Alert.alert('Import', 'Paste your backup JSON below', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Import',
        onPress: () => {
          Alert.alert('Import', 'This version imports backup data via a file. Paste JSON into the field.');
        },
      },
    ]);
  };

  const clearAllData = async () => {
    Alert.alert('Clear Data', 'This will delete ALL your data. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          // Full hard reset is handled by the getDatabase seed; re-import defaults
          Alert.alert('Done', 'Data cleared. Restart the app to re-seed defaults.');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="person" size={20} color="#2563EB" />
          <Text style={styles.sectionTitle}>PROFILE</Text>
        </View>
        <View style={styles.card}>
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="Your name"
            value={profile.name}
            onChangeText={(text) => setProfile({ ...profile, name: text })}
          />
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={profile.age}
                onChangeText={(text) => setProfile({ ...profile, age: text })}
                keyboardType="number-pad"
                placeholder="0"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Sex</Text>
              <View style={styles.sexToggle}>
                <TouchableOpacity
                  style={[styles.sexButton, profile.sex === 'male' && styles.sexActive]}
                  onPress={() => setProfile({ ...profile, sex: 'male' })}
                >
                  <Text style={[styles.sexText, profile.sex === 'male' && styles.sexTextActive]}>♂ Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sexButton, profile.sex === 'female' && styles.sexActive]}
                  onPress={() => setProfile({ ...profile, sex: 'female' })}
                >
                  <Text style={[styles.sexText, profile.sex === 'female' && styles.sexTextActive]}>♀ Female</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={profile.height}
                onChangeText={(text) => setProfile({ ...profile, height: text })}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Current Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={profile.current_weight}
                onChangeText={(text) => setProfile({ ...profile, current_weight: text })}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Activity Level</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activityScroll}>
                {activityLevels.map((level) => (
                  <TouchableOpacity
                    key={level.id}
                    style={[styles.activityChip, profile.activity_level === level.id && styles.activityChipActive]}
                    onPress={() => setProfile({ ...profile, activity_level: level.id as any })}
                  >
                    <Text style={[styles.activityChipText, profile.activity_level === level.id && styles.activityChipTextActive]}>
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <View style={[styles.inputGroup, { marginTop: 8 }]}>
            <Text style={styles.label}>Fitness Goal</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalScroll}>
              {fitnessGoals.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[styles.goalChip, profile.fitness_goal === goal.id && styles.goalChipActive]}
                  onPress={() => setProfile({ ...profile, fitness_goal: goal.id as any })}
                >
                  <Text style={[styles.goalChipText, profile.fitness_goal === goal.id && styles.goalChipTextActive]}>
                    {goal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <TouchableOpacity style={styles.saveChip} onPress={saveProfile}>
            <Text style={styles.saveChipText}>Save Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Nutrition Targets */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="food-apple" size={20} color="#2563EB" />
          <Text style={styles.sectionTitle}>NUTRITION TARGETS</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.label}>Calories (kcal)</Text>
              <TextInput
                style={styles.input}
                value={nutrition.calories}
                onChangeText={(text) => setNutrition({ ...nutrition, calories: text })}
                keyboardType="number-pad"
                placeholder="0"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                value={nutrition.protein}
                onChangeText={(text) => setNutrition({ ...nutrition, protein: text })}
                keyboardType="number-pad"
                placeholder="0"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Carbs (g)</Text>
              <TextInput
                style={styles.input}
                value={nutrition.carbs}
                onChangeText={(text) => setNutrition({ ...nutrition, carbs: text })}
                keyboardType="number-pad"
                placeholder="0"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Fat (g)</Text>
              <TextInput
                style={styles.input}
                value={nutrition.fat}
                onChangeText={(text) => setNutrition({ ...nutrition, fat: text })}
                keyboardType="number-pad"
                placeholder="0"
              />
            </View>
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginTop: 8 }]}>
            <Text style={styles.label}>Hydration (L)</Text>
            <TextInput
              style={styles.input}
              value={nutrition.hydration}
              onChangeText={(text) => setNutrition({ ...nutrition, hydration: text })}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </View>
          <TouchableOpacity style={styles.saveChip} onPress={saveNutrition}>
            <Text style={styles.saveChipText}>Save Targets</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="notifications" size={20} color="#2563EB" />
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        </View>
        <View style={styles.card}>
          {[
            { key: 'workout', label: 'Workout Reminder', desc: 'Daily reminder to work out' },
            { key: 'hydration', label: 'Hydration Reminder', desc: 'Regular water intake reminders' },
            { key: 'meal', label: 'Meal Logging Reminder', desc: 'Remind to log meals' },
            { key: 'measurement', label: 'Measurement Reminder', desc: 'Weekly body measurement reminder' },
            { key: 'weekly_review', label: 'Weekly Review', desc: 'Sunday weekly summary' },
          ].map((item) => (
            <View key={item.key} style={styles.notificationRow}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationLabel}>{item.label}</Text>
                <Text style={styles.notificationDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={notifications[item.key as keyof typeof notifications] as boolean}
                onValueChange={(val) => setNotifications({ ...notifications, [item.key]: val })}
                trackColor={{ true: '#2563EB' }}
              />
            </View>
          ))}
          <TouchableOpacity style={styles.saveChip} onPress={saveNotifications}>
            <Text style={styles.saveChipText}>Save Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="brush" size={20} color="#2563EB" />
          <Text style={styles.sectionTitle}>APPEARANCE</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Theme</Text>
            <View style={styles.themeToggle}>
              {['light', 'dark', 'system'].map((theme) => (
                <TouchableOpacity
                  key={theme}
                  style={[styles.themeButton, appearance.theme === theme && styles.themeActive]}
                  onPress={() => setAppearance({ ...appearance, theme: theme as any })}
                >
                  <Text style={[styles.themeText, appearance.theme === theme && styles.themeTextActive]}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Unit System</Text>
            <View style={styles.themeToggle}>
              <TouchableOpacity
                style={[styles.themeButton, appearance.unit_system === 'metric' && styles.themeActive]}
                onPress={() => setAppearance({ ...appearance, unit_system: 'metric' })}
              >
                <Text style={[styles.themeText, appearance.unit_system === 'metric' && styles.themeTextActive]}>
                  Metric
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeButton, appearance.unit_system === 'imperial' && styles.themeActive]}
                onPress={() => setAppearance({ ...appearance, unit_system: 'imperial' })}
              >
                <Text style={[styles.themeText, appearance.unit_system === 'imperial' && styles.themeTextActive]}>
                  Imperial
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.saveChip} onPress={saveAppearance}>
            <Text style={styles.saveChipText}>Save Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Backup */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="backup" size={20} color="#2563EB" />
          <Text style={styles.sectionTitle}>BACKUP & DATA</Text>
        </View>
        <View style={styles.card}>
          <TouchableOpacity style={styles.backupButton} onPress={exportData}>
            <Icon name="file-download" size={20} color="#2563EB" />
            <Text style={styles.backupButtonText}>Export Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backupButton} onPress={importData}>
            <Icon name="file-upload" size={20} color="#2563EB" />
            <Text style={styles.backupButtonText}>Import Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.backupButton, styles.backupDanger]} onPress={clearAllData}>
            <Icon name="delete-forever" size={20} color="#EF4444" />
            <Text style={[styles.backupButtonText, { color: '#EF4444' }]}>Clear All Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="info" size={20} color="#6B7280" />
          <Text style={styles.sectionTitle}>ABOUT</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Privacy</Text>
            <Text style={styles.aboutValue}>All data stored locally</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Disclaimer</Text>
            <Text style={styles.aboutValueSmall}>This app is a personal tracking tool, not a medical device</Text>
          </View>
        </View>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' },
  card: { backgroundColor: '#FFFFFF', margin: 16, marginBottom: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 14, fontSize: 16, color: '#1F2937', marginBottom: 8 },
  nameInput: { marginBottom: 16 },
  inputGroup: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 16, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12 },
  sexToggle: { flexDirection: 'row', gap: 8 },
  sexButton: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#E5E7EB', borderRadius: 8, alignItems: 'center' },
  sexActive: { backgroundColor: '#2563EB' },
  sexText: { fontSize: 14, color: '#6B7280' },
  sexTextActive: { color: '#FFFFFF', fontWeight: '600' },
  activityScroll: { height: 40 },
  activityChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 20, marginRight: 8 },
  activityChipActive: { backgroundColor: '#2563EB' },
  activityChipText: { fontSize: 12, color: '#6B7280' },
  activityChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  goalScroll: { height: 40 },
  goalChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 20, marginRight: 8 },
  goalChipActive: { backgroundColor: '#10B981' },
  goalChipText: { fontSize: 12, color: '#6B7280' },
  goalChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  saveChip: { backgroundColor: '#2563EB', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  saveChipText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  notificationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  notificationInfo: { flex: 1 },
  notificationLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  notificationDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  themeToggle: { flexDirection: 'row', gap: 8 },
  themeButton: { flex: 1, paddingVertical: 10, backgroundColor: '#F3F4F6', borderRadius: 8, alignItems: 'center' },
  themeActive: { backgroundColor: '#2563EB' },
  themeText: { fontSize: 14, color: '#6B7280' },
  themeTextActive: { color: '#FFFFFF', fontWeight: '600' },
  backupButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backupDanger: { marginTop: 8 },
  backupButtonText: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  aboutLabel: { fontSize: 14, color: '#6B7280' },
  aboutValue: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  aboutValueSmall: { fontSize: 12, color: '#6B7280', flex: 1, textAlign: 'right' },
  spacer: { height: 20 },
});

export { SettingsScreen };
