import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CalculatorService } from '../services';
import { settingsRepo } from '../database/repositories';
import type { MoreScreenProps } from '../navigation/types';

export default function CalculatorsScreen({ navigation }: MoreScreenProps<'Calculators'>) {
  const calculatorService = new CalculatorService();

  const [bmiInputs, setBmiInputs] = useState({ weight: '', height: '' });
  const [bmrInputs, setBmrInputs] = useState({ sex: 'male', age: '', weight: '', height: '' });
  const [tdeeInputs, setTdeeInputs] = useState({ activityLevel: 'sedentary', customMultiplier: 1.2 });
  const [hydrationInputs, setHydrationInputs] = useState({ weight: 70 });
  const [workoutEnergyInputs, setWorkoutEnergyInputs] = useState({ activity: 'walking', duration: 30, weight: 70 });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await settingsRepo.getProfile();
        if (profile) {
          const w = String(profile.current_weight_kg);
          const h = String(profile.height_cm);
          setBmiInputs({ weight: w, height: h });
          setBmrInputs(prev => ({ ...prev, weight: w, height: h, age: profile.age !== null ? String(profile.age) : prev.age }));
          setHydrationInputs({ weight: profile.current_weight_kg });
          setWorkoutEnergyInputs(prev => ({ ...prev, weight: profile.current_weight_kg }));
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    };
    loadProfile();
  }, []);

  const bmi = bmiInputs.weight && bmiInputs.height
    ? calculatorService.calculateBMI(parseFloat(bmiInputs.weight), parseFloat(bmiInputs.height))
    : null;

  const bmr = bmrInputs.weight && bmrInputs.height && bmrInputs.age
    ? calculatorService.calculateBMR(
        bmrInputs.sex === 'male' ? 'male' : 'female',
        parseFloat(bmrInputs.weight),
        parseFloat(bmrInputs.height),
        parseInt(bmrInputs.age)
      )
    : null;

  const tdee = bmr
    ? calculatorService.calculateTDEE(bmr, tdeeInputs.activityLevel)
    : null;

  const hydrationTarget = hydrationInputs.weight > 0
    ? calculatorService.getHydrationTarget(hydrationInputs.weight, tdeeInputs.activityLevel)
    : null;

  const workoutCalories = workoutEnergyInputs.weight > 0 && workoutEnergyInputs.duration > 0
    ? Math.round(calculatorService.calculateWorkoutCalories(
        workoutEnergyInputs.activity,
        workoutEnergyInputs.duration,
        workoutEnergyInputs.weight
      ))
    : null;

  return (
    <ScrollView style={styles.container} keyboardDismissMode="on-drag">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calculators</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* BMI Calculator */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="accessibility" size={24} color="#2563EB" />
          <Text style={styles.cardTitle}>BMI Calculator</Text>
          <Text style={styles.cardDescription}>Body Mass Index</Text>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput style={styles.input} value={bmiInputs.weight} onChangeText={(t) => setBmiInputs({ ...bmiInputs, weight: t })} keyboardType="decimal-pad" placeholder="0" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Height (cm)</Text>
            <TextInput style={styles.input} value={bmiInputs.height} onChangeText={(t) => setBmiInputs({ ...bmiInputs, height: t })} keyboardType="decimal-pad" placeholder="0" />
          </View>
        </View>
        {bmi !== null && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Your BMI:</Text>
            <Text style={styles.resultValue}>{bmi.toFixed(1)} kg/m²</Text>
            <Text style={styles.resultCategory}>
              {bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal weight' : bmi < 30 ? 'Overweight' : 'Obese'}
            </Text>
          </View>
        )}
      </View>

      {/* BMR Calculator */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="bolt" size={24} color="#2563EB" />
          <Text style={styles.cardTitle}>BMR Calculator</Text>
          <Text style={styles.cardDescription}>Mifflin-St Jeor Equation</Text>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Sex</Text>
            <View style={styles.sexToggle}>
              <TouchableOpacity style={[styles.sexButton, bmrInputs.sex === 'male' && styles.sexActive]} onPress={() => setBmrInputs({ ...bmrInputs, sex: 'male' })}>
                <Text style={[styles.sexText, bmrInputs.sex === 'male' && styles.sexTextActive]}>♂ Male</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sexButton, bmrInputs.sex === 'female' && styles.sexActive]} onPress={() => setBmrInputs({ ...bmrInputs, sex: 'female' })}>
                <Text style={[styles.sexText, bmrInputs.sex === 'female' && styles.sexTextActive]}>♀ Female</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View></View>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput style={styles.input} value={bmrInputs.age} onChangeText={(t) => setBmrInputs({ ...bmrInputs, age: t })} keyboardType="number-pad" placeholder="0" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput style={styles.input} value={bmrInputs.weight} onChangeText={(t) => setBmrInputs({ ...bmrInputs, weight: t })} keyboardType="decimal-pad" placeholder="0" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Height (cm)</Text>
            <TextInput style={styles.input} value={bmrInputs.height} onChangeText={(t) => setBmrInputs({ ...bmrInputs, height: t })} keyboardType="decimal-pad" placeholder="0" />
          </View>
        </View>
        {bmr !== null && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Estimated BMR:</Text>
            <Text style={styles.resultValue}>{Math.round(bmr)} kcal/day</Text>
            <Text style={styles.resultNote}>Calories your body burns at rest</Text>
          </View>
        )}
      </View>

      {/* TDEE Calculator */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="bar-chart" size={24} color="#2563EB" />
          <Text style={styles.cardTitle}>TDEE Calculator</Text>
          <Text style={styles.cardDescription}>Total Daily Energy Expenditure</Text>
        </View>
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Activity Level</Text>
            <View style={styles.activityContainer}>
              {['sedentary', 'lightly_active', 'moderately_active', 'very_active'].map((level) => (
                <TouchableOpacity key={level} style={[styles.activityButton, tdeeInputs.activityLevel === level && styles.activityActive]} onPress={() => setTdeeInputs({ ...tdeeInputs, activityLevel: level, customMultiplier: level === 'sedentary' ? 1.2 : level === 'lightly_active' ? 1.375 : level === 'moderately_active' ? 1.55 : 1.725 })}>
                  <Text style={[styles.activityText, tdeeInputs.activityLevel === level && styles.activityTextActive]}>
                    {level === 'sedentary' ? 'Sedentary' : level === 'lightly_active' ? 'Lightly Active' : level === 'moderately_active' ? 'Moderately Active' : 'Very Active'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        {tdee !== null && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Estimated TDEE:</Text>
            <Text style={styles.resultValue}>{Math.round(tdee)} kcal/day</Text>
            <Text style={styles.resultNote}>Total calories for maintenance</Text>
          </View>
        )}
      </View>

      {/* Hydration Calculator */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="water" size={24} color="#06B6D4" />
          <Text style={styles.cardTitle}>Hydration Target</Text>
          <Text style={styles.cardDescription}>Estimated daily water intake</Text>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Weight (kg)</Text>
          <TextInput style={styles.input} value={hydrationInputs.weight.toString()} onChangeText={(t) => setHydrationInputs({ ...hydrationInputs, weight: parseFloat(t) || 0 })} keyboardType="decimal-pad" placeholder="0" />
        </View>
        {hydrationTarget !== null && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Estimated Target:</Text>
            <Text style={styles.resultValue}>{hydrationTarget.toFixed(1)} L/day</Text>
            <Text style={styles.resultNote}>{Math.round(hydrationTarget * 1000)} ml per day</Text>
          </View>
        )}
      </View>

      {/* Workout Energy Estimate */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="fitness-center" size={24} color="#10B981" />
          <Text style={styles.cardTitle}>Workout Energy Estimate</Text>
          <Text style={styles.cardDescription}>Estimated calories burned during exercise</Text>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Activity</Text>
            <View style={styles.activityContainer}>
              {['walking', 'running', 'cycling', 'strength_training', 'hiit'].map((act) => (
                <TouchableOpacity key={act} style={[styles.activityButton, workoutEnergyInputs.activity === act && styles.activityActive]} onPress={() => setWorkoutEnergyInputs({ ...workoutEnergyInputs, activity: act })}>
                  <Text style={[styles.activityText, workoutEnergyInputs.activity === act && styles.activityTextActive]}>
                    {act === 'walking' ? 'Walking' : act === 'running' ? 'Running' : act === 'cycling' ? 'Cycling' : act === 'strength_training' ? 'Strength' : 'HIIT'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Duration (min)</Text>
            <TextInput style={styles.input} value={workoutEnergyInputs.duration.toString()} onChangeText={(t) => setWorkoutEnergyInputs({ ...workoutEnergyInputs, duration: parseInt(t) || 0 })} keyboardType="number-pad" placeholder="0" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Body Weight (kg)</Text>
            <TextInput style={styles.input} value={workoutEnergyInputs.weight.toString()} onChangeText={(t) => setWorkoutEnergyInputs({ ...workoutEnergyInputs, weight: parseFloat(t) || 0 })} keyboardType="decimal-pad" placeholder="0" />
          </View>
        </View>
        {workoutCalories !== null && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Estimated Calories Burned:</Text>
            <Text style={styles.resultValue}>{workoutCalories} kcal</Text>
            <Text style={styles.resultNote}>This is an estimate based on MET values</Text>
          </View>
        )}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Icon name="info-outline" size={16} color="#6B7280" />
        <Text style={styles.disclaimerText}>All calculations are estimates based on standard formulas and should be used as guidance only. Individual results may vary.</Text>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  card: { backgroundColor: '#FFFFFF', margin: 16, marginBottom: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', flex: 1 },
  cardDescription: { fontSize: 12, color: '#6B7280' },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  inputGroup: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10 },
  inputLabel: { fontSize: 11, color: '#6B7280', marginBottom: 6, marginLeft: 4 },
  input: { fontSize: 16, fontWeight: '600', color: '#1F2937', textAlign: 'center' },
  sexToggle: { flexDirection: 'row', gap: 8 },
  sexButton: { flex: 1, paddingVertical: 10, backgroundColor: '#F3F4F6', borderRadius: 8, alignItems: 'center' },
  sexActive: { backgroundColor: '#2563EB' },
  sexText: { fontSize: 14, color: '#6B7280' },
  sexTextActive: { color: '#FFFFFF', fontWeight: '600' },
  activityContainer: { gap: 6 },
  activityButton: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F3F4F6', borderRadius: 6 },
  activityActive: { backgroundColor: '#2563EB' },
  activityText: { fontSize: 12, color: '#6B7280' },
  activityTextActive: { color: '#FFFFFF', fontWeight: '600' },
  resultBox: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16, marginTop: 12 },
  resultLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  resultValue: { fontSize: 28, fontWeight: '700', color: '#16A34A', marginBottom: 4 },
  resultCategory: { fontSize: 14, color: '#16A34A', fontWeight: '600' },
  resultNote: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  disclaimerText: { flex: 1, fontSize: 12, color: '#6B7280' },
  spacer: { height: 20 },
});

export { CalculatorsScreen };
