import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { accountRepo, userProfileRepo, settingsRepo } from '../database/repositories';
import { sessionManager } from '../utils/session';
import { hashPassword, generateSalt, isValidPassword, isValidEmail } from '../utils/crypto';

interface RegisterScreenProps {
  onRegister: () => void;
  onGoToLogin: () => void;
}

export default function RegisterScreen({ onRegister, onGoToLogin }: RegisterScreenProps) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  const handleRegister = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = displayName.trim();

    if (!trimmedEmail) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!password) {
      Alert.alert('Required', 'Please enter a password.');
      return;
    }
    if (!isValidPassword(password)) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'The two passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const exists = await accountRepo.emailExists(trimmedEmail);
      if (exists) {
        Alert.alert('Email Taken', 'An account with this email already exists. Please sign in instead.');
        return;
      }

      const salt = generateSalt();
      const passwordHash = hashPassword(password, salt);

      const accountId = await accountRepo.createAccount(
        trimmedEmail,
        passwordHash,
        salt,
        trimmedName || trimmedEmail.split('@')[0]
      );

      // Create default user profile for this account
      await userProfileRepo.create({
        user_id: accountId,
        first_name: trimmedName || trimmedEmail.split('@')[0],
        last_name: '',
        age: null,
        gender: 'male',
        height_cm: 182,
        weight_kg: 75,
        goal: 'improve_fitness',
        fitness_level: 'beginner',
        training_days: 3,
        session_duration: 45,
        equipment: 'no_equipment',
      });

      // Create default app_settings for this account
      const db = (await import('../database')).getDatabase();
      const database = await db;
      await database.runAsync(
        `INSERT INTO app_settings (user_id, nutrition_calories, nutrition_protein, nutrition_carbs, nutrition_fat, nutrition_hydration,
          notification_workout_enabled, notification_workout_time,
          notification_hydration_enabled, notification_hydration_interval,
          notification_meal_enabled, notification_meal_time,
          notification_measurement_enabled, notification_measurement_interval,
          notification_weekly_enabled, notification_weekly_day, notification_weekly_time,
          theme, unit_system)
         VALUES (?, 2200, 150, 250, 70, 2.5, 1, '08:00', 1, 60, 1, '12:00', 0, 7, 1, 'sunday', '20:00', 'system', 'metric')`,
        [accountId]
      );

      await accountRepo.updateLastLogin(accountId);
      await sessionManager.persistSession(accountId);

      onRegister();
    } catch (e) {
      console.error('Registration failed:', e);
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🏋️</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start tracking your fitness journey</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Optional — shown as your name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={secureEntry}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setSecureEntry(!secureEntry)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name={secureEntry ? 'visibility-off' : 'visibility'} size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={secureConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setSecureConfirm(!secureConfirm)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name={secureConfirm ? 'visibility-off' : 'visibility'} size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkBtn} onPress={onGoToLogin}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkBold}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.offlineNote}>🔒 All data stays on this device — no cloud sync</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#1F2937' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 8 },
  form: { gap: 14 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginLeft: 4 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 8 },
  primaryBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  linkBtn: { alignItems: 'center', padding: 12 },
  linkText: { fontSize: 14, color: '#6B7280' },
  linkBold: { color: '#2563EB', fontWeight: '600' },
  offlineNote: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 24 },
});
