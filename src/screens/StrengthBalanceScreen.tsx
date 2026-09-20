import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { workoutRepo } from '../database/repositories';
import type { MoreScreenProps } from '../navigation/types';
import exercisesData from '../data/exercises.json';

type MuscleGroup = {
  name: string;
  totalVolume: number;
  totalSets: number;
  totalSessions: number;
  lastWorked: string | null;
  icon: string;
};

const MUSCLE_GROUP_MAP: Record<string, string> = {
  'chest': 'Chest',
  'back': 'Back',
  'shoulders': 'Shoulders',
  'biceps': 'Arms',
  'triceps': 'Arms',
  'legs': 'Legs',
  'quadriceps': 'Legs',
  'hamstrings': 'Legs',
  'glutes': 'Legs',
  'calves': 'Legs',
  'abs': 'Core',
  'core': 'Core',
  'forearms': 'Arms',
  'traps': 'Back',
  'full_body': 'Full Body',
};

const MUSCLE_ICONS: Record<string, string> = {
  'Chest': 'fitness-center',
  'Back': 'fitness-center',
  'Shoulders': 'fitness-center',
  'Arms': 'fitness-center',
  'Legs': 'fitness-center',
  'Core': 'fitness-center',
  'Full Body': 'fitness-center',
};

export default function StrengthBalanceScreen({ navigation }: MoreScreenProps<'StrengthBalance'>) {
  const [loading, setLoading] = useState(true);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const sessions = await workoutRepo.getSessions(100);
      const groupMap = new Map<string, MuscleGroup>();

      for (const session of sessions) {
        if (!session.id) continue;
        const exercises = await workoutRepo.getExercisesBySession(session.id);
        for (const exercise of exercises) {
          const exerciseData = exercisesData.find((e: any) => e.id === exercise.exercise_id);
          const muscle = exerciseData?.muscle_group || 'other';
          const groupName = MUSCLE_GROUP_MAP[muscle] || 'Other';

          if (!groupMap.has(groupName)) {
            groupMap.set(groupName, {
              name: groupName,
              totalVolume: 0,
              totalSets: 0,
              totalSessions: 0,
              lastWorked: null,
              icon: MUSCLE_ICONS[groupName] || 'fitness-center',
            });
          }

          const group = groupMap.get(groupName)!;
          group.totalSessions++;

          const sets = await workoutRepo.getSetsByExercise(exercise.id!);
          group.totalSets += sets.length;
          for (const set of sets) {
            group.totalVolume += set.weight_kg * set.reps;
          }
          if (!group.lastWorked || session.date > group.lastWorked) {
            group.lastWorked = session.date;
          }
        }
      }

      const groups = Array.from(groupMap.values()).sort((a, b) => b.totalVolume - a.totalVolume);
      setMuscleGroups(groups);
    } catch (e) {
      console.error('Failed to load strength balance:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const maxVolume = Math.max(...muscleGroups.map(g => g.totalVolume), 1);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
        <Text style={styles.headerTitle}>Strength Balance</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.subtitle}>Muscle group volume from your workout history</Text>

      {muscleGroups.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="fitness-center" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptySubtitle}>Complete workouts to see your strength balance</Text>
        </View>
      ) : (
        <View style={styles.section}>
          {muscleGroups.map((group, i) => (
            <View key={group.name} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupRank}>
                  <Text style={styles.rankText}>{i + 1}</Text>
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupDetail}>
                    {group.totalSets} sets · {group.totalSessions} sessions · Last: {formatDate(group.lastWorked)}
                  </Text>
                </View>
                <Text style={styles.groupVolume}>{group.totalVolume >= 1000 ? `${(group.totalVolume / 1000).toFixed(1)}k` : group.totalVolume.toFixed(0)}</Text>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${(group.totalVolume / maxVolume) * 100}%` }]} />
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  subtitle: { fontSize: 14, color: '#6B7280', paddingHorizontal: 16, marginBottom: 20 },
  section: { paddingHorizontal: 16 },
  groupCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  groupRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  rankText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  groupDetail: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  groupVolume: { fontSize: 16, fontWeight: '700', color: '#2563EB' },
  barBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 3 },
  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
  spacer: { height: 20 },
});
