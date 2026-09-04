import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { userProfileRepo } from '../database/repositories';
import type { UserProfile, UserGoal, FitnessLevel, Equipment } from '../models';
import type { MoreScreenProps } from '../navigation/types';

const GOALS: { value: UserGoal; label: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'build_muscle', label: 'Build Muscle' },
  { value: 'maintain_weight', label: 'Maintain Weight' },
  { value: 'improve_fitness', label: 'Improve Fitness' },
  { value: 'increase_strength', label: 'Increase Strength' },
  { value: 'improve_endurance', label: 'Improve Endurance' },
];

const LEVELS: { value: FitnessLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: 'no_equipment', label: 'No Equipment' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'machines', label: 'Machines' },
  { value: 'resistance_bands', label: 'Resistance Bands' },
  { value: 'full_gym', label: 'Full Gym' },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

export default function ProfileScreen({ navigation }: MoreScreenProps<'Profile'>) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<UserGoal>('improve_fitness');
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>('beginner');
  const [trainingDays, setTrainingDays] = useState(3);
  const [sessionDuration, setSessionDuration] = useState(45);
  const [equipment, setEquipment] = useState<Equipment>('no_equipment');

  const loadProfile = useCallback(async () => {
    try {
      const p = await userProfileRepo.get();
      if (p) {
        setProfile(p);
        setFirstName(p.first_name);
        setLastName(p.last_name);
        setAge(p.age ? String(p.age) : '');
        setGender(p.gender);
        setHeight(p.height_cm ? String(p.height_cm) : '');
        setWeight(p.weight_kg ? String(p.weight_kg) : '');
        setGoal(p.goal);
        setFitnessLevel(p.fitness_level);
        setTrainingDays(p.training_days || 3);
        setSessionDuration(p.session_duration || 45);
        setEquipment(p.equipment);
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Required', 'First name is required.');
      return;
    }
    if (age && (isNaN(Number(age)) || Number(age) < 10 || Number(age) > 120)) {
      Alert.alert('Invalid Age', 'Age must be between 10 and 120.');
      return;
    }
    if (height && (isNaN(Number(height)) || Number(height) < 50 || Number(height) > 300)) {
      Alert.alert('Invalid Height', 'Height must be between 50 and 300 cm.');
      return;
    }
    if (weight && (isNaN(Number(weight)) || Number(weight) < 20 || Number(weight) > 500)) {
      Alert.alert('Invalid Weight', 'Weight must be between 20 and 500 kg.');
      return;
    }
    if (!profile?.id) return;

    try {
      await userProfileRepo.update(profile.id, {
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
      setEditing(false);
      loadProfile();
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (e) {
      console.error('Failed to save profile:', e);
      Alert.alert('Error', 'Failed to save profile.');
    }
  };

  const getGoalLabel = (v: UserGoal) => GOALS.find(g => g.value === v)?.label || v;
  const getLevelLabel = (v: FitnessLevel) => LEVELS.find(l => l.value === v)?.label || v;
  const getEquipmentLabel = (v: Equipment) => EQUIPMENT_OPTIONS.find(e => e.value === v)?.label || v;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Icon name="person-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>Profile not found</Text>
        <Text style={styles.emptyText}>Please complete onboarding to set up your profile.</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.emptyBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (editing) {
    return (
      <ScrollView style={styles.container} keyboardDismissMode="on-drag">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setEditing(false); loadProfile(); }}>
            <Icon name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>First Name</Text>
          <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="e.g. Hamza" placeholderTextColor="#9CA3AF" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="e.g. Louati" placeholderTextColor="#9CA3AF" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Age</Text>
          <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="e.g. 25" placeholderTextColor="#9CA3AF" />
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
          <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="e.g. 175" placeholderTextColor="#9CA3AF" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="e.g. 75" placeholderTextColor="#9CA3AF" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Goal</Text>
          <View style={styles.optionGrid}>
            {GOALS.map((g) => (
              <TouchableOpacity key={g.value} style={[styles.selectBtn, goal === g.value && styles.selectBtnActive]} onPress={() => setGoal(g.value)}>
                <Text style={[styles.selectBtnText, goal === g.value && styles.selectBtnTextActive]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Fitness Level</Text>
          <View style={styles.optionRow}>
            {LEVELS.map((l) => (
              <TouchableOpacity key={l.value} style={[styles.selectBtn, fitnessLevel === l.value && styles.selectBtnActive]} onPress={() => setFitnessLevel(l.value)}>
                <Text style={[styles.selectBtnText, fitnessLevel === l.value && styles.selectBtnTextActive]}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Training Days/Week</Text>
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
          <Text style={styles.label}>Equipment</Text>
          <View style={styles.optionGrid}>
            {EQUIPMENT_OPTIONS.map((e) => (
              <TouchableOpacity key={e.value} style={[styles.selectBtn, equipment === e.value && styles.selectBtnActive]} onPress={() => setEquipment(e.value)}>
                <Text style={[styles.selectBtnText, equipment === e.value && styles.selectBtnTextActive]}>{e.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardDismissMode="on-drag">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => setEditing(true)}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {profile && (
        <>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.first_name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.userName}>{profile.first_name} {profile.last_name}</Text>
          </View>

          <View style={styles.card}>
            <InfoRow label="Age" value={profile.age ? `${profile.age} years` : 'Not set'} />
            <InfoRow label="Gender" value={profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)} />
            <InfoRow label="Height" value={profile.height_cm ? `${profile.height_cm} cm` : 'Not set'} />
            <InfoRow label="Weight" value={profile.weight_kg ? `${profile.weight_kg} kg` : 'Not set'} />
          </View>

          <View style={styles.card}>
            <InfoRow label="Goal" value={getGoalLabel(profile.goal)} />
            <InfoRow label="Level" value={getLevelLabel(profile.fitness_level)} />
            <InfoRow label="Training" value={`${profile.training_days || 3} days/week`} />
            <InfoRow label="Session" value={`${profile.session_duration || 45} min`} />
            <InfoRow label="Equipment" value={getEquipmentLabel(profile.equipment)} last />
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
            <Icon name="edit" size={20} color="#FFFFFF" />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  editText: { fontSize: 16, fontWeight: '600', color: '#2563EB' },
  saveText: { fontSize: 16, fontWeight: '600', color: '#2563EB' },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  userName: { fontSize: 22, fontWeight: '700', color: '#1F2937' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, marginHorizontal: 16, marginBottom: 16, padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', borderRadius: 12, padding: 14, marginHorizontal: 16, gap: 8 },
  editBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  field: { marginHorizontal: 16, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, fontSize: 16, color: '#1F2937', borderWidth: 1, borderColor: '#E5E7EB' },
  optionRow: { flexDirection: 'row', gap: 8 },
  genderBtn: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  genderBtnActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  genderBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  genderBtnTextActive: { color: '#2563EB' },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectBtn: { backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  selectBtnActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  selectBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  selectBtnTextActive: { color: '#2563EB' },
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
  spacer: { height: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  emptyBtn: { marginTop: 20, backgroundColor: '#2563EB', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
