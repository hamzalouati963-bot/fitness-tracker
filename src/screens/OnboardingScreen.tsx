import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { UserProfileRepository } from '../database/repositories';
import type { UserGoal, FitnessLevel, Equipment } from '../models';

interface OnboardingScreenProps {
  onDone: () => void;
}

const GOALS: { value: UserGoal; label: string; icon: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight', icon: '📉' },
  { value: 'build_muscle', label: 'Build Muscle', icon: '💪' },
  { value: 'maintain_weight', label: 'Maintain Weight', icon: '⚖️' },
  { value: 'improve_fitness', label: 'Improve Fitness', icon: '🏃' },
  { value: 'increase_strength', label: 'Increase Strength', icon: '🏋️' },
  { value: 'improve_endurance', label: 'Improve Endurance', icon: '❤️' },
];

const LEVELS: { value: FitnessLevel; label: string; desc: string }[] = [
  { value: 'beginner', label: 'Beginner', desc: 'New to training or returning after a long break' },
  { value: 'intermediate', label: 'Intermediate', desc: '6+ months of consistent training' },
  { value: 'advanced', label: 'Advanced', desc: '2+ years of serious training experience' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string; icon: string }[] = [
  { value: 'no_equipment', label: 'No Equipment', icon: '🚫' },
  { value: 'dumbbells', label: 'Dumbbells', icon: '🏋️' },
  { value: 'barbell', label: 'Barbell', icon: '🏋️' },
  { value: 'machines', label: 'Machines', icon: '⚙️' },
  { value: 'resistance_bands', label: 'Resistance Bands', icon: '🔗' },
  { value: 'full_gym', label: 'Full Gym', icon: '🏢' },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

export default function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel | null>(null);
  const [trainingDays, setTrainingDays] = useState(3);
  const [sessionDuration, setSessionDuration] = useState(45);
  const [equipment, setEquipment] = useState<Equipment>('no_equipment');

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!firstName.trim()) {
          Alert.alert('Required', 'Please enter your first name.');
          return false;
        }
        if (age && (isNaN(Number(age)) || Number(age) < 10 || Number(age) > 120)) {
          Alert.alert('Invalid Age', 'Please enter a valid age between 10 and 120.');
          return false;
        }
        if (height && (isNaN(Number(height)) || Number(height) < 100 || Number(height) > 250)) {
          Alert.alert('Invalid Height', 'Please enter a valid height in cm (100-250).');
          return false;
        }
        if (weight && (isNaN(Number(weight)) || Number(weight) < 30 || Number(weight) > 300)) {
          Alert.alert('Invalid Weight', 'Please enter a valid weight in kg (30-300).');
          return false;
        }
        return true;
      case 2:
        if (!goal) {
          Alert.alert('Required', 'Please select your fitness goal.');
          return false;
        }
        return true;
      case 3:
        if (!fitnessLevel) {
          Alert.alert('Required', 'Please select your fitness level.');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleCreate = async () => {
    if (!firstName.trim()) {
      Alert.alert('Required', 'Please enter your first name.');
      return;
    }
    if (!goal) {
      Alert.alert('Required', 'Please select your fitness goal.');
      return;
    }
    if (!fitnessLevel) {
      Alert.alert('Required', 'Please select your fitness level.');
      return;
    }

    try {
      const repo = new UserProfileRepository();
      await repo.create({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        age: age ? Number(age) : null,
        gender,
        height_cm: height ? Number(height) : null,
        weight_kg: weight ? Number(weight) : null,
        goal,
        fitness_level: fitnessLevel,
        training_days: trainingDays,
        session_duration: sessionDuration,
        equipment,
      });
      onDone();
    } catch (e) {
      console.error('Failed to create profile:', e);
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.progressDot, step >= i && styles.progressDotActive]} />
      ))}
    </View>
  );

  if (step === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.welcomeCenter}>
          <Text style={styles.welcomeIcon}>🏋️</Text>
          <Text style={styles.welcomeTitle}>Welcome to{'\n'}Fitness Tracker</Text>
          <Text style={styles.welcomeSubtitle}>Let's create your profile to personalize your experience</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(1)}>
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <Icon name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 1) {
    return (
      <ScrollView style={styles.container}>
        {renderProgressBar()}
        <Text style={styles.stepTitle}>Personal Information</Text>
        <Text style={styles.stepSubtitle}>Tell us about yourself</Text>

        <View style={styles.field}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="e.g. Hamza" placeholderTextColor="#9CA3AF" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Optional" placeholderTextColor="#9CA3AF" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Age</Text>
          <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="e.g. 25" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.optionRow}>
            {['male', 'female', 'other'].map((g) => (
              <TouchableOpacity key={g} style={[styles.genderBtn, gender === g && styles.genderBtnActive]} onPress={() => setGender(g)}>
                <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput style={styles.input} value={height} onChangeText={setHeight} placeholder="e.g. 180" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="e.g. 75" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Icon name="arrow-back" size={20} color="#6B7280" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
            <Text style={styles.primaryBtnText}>Next</Text>
            <Icon name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.spacer} />
      </ScrollView>
    );
  }

  if (step === 2) {
    return (
      <ScrollView style={styles.container}>
        {renderProgressBar()}
        <Text style={styles.stepTitle}>Your Goal</Text>
        <Text style={styles.stepSubtitle}>What do you want to achieve?</Text>

        <View style={styles.optionGrid}>
          {GOALS.map((g) => (
            <TouchableOpacity key={g.value} style={[styles.goalCard, goal === g.value && styles.goalCardActive]} onPress={() => setGoal(g.value)}>
              <Text style={styles.goalIcon}>{g.icon}</Text>
              <Text style={[styles.goalLabel, goal === g.value && styles.goalLabelActive]}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Icon name="arrow-back" size={20} color="#6B7280" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
            <Text style={styles.primaryBtnText}>Next</Text>
            <Icon name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.spacer} />
      </ScrollView>
    );
  }

  if (step === 3) {
    return (
      <ScrollView style={styles.container}>
        {renderProgressBar()}
        <Text style={styles.stepTitle}>Experience Level</Text>
        <Text style={styles.stepSubtitle}>How experienced are you with training?</Text>

        <View style={styles.levelList}>
          {LEVELS.map((l) => (
            <TouchableOpacity key={l.value} style={[styles.levelCard, fitnessLevel === l.value && styles.levelCardActive]} onPress={() => setFitnessLevel(l.value)}>
              <Text style={[styles.levelLabel, fitnessLevel === l.value && styles.levelLabelActive]}>{l.label}</Text>
              <Text style={styles.levelDesc}>{l.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Icon name="arrow-back" size={20} color="#6B7280" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
            <Text style={styles.primaryBtnText}>Next</Text>
            <Icon name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.spacer} />
      </ScrollView>
    );
  }

  if (step === 4) {
    return (
      <ScrollView style={styles.container}>
        {renderProgressBar()}
        <Text style={styles.stepTitle}>Training Preferences</Text>
        <Text style={styles.stepSubtitle}>How do you like to train?</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Training Days per Week</Text>
          <View style={styles.daysRow}>
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <TouchableOpacity key={d} style={[styles.dayBtn, trainingDays === d && styles.dayBtnActive]} onPress={() => setTrainingDays(d)}>
                <Text style={[styles.dayBtnText, trainingDays === d && styles.dayBtnTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Session Duration</Text>
          <View style={styles.durationGrid}>
            {DURATIONS.map((d) => (
              <TouchableOpacity key={d} style={[styles.durationBtn, sessionDuration === d && styles.durationBtnActive]} onPress={() => setSessionDuration(d)}>
                <Text style={[styles.durationBtnText, sessionDuration === d && styles.durationBtnTextActive]}>{d} min</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Available Equipment</Text>
          <View style={styles.optionGrid}>
            {EQUIPMENT_OPTIONS.map((e) => (
              <TouchableOpacity key={e.value} style={[styles.goalCard, equipment === e.value && styles.goalCardActive]} onPress={() => setEquipment(e.value)}>
                <Text style={styles.goalIcon}>{e.icon}</Text>
                <Text style={[styles.goalLabel, equipment === e.value && styles.goalLabelActive]}>{e.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Icon name="arrow-back" size={20} color="#6B7280" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate}>
            <Text style={styles.primaryBtnText}>Create Profile</Text>
            <Icon name="check" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.spacer} />
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  welcomeCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  welcomeIcon: { fontSize: 64, marginBottom: 24 },
  welcomeTitle: { fontSize: 32, fontWeight: '800', color: '#1F2937', textAlign: 'center', lineHeight: 40 },
  welcomeSubtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 12, marginBottom: 40, lineHeight: 22 },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24, marginTop: 8 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  progressDotActive: { backgroundColor: '#2563EB' },
  stepTitle: { fontSize: 28, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
  stepSubtitle: { fontSize: 16, color: '#6B7280', marginBottom: 24 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, fontSize: 16, color: '#1F2937', borderWidth: 1, borderColor: '#E5E7EB' },
  optionRow: { flexDirection: 'row', gap: 8 },
  genderBtn: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  genderBtnActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  genderBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  genderBtnTextActive: { color: '#2563EB' },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB' },
  goalCardActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  goalIcon: { fontSize: 28, marginBottom: 8 },
  goalLabel: { fontSize: 14, fontWeight: '600', color: '#4B5563', textAlign: 'center' },
  goalLabelActive: { color: '#2563EB' },
  levelList: { gap: 10 },
  levelCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#E5E7EB' },
  levelCardActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  levelLabel: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  levelLabelActive: { color: '#2563EB' },
  levelDesc: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  daysRow: { flexDirection: 'row', gap: 8 },
  dayBtn: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  dayBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  dayBtnText: { fontSize: 16, fontWeight: '700', color: '#6B7280' },
  dayBtnTextActive: { color: '#FFFFFF' },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durationBtn: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  durationBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  durationBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  durationBtnTextActive: { color: '#FFFFFF' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 4 },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, gap: 8 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  spacer: { height: 40 },
});
