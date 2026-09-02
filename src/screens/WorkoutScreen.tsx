import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { workoutRepo, dailyLogRepo } from '../database/repositories';
import type { WorkoutExercise, WorkoutSet } from '../models';
import { timeNow, todayLocal } from '../services';

interface WorkoutScreenProps {
  navigation: any;
  route: any;
}

export default function WorkoutScreen({ navigation, route }: WorkoutScreenProps) {
  const sessionId = route.params?.sessionId as number | undefined;

  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [currentSet, setCurrentSet] = useState({ weight: '', reps: '' });
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [loading, setLoading] = useState(!!sessionId);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      setWorkoutExercises([]);
      setSets([]);
      setCurrentExerciseIndex(0);
      return;
    }
    setLoading(true);
    try {
      const exercises = await workoutRepo.getExercisesBySession(sessionId);
      setWorkoutExercises(exercises);
      setCurrentExerciseIndex(0);
      if (exercises.length > 0) {
        const exerciseSets = await workoutRepo.getSetsByExercise(exercises[0].id!);
        setSets(exerciseSets);
      } else {
        setSets([]);
      }
    } catch (e) {
      console.error('Failed to load workout:', e);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Reactiver au changement de params (ex: "Continue Workout" depuis le Dashboard
  // alors que l'onglet Workout etait deja monte sans session)
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSession();
    });
    return unsubscribe;
  }, [navigation, loadSession]);

  useEffect(() => {
    if (restTimer === null) return;
    timerRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setRestTimer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [restTimer]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startWorkout = () => {
    navigation.navigate('More', { screen: 'Programs' });
  };

  const changeExercise = async (newIndex: number) => {
    setCurrentExerciseIndex(newIndex);
    const next = workoutExercises[newIndex];
    if (next) {
      const exerciseSets = await workoutRepo.getSetsByExercise(next.id!);
      setSets(exerciseSets);
    } else {
      setSets([]);
    }
  };

  const addSet = async () => {
    if (!currentSet.weight || !currentSet.reps) {
      Alert.alert('Invalid Input', 'Please enter weight and reps');
      return;
    }

    const weight = parseFloat(currentSet.weight);
    const reps = parseInt(currentSet.reps);

    if (isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) {
      Alert.alert('Invalid Input', 'Weight and reps must be positive');
      return;
    }

    const exercise = workoutExercises[currentExerciseIndex];
    if (!exercise?.id) {
      Alert.alert('No Active Workout', 'Start a workout from the Programs screen first.');
      return;
    }

    try {
      await workoutRepo.createSet({
        exercise_id: exercise.id!,
        set_number: sets.length + 1,
        weight_kg: weight,
        reps,
        completed: true,
      });
      const updatedSets = await workoutRepo.getSetsByExercise(exercise.id!);
      setSets(updatedSets);
      setCurrentSet({ weight: '', reps: '' });
    } catch (e) {
      console.error('Failed to add set:', e);
      Alert.alert('Error', 'Impossible to save the set. Please try again.');
    }
  };

  const finishWorkout = async () => {
    if (!sessionId) return;
    try {
      const endTime = timeNow();
      // updateSession calcule automatiquement duration_minutes (start_time -> end_time)
      await workoutRepo.updateSession(sessionId, { end_time: endTime });

      // Marquer la seance comme completee dans le journal du jour (stats weekly)
      try {
        const logId = await dailyLogRepo.getOrCreateLog(todayLocal());
        await dailyLogRepo.updateLog(logId, { workout_completed: true });
      } catch (e) {
        console.error('Failed to mark daily log:', e);
        Alert.alert('Warning', 'Workout saved but daily log update failed. Your stats may be incomplete.');
      }

      Alert.alert('Workout Complete', 'Great job! Your workout has been saved.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home'),
        },
      ]);
    } catch (e) {
      console.error('Failed to finish workout:', e);
      Alert.alert('Error', 'Impossible to save the workout. Please try again.');
    }
  };

  const completeExercise = () => {
    const isLast = currentExerciseIndex >= workoutExercises.length - 1;
    const message = isLast
      ? `Completed ${sets.length} sets. This was the last exercise.`
      : `Completed ${sets.length} sets for ${workoutExercises[currentExerciseIndex]?.exercise_name}.`;
    Alert.alert('Exercise Complete', message, [
      ...(isLast ? [] : [{ text: 'Next Exercise', onPress: () => changeExercise(currentExerciseIndex + 1) }]),
      { text: isLast ? 'Finish Workout' : 'Finish Workout', onPress: finishWorkout },
    ]);
  };

  const startRestTimer = (duration: number) => {
    setRestTimer(duration);
    setTimerSeconds(duration);
  };

  const cancelRestTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestTimer(null);
    setTimerSeconds(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentExercise = workoutExercises[currentExerciseIndex];

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>Loading workout...</Text>
      </View>
    );
  }

  if (!currentExercise) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workout</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏋️</Text>
          <Text style={styles.emptyTitle}>No Active Workout</Text>
          <Text style={styles.emptySubtitle}>Pick a program to start a session and track your sets.</Text>
          <TouchableOpacity style={styles.startButton} onPress={startWorkout}>
            <Text style={styles.startButtonText}>Choose a Program</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.spacer} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Icon name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.exerciseNav}>
        {workoutExercises.map((ex, i) => (
          <TouchableOpacity
            key={ex.id}
            style={[styles.exercisePill, i === currentExerciseIndex && styles.exercisePillActive]}
            onPress={() => changeExercise(i)}
          >
            <Text style={[styles.exercisePillText, i === currentExerciseIndex && styles.exercisePillTextActive]}>
              {i + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{currentExercise.exercise_name}</Text>
        <Text style={styles.exerciseMuscle}>{currentExerciseIndex + 1} of {workoutExercises.length} exercises</Text>
      </View>

      {sets.length > 0 && (
        <View style={styles.setsSection}>
          <Text style={styles.sectionTitle}>LOGGED SETS</Text>
          {sets.map((set) => (
            <View key={set.id} style={styles.setCard}>
              <View style={styles.setHeader}>
                <Text style={styles.setLabel}>Set {set.set_number}</Text>
                <Text style={styles.setSuccess}>✓</Text>
              </View>
              <View style={styles.setDetails}>
                <Text style={styles.setMetric}>{set.weight_kg} kg</Text>
                <Text style={styles.setMetric}>{set.reps} reps</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.currentSetSection}>
        <Text style={styles.sectionTitle}>CURRENT SET</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={currentSet.weight}
              onChangeText={(text) => setCurrentSet({ ...currentSet, weight: text })}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reps</Text>
            <TextInput
              style={styles.input}
              value={currentSet.reps}
              onChangeText={(text) => setCurrentSet({ ...currentSet, reps: text })}
              keyboardType="number-pad"
              placeholder="0"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveSetButton} onPress={addSet}>
          <Text style={styles.saveSetButtonText}>Save Set</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.restTimerSection}>
        <Text style={styles.sectionTitle}>REST TIMER</Text>

        <View style={styles.timerButtons}>
          {[30, 60, 90, 120].map((seconds) => (
            <TouchableOpacity
              key={seconds}
              style={styles.timerButton}
              onPress={() => startRestTimer(seconds)}
            >
              <Text style={styles.timerButtonText}>{seconds}s</Text>
            </TouchableOpacity>
          ))}
        </View>

        {restTimer !== null && (
          <View style={styles.activeTimer}>
            <Text style={styles.activeTimerText}>{formatTime(timerSeconds)}</Text>
            <TouchableOpacity style={styles.cancelTimerButton} onPress={cancelRestTimer}>
              <Text style={styles.cancelTimerText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.completeButton} onPress={completeExercise}>
        <Text style={styles.completeButtonText}>Complete Exercise</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  centerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    marginTop: 48,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  exerciseNav: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  exercisePill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exercisePillActive: {
    backgroundColor: '#2563EB',
  },
  exercisePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  exercisePillTextActive: {
    color: '#FFFFFF',
  },
  exerciseHeader: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  exerciseMuscle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  setsSection: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    marginLeft: 4,
  },
  setCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  setLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  setSuccess: {
    fontSize: 16,
    color: '#10B981',
  },
  setDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  setMetric: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  currentSetSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  input: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  saveSetButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveSetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  restTimerSection: {
    marginTop: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  timerButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  timerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  activeTimer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
  },
  activeTimerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
  },
  cancelTimerButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelTimerText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  completeButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  spacer: {
    height: 20,
  },
});