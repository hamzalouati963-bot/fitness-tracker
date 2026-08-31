import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CustomWorkoutRepository } from '../database/repositories';
import { exercises as exercisesData, todayISO, timeNow } from '../services';
import { WorkoutRepository } from '../database/repositories';
import type { CustomWorkoutExercise } from '../models';

interface CreateCustomWorkoutScreenProps {
  navigation: any;
  route: any;
}

interface ExerciseDraft {
  tempId: string;
  exercise_id: string;
  exercise_name: string;
  order_index: number;
  sets: number;
  reps: number;
  weight_kg: number;
  rest_seconds: number;
  notes: string;
}

export default function CreateCustomWorkoutScreen({ navigation, route }: CreateCustomWorkoutScreenProps) {
  const workoutId = route.params?.workoutId as number | undefined;
  const isEditing = !!workoutId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<ExerciseDraft[]>([]);
  const [editingExercise, setEditingExercise] = useState<ExerciseDraft | null>(null);
  const [showExerciseEditor, setShowExerciseEditor] = useState(false);

  const repo = new CustomWorkoutRepository();

  useEffect(() => {
    if (isEditing) {
      loadWorkout();
    }
  }, [workoutId]);

  const loadWorkout = async () => {
    if (!workoutId) return;
    const workout = await repo.getById(workoutId);
    if (workout) {
      setName(workout.name);
      setDescription(workout.description);
    }
    const savedExercises = await repo.getExercises(workoutId);
    setExercises(savedExercises.map((e, i) => ({
      tempId: String(e.id),
      exercise_id: e.exercise_id,
      exercise_name: e.exercise_name,
      order_index: i,
      sets: e.sets,
      reps: e.reps,
      weight_kg: e.weight_kg,
      rest_seconds: e.rest_seconds,
      notes: e.notes,
    })));
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('params', (params: any) => {
      if (params?.selectedExercise) {
        const ex = params.selectedExercise;
        setEditingExercise({
          tempId: Date.now().toString(),
          exercise_id: ex.id,
          exercise_name: ex.name,
          order_index: exercises.length,
          sets: 3,
          reps: 10,
          weight_kg: 0,
          rest_seconds: ex.default_rest_seconds || 90,
          notes: '',
        });
        setShowExerciseEditor(true);
        navigation.setParams({ selectedExercise: undefined });
      }
    });
    return unsubscribe;
  }, [navigation, exercises.length]);

  const handleAddExercise = () => {
    navigation.navigate('ExercisePicker', {
      onSelect: (exercise: any) => {
        setEditingExercise({
          tempId: Date.now().toString(),
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          order_index: exercises.length,
          sets: 3,
          reps: 10,
          weight_kg: 0,
          rest_seconds: exercise.default_rest_seconds || 90,
          notes: '',
        });
        setShowExerciseEditor(true);
      },
    });
  };

  const handleConfirmExercise = () => {
    if (!editingExercise) return;
    if (editingExercise.order_index < exercises.length) {
      const updated = [...exercises];
      updated[editingExercise.order_index] = editingExercise;
      setExercises(updated);
    } else {
      setExercises([...exercises, editingExercise]);
    }
    setShowExerciseEditor(false);
    setEditingExercise(null);
  };

  const handleRemoveExercise = (index: number) => {
    Alert.alert('Remove Exercise', `Remove "${exercises[index].exercise_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = exercises.filter((_, i) => i !== index).map((e, i) => ({ ...e, order_index: i }));
          setExercises(updated);
        },
      },
    ]);
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;
    const updated = [...exercises];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setExercises(updated.map((e, i) => ({ ...e, order_index: i })));
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter a workout name.');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Exercises Required', 'Add at least one exercise.');
      return;
    }

    try {
      if (isEditing && workoutId) {
        await repo.update(workoutId, { name: trimmedName, description: description.trim() });
        await repo.deleteAllExercises(workoutId);
        for (let i = 0; i < exercises.length; i++) {
          const e = exercises[i];
          await repo.addExercise({
            custom_workout_id: workoutId,
            exercise_id: e.exercise_id,
            exercise_name: e.exercise_name,
            order_index: i,
            sets: e.sets,
            reps: e.reps,
            weight_kg: e.weight_kg,
            rest_seconds: e.rest_seconds,
            notes: e.notes,
          });
        }
      } else {
        const newId = await repo.create({ name: trimmedName, description: description.trim() });
        for (let i = 0; i < exercises.length; i++) {
          const e = exercises[i];
          await repo.addExercise({
            custom_workout_id: newId,
            exercise_id: e.exercise_id,
            exercise_name: e.exercise_name,
            order_index: i,
            sets: e.sets,
            reps: e.reps,
            weight_kg: e.weight_kg,
            rest_seconds: e.rest_seconds,
            notes: e.notes,
          });
        }
      }
      navigation.goBack();
    } catch (e) {
      console.error('Failed to save custom workout:', e);
      Alert.alert('Error', 'Failed to save workout.');
    }
  };

  const handleStartWorkout = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || exercises.length === 0) {
      Alert.alert('Incomplete', 'Add a name and at least one exercise before starting.');
      return;
    }

    try {
      const workoutRepo = new WorkoutRepository();
      const sessionId = await workoutRepo.createSession({
        date: todayISO(),
        start_time: timeNow(),
        end_time: null,
        duration_minutes: null,
        program_id: isEditing && workoutId ? `custom_${workoutId}` : null,
        program_name: trimmedName,
        notes: '',
      });

      for (let i = 0; i < exercises.length; i++) {
        const e = exercises[i];
        await workoutRepo.createExercise({
          session_id: sessionId,
          exercise_id: e.exercise_id,
          exercise_name: e.exercise_name,
          order_index: i,
          notes: e.notes,
        });
      }

      Alert.alert('Workout Started', trimmedName, [
        { text: "Let's Go", onPress: () => navigation.navigate('Workout', { sessionId }) },
      ]);
    } catch (e) {
      console.error('Failed to start custom workout:', e);
      Alert.alert('Error', 'Failed to start workout.');
    }
  };

  if (showExerciseEditor && editingExercise) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setShowExerciseEditor(false); setEditingExercise(null); }}>
            <Icon name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exercise Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.editorCard}>
          <Text style={styles.editorExerciseName}>{editingExercise.exercise_name}</Text>

          <View style={styles.stepperRow}>
            <Text style={styles.stepperLabel}>Sets</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setEditingExercise({ ...editingExercise, sets: Math.max(1, editingExercise.sets - 1) })}
              >
                <Icon name="remove" size={20} color="#2563EB" />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{editingExercise.sets}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setEditingExercise({ ...editingExercise, sets: editingExercise.sets + 1 })}
              >
                <Icon name="add" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.stepperRow}>
            <Text style={styles.stepperLabel}>Reps</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setEditingExercise({ ...editingExercise, reps: Math.max(1, editingExercise.reps - 1) })}
              >
                <Icon name="remove" size={20} color="#2563EB" />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{editingExercise.reps}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setEditingExercise({ ...editingExercise, reps: editingExercise.reps + 1 })}
              >
                <Icon name="add" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.stepperRow}>
            <Text style={styles.stepperLabel}>Weight (kg)</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setEditingExercise({ ...editingExercise, weight_kg: Math.max(0, editingExercise.weight_kg - 2.5) })}
              >
                <Icon name="remove" size={20} color="#2563EB" />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{editingExercise.weight_kg}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setEditingExercise({ ...editingExercise, weight_kg: editingExercise.weight_kg + 2.5 })}
              >
                <Icon name="add" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.stepperRow}>
            <Text style={styles.stepperLabel}>Rest (sec)</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setEditingExercise({ ...editingExercise, rest_seconds: Math.max(0, editingExercise.rest_seconds - 15) })}
              >
                <Icon name="remove" size={20} color="#2563EB" />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{editingExercise.rest_seconds}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setEditingExercise({ ...editingExercise, rest_seconds: editingExercise.rest_seconds + 15 })}
              >
                <Icon name="add" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.stepperLabel}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={editingExercise.notes}
            onChangeText={(text) => setEditingExercise({ ...editingExercise, notes: text })}
            placeholder="Optional notes..."
            placeholderTextColor="#9CA3AF"
            multiline
          />

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmExercise}>
            <Text style={styles.confirmBtnText}>
              {editingExercise.order_index < exercises.length ? 'Update Exercise' : 'Add to Workout'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Workout' : 'Create Workout'}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Push Day"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Optional description"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Exercises ({exercises.length})</Text>
        <TouchableOpacity style={styles.addExerciseBtn} onPress={handleAddExercise}>
          <Icon name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addExerciseBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {exercises.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="fitness-center" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No exercises yet</Text>
          <Text style={styles.emptySubtitle}>Tap "Add" to pick exercises from the library</Text>
        </View>
      ) : (
        exercises.map((ex, index) => (
          <View key={ex.tempId} style={styles.exerciseCard}>
            <View style={styles.exerciseLeft}>
              <Text style={styles.exerciseIndex}>{index + 1}</Text>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{ex.exercise_name}</Text>
                <Text style={styles.exerciseMeta}>
                  {ex.sets} × {ex.reps} · {ex.weight_kg} kg · {ex.rest_seconds}s rest
                </Text>
              </View>
            </View>
            <View style={styles.exerciseActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => handleMoveExercise(index, 'up')}
                disabled={index === 0}
              >
                <Icon name="keyboard-arrow-up" size={20} color={index === 0 ? '#D1D5DB' : '#6B7280'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => handleMoveExercise(index, 'down')}
                disabled={index === exercises.length - 1}
              >
                <Icon name="keyboard-arrow-down" size={20} color={index === exercises.length - 1 ? '#D1D5DB' : '#6B7280'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => {
                  setEditingExercise({ ...ex, order_index: index });
                  setShowExerciseEditor(true);
                }}
              >
                <Icon name="edit" size={18} color="#2563EB" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleRemoveExercise(index)}>
                <Icon name="delete-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {exercises.length > 0 && (
        <TouchableOpacity style={styles.startBtn} onPress={handleStartWorkout}>
          <Icon name="play-circle" size={22} color="#FFFFFF" />
          <Text style={styles.startBtnText}>Start Workout</Text>
        </TouchableOpacity>
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
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  field: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  addExerciseBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
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
  exerciseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  exerciseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseIndex: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 10,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  exerciseMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 4,
    marginLeft: 2,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  editorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  editorExerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  stepperBtn: {
    padding: 10,
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    minWidth: 40,
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    marginTop: 6,
    marginBottom: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  confirmBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
});
