import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { measurementRepo, settingsRepo } from '../database/repositories';
import { validateWeight, validatePositiveNumber } from '../utils/validation';
import { todayISO } from '../services';
import type { BodyMeasurement } from '../models';
import type { MoreScreenProps } from '../navigation/types';

export default function MeasurementsScreen({ navigation }: MoreScreenProps<'Measurements'>) {
  const [latest, setLatest] = useState<BodyMeasurement | null>(null);
  const [history, setHistory] = useState<BodyMeasurement[]>([]);
  const [height, setHeight] = useState(180);
  const [form, setForm] = useState({
    weight: '',
    waist: '',
    chest: '',
    arm: '',
    thigh: '',
    body_fat: '',
    muscle_mass: '',
    notes: '',
    source: 'manual',
  });

  const loadMeasurements = useCallback(async () => {
    try {
      const profile = await settingsRepo.getProfile();
      if (profile?.height_cm) setHeight(profile.height_cm);

      const latestData = await measurementRepo.getLatestMeasurement();
      const historyData = await measurementRepo.getMeasurements(15);
      setLatest(latestData);
      setHistory(historyData);
    } catch (e) {
      console.error('Failed to load measurements:', e);
      Alert.alert('Error', 'Failed to load measurements.');
    }
  }, []);

  useEffect(() => {
    loadMeasurements();
    const unsubscribe = navigation.addListener('focus', loadMeasurements);
    return unsubscribe;
  }, [navigation, loadMeasurements]);

  const saveMeasurement = async () => {
    if (!form.weight && !form.body_fat) {
      Alert.alert('Error', 'At least weight or body fat must be entered');
      return;
    }

    if (form.weight) {
      const error = validateWeight(form.weight);
      if (error) { Alert.alert('Invalid Input', error); return; }
    }
    if (form.waist) {
      const error = validatePositiveNumber(form.waist, 'Waist');
      if (error) { Alert.alert('Invalid Input', error); return; }
    }
    if (form.chest) {
      const error = validatePositiveNumber(form.chest, 'Chest');
      if (error) { Alert.alert('Invalid Input', error); return; }
    }
    if (form.arm) {
      const error = validatePositiveNumber(form.arm, 'Arm');
      if (error) { Alert.alert('Invalid Input', error); return; }
    }
    if (form.thigh) {
      const error = validatePositiveNumber(form.thigh, 'Thigh');
      if (error) { Alert.alert('Invalid Input', error); return; }
    }
    if (form.body_fat) {
      const num = parseFloat(form.body_fat);
      if (isNaN(num) || num < 0 || num > 100) {
        Alert.alert('Invalid Input', 'Body fat must be between 0 and 100');
        return;
      }
    }
    if (form.muscle_mass) {
      const error = validatePositiveNumber(form.muscle_mass, 'Muscle mass');
      if (error) { Alert.alert('Invalid Input', error); return; }
    }

    try {
      const weightNum = parseFloat(form.weight) || 0;
      const bmiValue = weightNum > 0 && height > 0 ? weightNum / (height / 100) / (height / 100) : null;

      await measurementRepo.createMeasurement({
        date: todayISO(),
        weight_kg: form.weight ? parseFloat(form.weight) : null,
        waist_cm: form.waist ? parseFloat(form.waist) : null,
        chest_cm: form.chest ? parseFloat(form.chest) : null,
        arm_cm: form.arm ? parseFloat(form.arm) : null,
        thigh_cm: form.thigh ? parseFloat(form.thigh) : null,
        body_fat_percent: form.body_fat ? parseFloat(form.body_fat) : null,
        muscle_mass_kg: form.muscle_mass ? parseFloat(form.muscle_mass) : null,
        bmi: bmiValue ? Math.round(bmiValue * 10) / 10 : null,
        water_percent: null,
        visceral_fat: null,
        phase_angle: null,
        source: form.source,
        notes: form.notes,
      });

      setForm({ weight: '', waist: '', chest: '', arm: '', thigh: '', body_fat: '', muscle_mass: '', notes: '', source: 'manual' });
      await loadMeasurements();
      Alert.alert('Saved', 'Measurement recorded successfully');
    } catch (e) {
      console.error('Failed to save measurement:', e);
      Alert.alert('Error', 'Failed to save measurement. Please try again.');
    }
  };

  const deleteMeasurement = (id: number) => {
    Alert.alert('Delete Measurement', 'Are you sure you want to delete this measurement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await measurementRepo.deleteMeasurement(id);
            await loadMeasurements();
          } catch (e) {
            console.error('Failed to delete measurement:', e);
            Alert.alert('Error', 'Failed to delete measurement.');
          }
        },
      },
    ]);
  };

  const bmi = form.weight && parseFloat(form.weight) > 0
    ? (parseFloat(form.weight) / (height / 100) / (height / 100)).toFixed(1)
    : null;

  const sources = ['manual', 'inbody', 'dexa', 'other'];

  return (
    <ScrollView style={styles.container} keyboardDismissMode="on-drag">
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Measurements</Text>
        <Icon name="add" size={24} color="#2563EB" onPress={saveMeasurement} />
      </View>

      <View style={styles.todayCard}>
        <View style={styles.todayHeader}>
          <Text style={styles.todayLabel}>Current Weight</Text>
          <Text style={styles.todayValue}>{latest?.weight_kg ? `${latest.weight_kg} kg` : 'No data'}</Text>
        </View>
        <View style={styles.todayRow}>
          <View style={styles.todayMetric}>
            <Text style={styles.metricLabel}>Body Fat</Text>
            <Text style={styles.metricValue}>{latest?.body_fat_percent ? `${latest.body_fat_percent}%` : '—'}</Text>
          </View>
          <View style={styles.todayMetric}>
            <Text style={styles.metricLabel}>Muscle Mass</Text>
            <Text style={styles.metricValue}>{latest?.muscle_mass_kg ? `${latest.muscle_mass_kg} kg` : '—'}</Text>
          </View>
          <View style={styles.todayMetric}>
            <Text style={styles.metricLabel}>BMI</Text>
            <Text style={styles.metricValue}>{latest?.bmi ?? '—'}</Text>
          </View>
        </View>
        {latest && (
          <Text style={styles.todaySource}>Source: {latest.source} • {latest.date}</Text>
        )}
      </View>

      <View style={styles.historyCard}>
        <Text style={styles.sectionTitle}>HISTORICAL DATA</Text>
        {history.length === 0 ? (
          <Text style={styles.emptyHistory}>No measurements logged yet</Text>
        ) : (
          history.map((entry) => (
            <View key={entry.id} style={styles.historyEntry}>
              <View style={styles.historyEntryHeader}>
                <Text style={styles.historyDate}>{entry.date}</Text>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Delete measurement" accessibilityHint="Deletes this measurement record" onPress={() => entry.id != null && deleteMeasurement(entry.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="delete" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <View style={styles.historyMetrics}>
                {entry.weight_kg && <Text style={styles.historyMetric}>{entry.weight_kg} kg</Text>}
                {entry.body_fat_percent && <Text style={styles.historyMetric}>BF: {entry.body_fat_percent}%</Text>}
                {entry.muscle_mass_kg && <Text style={styles.historyMetric}>MM: {entry.muscle_mass_kg} kg</Text>}
                {entry.bmi && <Text style={styles.historyMetric}>BMI: {entry.bmi}</Text>}
              </View>
              <Text style={styles.historySource}>{entry.source}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.newMeasurementCard}>
        <Text style={styles.sectionTitle}>NEW MEASUREMENT</Text>
        <View style={styles.formRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput accessibilityLabel="Weight in kilograms" style={styles.input} value={form.weight} onChangeText={(t) => setForm({ ...form, weight: t })} keyboardType="decimal-pad" placeholder="0" />
          </View>
          {bmi && <View style={[styles.inputGroup, { justifyContent: 'center' }]}><Text style={styles.autoBmi}>BMI: {bmi}</Text></View>}
        </View>
        <View style={styles.formRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Waist (cm)</Text>
            <TextInput accessibilityLabel="Waist measurement in centimeters" style={styles.input} value={form.waist} onChangeText={(t) => setForm({ ...form, waist: t })} keyboardType="decimal-pad" placeholder="Optional" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Chest (cm)</Text>
            <TextInput accessibilityLabel="Chest measurement in centimeters" style={styles.input} value={form.chest} onChangeText={(t) => setForm({ ...form, chest: t })} keyboardType="decimal-pad" placeholder="Optional" />
          </View>
        </View>
        <View style={styles.formRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Arm (cm)</Text>
            <TextInput accessibilityLabel="Arm measurement in centimeters" style={styles.input} value={form.arm} onChangeText={(t) => setForm({ ...form, arm: t })} keyboardType="decimal-pad" placeholder="Optional" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Thigh (cm)</Text>
            <TextInput accessibilityLabel="Thigh measurement in centimeters" style={styles.input} value={form.thigh} onChangeText={(t) => setForm({ ...form, thigh: t })} keyboardType="decimal-pad" placeholder="Optional" />
          </View>
        </View>
        <View style={styles.formRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Body Fat (%)</Text>
            <TextInput accessibilityLabel="Body fat percentage" style={styles.input} value={form.body_fat} onChangeText={(t) => setForm({ ...form, body_fat: t })} keyboardType="decimal-pad" placeholder="Optional" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Muscle Mass (kg)</Text>
            <TextInput accessibilityLabel="Muscle mass in kilograms" style={styles.input} value={form.muscle_mass} onChangeText={(t) => setForm({ ...form, muscle_mass: t })} keyboardType="decimal-pad" placeholder="Optional" />
          </View>
        </View>
        <Text style={styles.inputLabel}>Source</Text>
        <View style={styles.sourceRow}>
          {sources.map((s) => (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Source: ${s}`} accessibilityState={{ selected: form.source === s }} key={s} style={[styles.sourceChip, form.source === s && styles.sourceChipActive]} onPress={() => setForm({ ...form, source: s })}>
              <Text style={[styles.sourceChipText, form.source === s && styles.sourceChipTextActive]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput accessibilityLabel="Notes" style={styles.notesInput} placeholder="Notes (optional)" value={form.notes} onChangeText={(t) => setForm({ ...form, notes: t })} />
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Save measurement" style={styles.saveButton} onPress={saveMeasurement}>
          <Text style={styles.saveButtonText}>Save Measurement</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#1F2937' },
  todayCard: { backgroundColor: '#FFFFFF', margin: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  todayLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  todayValue: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  todayRow: { flexDirection: 'row', gap: 12 },
  todayMetric: { flex: 1, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 8, paddingVertical: 12 },
  metricLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  metricValue: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  todaySource: { fontSize: 11, color: '#9CA3AF', marginTop: 12, textAlign: 'right' },
  historyCard: { margin: 16, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  emptyHistory: { fontSize: 13, color: '#9CA3AF', padding: 8, textAlign: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 12, marginLeft: 4 },
  historyEntry: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  historyEntryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  historyDate: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  historyMetrics: { flexDirection: 'row', gap: 12, marginBottom: 2, flexWrap: 'wrap' },
  historyMetric: { fontSize: 13, color: '#1F2937', fontWeight: '500' },
  historySource: { fontSize: 11, color: '#9CA3AF' },
  newMeasurementCard: { margin: 16, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  inputGroup: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  inputLabel: { fontSize: 11, color: '#6B7280', marginBottom: 6, marginLeft: 4 },
  input: { fontSize: 16, fontWeight: '600', color: '#1F2937', textAlign: 'center' },
  autoBmi: { flex: 1, fontSize: 14, color: '#2563EB', textAlign: 'center', fontWeight: '600', backgroundColor: '#EFF6FF', borderRadius: 8, padding: 10, alignItems: 'center' },
  sourceRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  sourceChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 6 },
  sourceChipActive: { backgroundColor: '#2563EB' },
  sourceChipText: { fontSize: 12, color: '#6B7280' },
  sourceChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  notesInput: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, fontSize: 14, color: '#1F2937', marginBottom: 16 },
  saveButton: { backgroundColor: '#2563EB', borderRadius: 8, padding: 14, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  spacer: { height: 20 },
});