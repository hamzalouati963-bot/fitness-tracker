import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { personalRecordRepo } from '../database/repositories';
import type { PersonalRecord } from '../models';
import type { MoreScreenProps } from '../navigation/types';

type ExercisePR = {
  exercise_id: string;
  exercise_name: string;
  max_weight: PersonalRecord | null;
  max_reps: PersonalRecord | null;
  max_volume: PersonalRecord | null;
  max_1rm: PersonalRecord | null;
};

export default function PersonalRecordsScreen({ navigation }: MoreScreenProps<'PersonalRecords'>) {
  const [loading, setLoading] = useState(true);
  const [exerciseRecords, setExerciseRecords] = useState<ExercisePR[]>([]);
  const [recentPRs, setRecentPRs] = useState<PersonalRecord[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const allRecords = await personalRecordRepo.getAllRecords();
      const recent = await personalRecordRepo.getRecentPRs(10);

      const byExercise = new Map<string, ExercisePR>();
      for (const rec of allRecords) {
        if (!byExercise.has(rec.exercise_id)) {
          byExercise.set(rec.exercise_id, {
            exercise_id: rec.exercise_id,
            exercise_name: rec.exercise_name,
            max_weight: null,
            max_reps: null,
            max_volume: null,
            max_1rm: null,
          });
        }
        const entry = byExercise.get(rec.exercise_id)!;
        if (rec.record_type === 'max_weight') entry.max_weight = rec;
        else if (rec.record_type === 'max_reps') entry.max_reps = rec;
        else if (rec.record_type === 'max_volume') entry.max_volume = rec;
        else if (rec.record_type === 'max_1rm') entry.max_1rm = rec;
      }

      setExerciseRecords(Array.from(byExercise.values()));
      setRecentPRs(recent);
    } catch (e) {
      console.error('Failed to load PRs:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
        <Text style={styles.headerTitle}>Personal Records</Text>
        <View style={{ width: 24 }} />
      </View>

      {recentPRs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT PRs</Text>
          {recentPRs.slice(0, 5).map((pr) => (
            <View key={pr.id} style={styles.recentCard}>
              <View style={styles.recentIcon}>
                <Icon name="emoji-events" size={20} color="#F59E0B" />
              </View>
              <View style={styles.recentInfo}>
                <Text style={styles.recentExercise}>{pr.exercise_name}</Text>
                <Text style={styles.recentDetail}>
                  {pr.record_type.replace('max_', '').replace('_', ' ').toUpperCase()}: {pr.value.toFixed(1)} {pr.unit}
                </Text>
              </View>
              <Text style={styles.recentDate}>{formatDate(pr.achieved_at)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ALL RECORDS</Text>
        {exerciseRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="emoji-events" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Records Yet</Text>
            <Text style={styles.emptySubtitle}>Complete workouts to start tracking your personal records</Text>
          </View>
        ) : (
          exerciseRecords.map((ex) => (
            <View key={ex.exercise_id} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{ex.exercise_name}</Text>
              <View style={styles.prRow}>
                {ex.max_weight && (
                  <View style={styles.prItem}>
                    <Text style={styles.prValue}>{ex.max_weight.value.toFixed(1)}</Text>
                    <Text style={styles.prLabel}>Max Weight (kg)</Text>
                  </View>
                )}
                {ex.max_reps && (
                  <View style={styles.prItem}>
                    <Text style={styles.prValue}>{ex.max_reps.value}</Text>
                    <Text style={styles.prLabel}>Max Reps</Text>
                  </View>
                )}
                {ex.max_volume && (
                  <View style={styles.prItem}>
                    <Text style={styles.prValue}>{ex.max_volume.value.toFixed(0)}</Text>
                    <Text style={styles.prLabel}>Max Volume</Text>
                  </View>
                )}
                {ex.max_1rm && (
                  <View style={styles.prItem}>
                    <Text style={styles.prValue}>{ex.max_1rm.value.toFixed(1)}</Text>
                    <Text style={styles.prLabel}>Est. 1RM</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 12 },
  recentCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
  },
  recentIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recentInfo: { flex: 1 },
  recentExercise: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  recentDetail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  recentDate: { fontSize: 11, color: '#9CA3AF' },
  exerciseCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  exerciseName: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  prRow: { flexDirection: 'row', justifyContent: 'space-between' },
  prItem: { alignItems: 'center', flex: 1 },
  prValue: { fontSize: 20, fontWeight: '700', color: '#2563EB' },
  prLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
  spacer: { height: 20 },
});
