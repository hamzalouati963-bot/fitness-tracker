import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface MeasurementsScreenProps {
  navigation: any;
}

const historicalData = [
  { date: '2025-07-08', weight: 119.6, body_fat: 31.9, muscle_mass: 77.4, bmi: 36.1, source: 'InBody' },
  { date: '2025-08-19', weight: 116.2, body_fat: 31.1, muscle_mass: 76.2, bmi: 35.1, source: 'InBody' },
];

export default function MeasurementsScreen({ navigation }: MeasurementsScreenProps) {
  const [form, setForm] = React.useState({
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

  const saveMeasurement = () => {
    if (!form.weight && !form.body_fat) {
      Alert.alert('Error', 'At least weight or body fat must be entered');
      return;
    }
    Alert.alert('Saved', 'Measurement recorded successfully');
    setForm({ weight: '', waist: '', chest: '', arm: '', thigh: '', body_fat: '', muscle_mass: '', notes: '', source: 'manual' });
  };

  const bmi = form.weight && form.weight > 0 ? (parseFloat(form.weight) / 1.82 / 1.82).toFixed(1) : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Measurements</Text>
        <Icon name="add" size={24} color="#2563EB" onPress={saveMeasurement}/>
      </View>

      <View style={styles.todayCard}>
        <View style={styles.todayHeader}>
          <Text style={styles.todayLabel}>Current Weight</Text>
          <Text style={styles.todayValue}>116.2 kg</Text>
        </View>
        <View style={styles.todayRow}>
          <View style={styles.todayMetric}>
            <Text style={styles.metricLabel}>Body Fat</Text>
            <Text style={styles.metricValue}>31.1%</Text>
          </View>
          <View style={styles.todayMetric}>
            <Text style={styles.metricLabel}>Muscle Mass</Text>
            <Text style={styles.metricValue}>76.2 kg</Text>
          </View>
          <View style={styles.todayMetric}>
            <Text style={styles.metricLabel}>BMI</Text>
            <Text style={styles.metricValue}>35.1</Text>
          </View>
        </View>
        <Text style={styles.todaySource}>Source: InBody • 19/08/2025</Text>
      </View>

      <View style={styles.historyCard}>
        <Text style={styles.sectionTitle}>HISTORICAL DATA</Text>
        {historicalData.map((entry, i) => (
          <View key={i} style={styles.historyEntry}>
            <Text style={styles.historyDate}>{entry.date}</Text>
            <View style={styles.historyMetrics}>
              <Text style={styles.historyMetric}>{entry.weight} kg</Text>
              <Text style={styles.historyMetric}>BF: {entry.body_fat}%</Text>
              <Text style={styles.historyMetric}>MM: {entry.muscle_mass} kg</Text>
              <Text style={styles.historyMetric}>BMI: {entry.bmi}</Text>
            </View>
            <Text style={styles.historySource}>{entry.source}</Text>
          </View>
        ))}
      </View>

      <View style={styles.newMeasurementCard}>
        <Text style={styles.sectionTitle}>NEW MEASUREMENT</Text>
        <View style={styles.formRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput style={styles.input} value={form.weight} onChangeText={(t) => setForm({ ...form, weight: t })} keyboardType="decimal-pad" placeholder="0" />
          </View>
          {bmi && <Text style={styles.autoBmi}>BMI: {bmi}</Text>}
        </View>
        <View style={styles.formRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Waist (cm)</Text>
            <TextInput style={styles.input} value={form.waist} onChangeText={(t) => setForm({ ...form, waist: t })} keyboardType="decimal-pad" placeholder="Optional" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Chest (cm)</Text>
            <TextInput style={styles.input} value={form.chest} onChangeText={(t) => setForm({ ...form, chest: t })} keyboardType="decimal-pad" placeholder="Optional" />
          </View>
        </View>
        <View style={styles.formRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Arm (cm)</Text>
            <TextInput style={styles.input} value={form.arm} onChangeText={(t) => setForm({ ...form, arm: t })} keyboardType="decimal-pad" placeholder="Optional" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Thigh (cm)</Text>
            <TextInput style={styles.input} value={form.thigh} onChangeText={(t) => setForm({ ...form, thigh: t })} keyboardType="decimal-pad" placeholder="Optional" />
          </View>
        </View>
        <View style={styles.formRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Body Fat (%)</Text>
            <TextInput style={styles.input} value={form.body_fat} onChangeText={(t) => setForm({ ...form, body_fat: t })} keyboardType="decimal-pad" placeholder="Optional" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Muscle Mass (kg)</Text>
            <TextInput style={styles.input} value={form.muscle_mass} onChangeText={(t) => setForm({ ...form, muscle_mass: t })} keyboardType="decimal-pad" placeholder="Optional" />
          </View>
        </View>
        <Text style={styles.inputLabel}>Source</Text>
        <View style={styles.sourceRow}>
          {['manual', 'inbody', ' DEXA', 'other'].map(s => (
            <TouchableOpacity key={s} style={[styles.sourceChip, form.source === s && styles.sourceChipActive]} onPress={() => setForm({ ...form, source: s })}>
              <Text style={[styles.sourceChipText, form.source === s && styles.sourceChipTextActive]}>{s.charAt(0).toUpperCase() + s.slice(1).trim()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={styles.notesInput} placeholder="Notes (optional)" value={form.notes} onChangeText={(t) => setForm({ ...form, notes: t })} />
        <TouchableOpacity style={styles.saveButton} onPress={saveMeasurement}>
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
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 12, marginLeft: 4 },
  historyEntry: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  historyDate: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  historyMetrics: { flexDirection: 'row', gap: 12, marginBottom: 2 },
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

export { MeasurementsScreen };
