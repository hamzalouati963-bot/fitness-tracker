import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { achievementRepo, workoutRepo, nutritionRepo, measurementRepo, dailyLogRepo, personalRecordRepo } from '../database/repositories';
import type { Achievement } from '../models';
import type { MoreScreenProps } from '../navigation/types';

interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'workout' | 'nutrition' | 'consistency' | 'measurement' | 'streak';
  check: () => Promise<boolean>;
}

const BADGES: BadgeDef[] = [
  { id: 'first_workout', name: 'First Step', icon: 'fitness-center', description: 'Complete your first workout', category: 'workout', check: async () => (await workoutRepo.getTotalWorkoutCount()) >= 1 },
  { id: 'ten_workouts', name: 'Getting Started', icon: 'fitness-center', description: 'Complete 10 workouts', category: 'workout', check: async () => (await workoutRepo.getTotalWorkoutCount()) >= 10 },
  { id: 'fifty_workouts', name: 'Dedicated', icon: 'fitness-center', description: 'Complete 50 workouts', category: 'workout', check: async () => (await workoutRepo.getTotalWorkoutCount()) >= 50 },
  { id: 'hundred_workouts', name: 'Centurion', icon: 'military-tech', description: 'Complete 100 workouts', category: 'workout', check: async () => (await workoutRepo.getTotalWorkoutCount()) >= 100 },
  { id: 'streak_3', name: 'Consistent', icon: 'local-fire-department', description: '3-day workout streak', category: 'streak', check: async () => (await workoutRepo.getCurrentStreak()) >= 3 },
  { id: 'streak_7', name: 'On Fire', icon: 'local-fire-department', description: '7-day workout streak', category: 'streak', check: async () => (await workoutRepo.getCurrentStreak()) >= 7 },
  { id: 'streak_30', name: 'Unstoppable', icon: 'local-fire-department', description: '30-day workout streak', category: 'streak', check: async () => (await workoutRepo.getCurrentStreak()) >= 30 },
  { id: 'first_pr', name: 'Record Breaker', icon: 'emoji-events', description: 'Set your first personal record', category: 'workout', check: async () => (await personalRecordRepo.getRecentPRs(1)).length > 0 },
  { id: 'volume_10000', name: 'Powerlifter', icon: 'fitness-center', description: 'Lift 10,000 kg total volume', category: 'workout', check: async () => (await workoutRepo.getTotalVolume()) >= 10000 },
  { id: 'volume_100000', name: 'Beast Mode', icon: 'fitness-center', description: 'Lift 100,000 kg total volume', category: 'workout', check: async () => (await workoutRepo.getTotalVolume()) >= 100000 },
  { id: 'first_measurement', name: 'Body Aware', icon: 'monitor-weight', description: 'Log your first body measurement', category: 'measurement', check: async () => (await measurementRepo.getMeasurements(1)).length > 0 },
  { id: 'consistent_tracker', name: 'Tracker', icon: 'edit-calendar', description: 'Log meals for 7 different days', category: 'nutrition', check: async () => (await nutritionRepo.getNutritionLogCount(30)) >= 7 },
  { id: 'hydration_master', name: 'Hydration Hero', icon: 'water-drop', description: 'Log hydration entries', category: 'nutrition', check: async () => { const { hydrationRepo } = await import('../database/repositories'); const entries = await hydrationRepo.getAllEntries(); return entries.length >= 10; } },
];

const CATEGORY_LABELS: Record<string, string> = {
  workout: 'WORKOUTS',
  streak: 'STREAKS',
  nutrition: 'NUTRITION',
  measurement: 'MEASUREMENTS',
  consistency: 'CONSISTENCY',
};

export default function AchievementsScreen({ navigation }: MoreScreenProps<'Achievements'>) {
  const [loading, setLoading] = useState(true);
  const [awarded, setAwarded] = useState<Achievement[]>([]);
  const [checking, setChecking] = useState(false);

  const checkAndAward = useCallback(async () => {
    setChecking(true);
    try {
      const userId = (await import('../utils/session')).sessionManager.getCurrentUserId();
      for (const badge of BADGES) {
        try {
          const earned = await badge.check();
          if (earned) {
            await achievementRepo.award({
              user_id: userId,
              badge_id: badge.id,
              badge_name: badge.name,
              badge_icon: badge.icon,
              badge_description: badge.description,
              category: badge.category,
              achieved_at: new Date().toISOString(),
            });
          }
        } catch (_e) { /* skip */ }
      }
    } catch (_e) { /* skip */ }
    setChecking(false);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await checkAndAward();
    const all = await achievementRepo.getAll();
    setAwarded(all);
    setLoading(false);
  }, [checkAndAward]);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isEarned = (badgeId: string) => awarded.some(a => a.badge_id === badgeId);

  const categories = ['workout', 'streak', 'nutrition', 'measurement'];

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>{awarded.length}</Text>
        <Text style={styles.summaryLabel}>of {BADGES.length} badges earned</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(awarded.length / BADGES.length) * 100}%` }]} />
        </View>
      </View>

      {categories.map((cat) => {
        const catBadges = BADGES.filter(b => b.category === cat);
        if (catBadges.length === 0) return null;
        return (
          <View key={cat} style={styles.section}>
            <Text style={styles.sectionTitle}>{CATEGORY_LABELS[cat]}</Text>
            {catBadges.map((badge) => {
              const earned = isEarned(badge.id);
              const award = awarded.find(a => a.badge_id === badge.id);
              return (
                <View key={badge.id} style={[styles.badgeCard, earned && styles.badgeEarned]}>
                  <View style={[styles.badgeIcon, earned ? styles.badgeIconEarned : styles.badgeIconLocked]}>
                    <Icon name={badge.icon as any} size={24} color={earned ? '#FFFFFF' : '#D1D5DB'} />
                  </View>
                  <View style={styles.badgeInfo}>
                    <Text style={[styles.badgeName, earned && styles.badgeNameEarned]}>{badge.name}</Text>
                    <Text style={styles.badgeDesc}>{badge.description}</Text>
                    {award && (
                      <Text style={styles.badgeDate}>Earned {formatDate(award.achieved_at)}</Text>
                    )}
                  </View>
                  {earned && <Icon name="check-circle" size={20} color="#10B981" />}
                </View>
              );
            })}
          </View>
        );
      })}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  summaryCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 24, borderRadius: 16, padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  summaryValue: { fontSize: 36, fontWeight: '800', color: '#F59E0B' },
  summaryLabel: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  progressBar: { width: '100%', height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 3 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 12 },
  badgeCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
  },
  badgeEarned: { borderWidth: 1, borderColor: '#FCD34D' },
  badgeIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  badgeIconEarned: { backgroundColor: '#F59E0B' },
  badgeIconLocked: { backgroundColor: '#F3F4F6' },
  badgeInfo: { flex: 1 },
  badgeName: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  badgeNameEarned: { color: '#1F2937' },
  badgeDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badgeDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  spacer: { height: 20 },
});
