import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { hashPin, isValidPin } from '../utils/crypto';

interface LockScreenProps {
  pinHash: string;
  pinSalt: string;
  pinLength: number | null;
  onUnlock: () => void;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export default function LockScreen({ pinHash, pinSalt, pinLength, onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const expectedLength = pinLength || 4;

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining > 0]);

  const verify = useCallback(
    (candidate: string) => {
      if (lockoutRemaining > 0) return;
      if (!isValidPin(candidate)) return;
      try {
        if (hashPin(candidate, pinSalt) === pinHash) {
          setPin('');
          setFailedAttempts(0);
          onUnlock();
        } else {
          setError(true);
          const attempts = failedAttempts + 1;
          setFailedAttempts(attempts);
          setTimeout(() => setError(false), 500);
          if (attempts >= MAX_ATTEMPTS) {
            setLockoutRemaining(LOCKOUT_SECONDS);
            setFailedAttempts(0);
          }
          setPin('');
          if (attempts < MAX_ATTEMPTS) {
            Alert.alert('Wrong PIN', `${MAX_ATTEMPTS - attempts} attempt(s) left before temporary lock.`);
          }
        }
      } catch (e) {
        console.error('PIN verification failed:', e);
        setPin('');
      }
    },
    [lockoutRemaining, pinSalt, pinHash, onUnlock, failedAttempts]
  );

  const pressDigit = useCallback(
    (digit: string) => {
      if (lockoutRemaining > 0) return;
      if (pin.length >= expectedLength) return;
      const next = pin + digit;
      setPin(next);
      if (next.length === expectedLength) {
        setTimeout(() => verify(next), 120);
      }
    },
    [pin, expectedLength, lockoutRemaining, verify]
  );

  const pressBackspace = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
  }, []);

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🏋️</Text>
      <Text style={styles.title}>Fitness Tracker</Text>
      <Text style={styles.subtitle}>Enter your PIN to unlock</Text>

      <View style={[styles.dots, error && styles.dotsError]}>
        {Array.from({ length: expectedLength }).map((_, i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled, error && styles.dotError]} />
        ))}
      </View>

      {lockoutRemaining > 0 ? (
        <Text style={styles.lockout}>Too many attempts. Retry in {lockoutRemaining}s.</Text>
      ) : (
        <View style={styles.keypad}>
          {KEYS.map((key, index) =>
            key === '' ? (
              <View key={`empty-${index}`} style={styles.key} />
            ) : key === 'back' ? (
              <TouchableOpacity key={`back-${index}`} style={styles.key} onPress={pressBackspace} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="backspace-outline" size={28} color="#6B7280" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity key={key} style={styles.key} onPress={() => pressDigit(key)}>
                <Text style={styles.keyText}>{key}</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      )}

      <Text style={styles.offlineNote}>🔒 Your PIN never leaves this device</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 8, marginBottom: 28 },
  dots: { flexDirection: 'row', gap: 14, marginBottom: 32 },
  dotsError: {},
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  dotFilled: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  dotError: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, width: 260 },
  key: {
    width: 76,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 24, fontWeight: '600', color: '#1F2937' },
  lockout: { fontSize: 14, color: '#EF4444', fontWeight: '600', height: 260, textAlignVertical: 'center' },
  offlineNote: { fontSize: 12, color: '#9CA3AF', marginTop: 24 },
});
