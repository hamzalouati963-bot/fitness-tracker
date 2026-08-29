import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface WorkoutScreenProps {
  navigation: any;
  route: any;
}

export default function WorkoutScreen({ navigation, route }: WorkoutScreenProps) {
  const sessionId = route.params?.sessionId;
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sets, setSets] = useState<any[]>([]);
  const [currentSet, setCurrentSet] = useState({ weight: '', reps: '' });
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const exercises = [
    { id: 'bench_press', name: 'Barbell Bench Press', muscle: 'Chest' },
    { id: 'lat_pulldown', name: 'Lat Pulldown', muscle: 'Back' },
    { id: 'overhead_press', name: 'Overhead Press', muscle: 'Shoulders' },
    { id: 'squat', name: 'Barbell Squat', muscle: 'Legs' },
  ];

  const startWorkout = () => {
    navigation.navigate('Programs');
  };

  const addSet = () => {
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

    const newSet = {
      id: Date.now(),
      set_number: sets.length + 1,
      weight_kg: weight,
      reps,
      completed: true,
      rpe: null,
    };

    setSets([...sets, newSet]);
    setCurrentSet({ weight: '', reps: '' });
  };

  const completeExercise = () => {
    Alert.alert('Exercise Complete', `Completed ${sets.length} sets`, [
      { text: 'Next Exercise', onPress: () => {} },
      { text: 'Finish Workout', onPress: () => {} },
    ]);
  };

  const startRestTimer = (duration: number) => {
    setRestTimer(duration);
    setTimerSeconds(duration);
  };

  const cancelRestTimer = () => {
    setRestTimer(null);
    setTimerSeconds(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentExercise = exercises[currentExerciseIndex];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` }]} />
      </View>

      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{currentExercise.name}</Text>
        <Text style={styles.exerciseMuscle}>{currentExercise.muscle}</Text>
      </View>

      {sets.length > 0 && (
        <View style={styles.lastSetsCard}>
          <Text style={styles.lastSetsTitle}>Last Sets</Text>
          {sets.slice(-3).map((set, i) => (
            <View key={set.id} style={styles.setRow}>
              <Text style={styles.setNumber}>Set {set.set_number}</Text>
              <Text style={styles.setDetails}>
                {set.weight_kg} kg × {set.reps}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.setsSection}>
        <Text style={styles.sectionTitle}>SETS</Text>

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

        <TouchableOpacity style={styles.addSetButton} onPress={addSet}>
          <Icon name="add" size={20} color="#2563EB" />
          <Text style={styles.addSetText}>Add Set</Text>
        </TouchableOpacity>
      </View>

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
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
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
  lastSetsCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  lastSetsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  setNumber: {
    fontSize: 14,
    color: '#6B7280',
  },
  setDetails: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
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
  addSetButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  addSetText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
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

export { WorkoutScreen };
