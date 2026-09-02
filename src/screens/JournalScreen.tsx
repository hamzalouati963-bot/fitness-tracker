import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DailyLogRepository } from '../database/repositories';
import { todayLocal } from '../utils/dates';

interface JournalScreenProps {
  navigation: any;
}

export default function JournalScreen({ navigation }: JournalScreenProps) {
  const today = todayLocal();

  const [weight, setWeight] = useState('');
  const [sleep, setSleep] = useState('');
  const [water, setWater] = useState('');
  const [steps, setSteps] = useState('');
  const [workoutDone, setWorkoutDone] = useState(false);
  const [nutritionLogged, setNutritionLogged] = useState(false);
  const [mood, setMood] = useState(3);
  const [notes, setNotes] = useState('');
  const [logExists, setLogExists] = useState(false);
  const [logId, setLogId] = useState<number | null>(null);

  const journalRepo = new DailyLogRepository();

  const loadEntry = useCallback(async () => {
    try {
      const log = await journalRepo.getLog(today);
      if (!log) return;
      setLogExists(true);
      setLogId(log.id!);
      if (log.weight_kg !== null) setWeight(String(log.weight_kg));
      if (log.sleep_hours !== null) setSleep(String(log.sleep_hours));
      if (log.water_liters !== null) setWater(String(log.water_liters));
      if (log.steps !== null) setSteps(String(log.steps));
      setWorkoutDone(log.workout_completed);
      setNutritionLogged(log.nutrition_logged);
      if (log.mood !== null) setMood(log.mood);
      if (log.notes) setNotes(log.notes);
    } catch (e) {
      console.error('Failed to load journal:', e);
    }
  }, [today]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const saveEntry = async () => {
    if (!weight && !sleep && !water && !steps && !notes && !workoutDone && !nutritionLogged) {
      Alert.alert('Empty Entry', 'Add some information to save');
      return;
    }
    try {
      let id = logId;
      if (!id) {
        id = await journalRepo.getOrCreateLog(today);
        setLogId(id);
        setLogExists(true);
      }
      await journalRepo.updateLog(id, {
        weight_kg: weight ? parseFloat(weight) : null,
        sleep_hours: sleep ? parseFloat(sleep) : null,
        water_liters: water ? parseFloat(water) : null,
        steps: steps ? parseInt(steps) : null,
        workout_completed: workoutDone,
        nutrition_logged: nutritionLogged,
        mood,
        notes,
      });
      Alert.alert('Saved', `Journal entry saved for ${today}`);
    } catch (e) {
      console.error('Failed to save journal:', e);
    }
  };

  const moodFaces = ['😞', '😕', '😐', '🙂', '😄'];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Journal</Text>
        <TouchableOpacity onPress={saveEntry}>
          <Icon name="save" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.dateLabel}>{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
        })}</Text>

        <Text style={styles.sectionTitle}>MOOD</Text>
        <View style={styles.moodRow}>
          {moodFaces.map((face, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.moodButton, mood === i + 1 && styles.moodActive]}
              onPress={() => setMood(i + 1)}
            >
              <Text style={[styles.moodText, mood === i + 1 && styles.moodTextActive]}>
                {face}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>BODY</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="Optional"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Sleep (hours)</Text>
            <TextInput
              style={styles.input}
              value={sleep}
              onChangeText={setSleep}
              keyboardType="decimal-pad"
              placeholder="Optional"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>ACTIVITY</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Water (L)</Text>
            <TextInput
              style={styles.input}
              value={water}
              onChangeText={setWater}
              keyboardType="decimal-pad"
              placeholder="Optional"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Steps</Text>
            <TextInput
              style={styles.input}
              value={steps}
              onChangeText={setSteps}
              keyboardType="number-pad"
              placeholder="Optional"
            />
          </View>
        </View>

        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={[styles.checkbox, workoutDone && styles.checkboxChecked]}
            onPress={() => setWorkoutDone(!workoutDone)}
          >
            <Icon 
              name={workoutDone ? 'check-circle' : 'radio-button-unchecked'} 
              size={20} 
              color={workoutDone ? '#2563EB' : '#9CA3AF'}
            />
            <Text style={[styles.checkboxLabel, workoutDone && styles.checkboxLabelChecked]}>
              Workout completed
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={[styles.checkbox, nutritionLogged && styles.checkboxChecked]}
            onPress={() => setNutritionLogged(!nutritionLogged)}
          >
            <Icon 
              name={nutritionLogged ? 'check-circle' : 'radio-button-unchecked'} 
              size={20} 
              color={nutritionLogged ? '#2563EB' : '#9CA3AF'}
            />
            <Text style={[styles.checkboxLabel, nutritionLogged && styles.checkboxLabelChecked]}>
              Nutrition logged
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>NOTES</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="How was your day? Any thoughts or reflections..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveEntry}>
        <Text style={styles.saveButtonText}>Save Entry</Text>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  dateLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  moodButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
  },
  moodActive: {
    backgroundColor: '#2563EB',
  },
  moodText: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  moodTextActive: {
    color: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginLeft: 4,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    flex: 1,
  },
  checkboxChecked: {
    backgroundColor: '#EFF6FF',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  checkboxLabelChecked: {
    color: '#1F2937',
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    margin: 16,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  spacer: {
    height: 20,
  },
});

export { JournalScreen };
