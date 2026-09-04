import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { customWorkoutRepo, workoutRepo } from '../database/repositories';
import { exercises as exercisesData, todayISO, timeNow } from '../services';
import type { CustomWorkout } from '../models';
import type { MoreScreenProps } from '../navigation/types';

interface WorkoutSummary {
  workout: CustomWorkout;
  exerciseCount: number;
  totalSets: number;
}

export default function CustomWorkoutsScreen({ navigation }: MoreScreenProps<'CustomWorkouts'>) {
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const all = await customWorkoutRepo.getAll();
      const summaries: WorkoutSummary[] = [];
      for (const w of all) {
        const exs = await customWorkoutRepo.getExercises(w.id!);
        const totalSets = exs.reduce((acc, e) => acc + e.sets, 0);
        summaries.push({ workout: w, exerciseCount: exs.length, totalSets });
      }
      setWorkouts(summaries);
    } catch (e) {
      console.error('Failed to load custom workouts:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const handleStart = async (summary: WorkoutSummary) => {
    const w = summary.workout;
    try {
      const exs = await customWorkoutRepo.getExercises(w.id!);

      const sessionId = await workoutRepo.createSession({
        date: todayISO(),
        start_time: timeNow(),
        end_time: null,
        duration_minutes: null,
        program_id: `custom_${w.id}`,
        program_name: w.name,
        notes: '',
      });

      for (let i = 0; i < exs.length; i++) {
        const e = exs[i];
        await workoutRepo.createExercise({
          session_id: sessionId,
          exercise_id: e.exercise_id,
          exercise_name: e.exercise_name,
          order_index: i,
          notes: e.notes,
        });
      }

      Alert.alert('Workout Started', w.name, [
        { text: "Let's Go", onPress: () => navigation.navigate('Workout', { sessionId }) },
      ]);
    } catch (e) {
      console.error('Failed to start custom workout:', e);
      Alert.alert('Error', 'Failed to start workout.');
    }
  };

  const handleDelete = (summary: WorkoutSummary) => {
    const w = summary.workout;
    Alert.alert('Delete Workout', `Delete "${w.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await customWorkoutRepo.delete(w.id!);
            loadData();
          } catch (e) {
            console.error('Failed to delete:', e);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Workouts</Text>
        <View style={{ width: 24 }} />
      </View>

      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => navigation.navigate('CreateCustomWorkout')}
      >
        <Icon name="add" size={22} color="#FFFFFF" />
        <Text style={styles.createBtnText}>Create a Workout</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator style={styles.loading} />
      ) : workouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="fitness-center" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No custom workouts</Text>
          <Text style={styles.emptySubtitle}>Create your first workout to get started</Text>
        </View>
      ) : (
        workouts.map((summary) => (
          <View key={summary.workout.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{summary.workout.name}</Text>
                {summary.workout.description ? (
                  <Text style={styles.cardDesc}>{summary.workout.description}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.cardStats}>
              <View style={styles.stat}>
                <Icon name="fitness-center" size={14} color="#6B7280" />
                <Text style={styles.statText}>{summary.exerciseCount} exercises</Text>
              </View>
              <View style={styles.stat}>
                <Icon name="repeat" size={14} color="#6B7280" />
                <Text style={styles.statText}>{summary.totalSets} sets</Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.startBtn} onPress={() => handleStart(summary)}>
                <Icon name="play-circle" size={18} color="#FFFFFF" />
                <Text style={styles.startBtnText}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('CreateCustomWorkout', { workoutId: summary.workout.id })}
              >
                <Icon name="edit" size={18} color="#2563EB" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(summary)}>
                <Icon name="delete-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    marginTop: 48,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  editBtnText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteBtn: {
    padding: 10,
    marginLeft: 'auto',
  },
  spacer: {
    height: 20,
  },
});
