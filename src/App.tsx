import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import type { TabParamList } from './navigation/types';

import DashboardScreen from './screens/DashboardScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import NutritionScreen from './screens/NutritionScreen';
import ProgressScreen from './screens/ProgressScreen';
import MoreStack from './MoreStack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LockScreen from './screens/LockScreen';
import { getDatabase } from './database';
import { accountRepo, userProfileRepo, securityRepo, type SecurityInfo } from './database/repositories';
import { sessionManager } from './utils/session';

const Tab = createBottomTabNavigator<TabParamList>();

type AuthView = 'login' | 'register';

export default function App() {
  const [ready, setReady] = useState(false);
  const [authView, setAuthView] = useState<AuthView | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [security, setSecurity] = useState<SecurityInfo | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // PHASE A — DATABASE BOOTSTRAP (no user required)
        await getDatabase();

        // PHASE B — USER SESSION INITIALIZATION
        const activeUserId = await sessionManager.restoreSession();

        if (activeUserId) {
          const account = await accountRepo.getAccountById(activeUserId);
          if (account) {
            // Session valid — load user-dependent data
            const sec = await securityRepo.getSecurity();
            setSecurity(sec);
            setAuthView(null);

            const profile = await userProfileRepo.get();
            setHasProfile(!!profile);
          } else {
            // Account was deleted — clear session, show auth
            await sessionManager.clearSession();
            setHasProfile(null);
            const accountCount = await accountRepo.getAccountCount();
            setAuthView(accountCount > 0 ? 'login' : 'register');
          }
        } else {
          // No session — show auth, do NOT query user data
          setHasProfile(null);
          const accountCount = await accountRepo.getAccountCount();
          setAuthView(accountCount > 0 ? 'login' : 'register');
        }

        setReady(true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const stack = e instanceof Error && e.stack ? e.stack : '';
        console.error('App init failed', e);
        setError(`Initialization failed\n\n${msg}\n\n${stack}`.slice(0, 1000));
      }
    })();
  }, []);

  const handleAuthDone = useCallback(() => {
    setAuthView(null);
    (async () => {
      try {
        const profile = await userProfileRepo.get();
        setHasProfile(!!profile);
        const sec = await securityRepo.getSecurity();
        setSecurity(sec);
      } catch (e) {
        console.error('Post-auth refresh failed:', e);
      }
    })();
  }, []);

  const handleOnboardingDone = useCallback(() => {
    setHasProfile(true);
  }, []);

  const handleLogout = useCallback(async () => {
    await sessionManager.clearSession();
    setSecurity(null);
    setUnlocked(false);
    setHasProfile(null);
    const accountCount = await accountRepo.getAccountCount();
    setAuthView(accountCount > 0 ? 'login' : 'register');
  }, []);

  if (error) {
    return (
      <ScrollView contentContainerStyle={styles.center}>
        <Icon name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Erreur de base de donnees</Text>
        <Text style={styles.errorText} selectable>{error}</Text>
      </ScrollView>
    );
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (authView === 'login') {
    return (
      <LoginScreen
        onLogin={handleAuthDone}
        onGoToRegister={() => setAuthView('register')}
      />
    );
  }

  if (authView === 'register') {
    return (
      <RegisterScreen
        onRegister={handleAuthDone}
        onGoToLogin={() => setAuthView('login')}
      />
    );
  }

  if (hasProfile === false) {
    return <OnboardingScreen onDone={handleOnboardingDone} />;
  }

  if (security && !unlocked) {
    return (
      <LockScreen
        pinHash={security.pin_hash!}
        pinSalt={security.pin_salt!}
        pinLength={security.pin_length}
        onUnlock={() => setUnlocked(true)}
      />
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let icon: React.ReactNode;

            if (route.name === 'Home') {
              icon = <Text style={{ fontSize: size, color }}>🏠</Text>;
            } else if (route.name === 'Workout') {
              icon = <Text style={{ fontSize: size, color }}>🏋️</Text>;
            } else if (route.name === 'Nutrition') {
              icon = <Text style={{ fontSize: size, color }}>🍽️</Text>;
            } else if (route.name === 'Progress') {
              icon = <Text style={{ fontSize: size, color }}>📊</Text>;
            } else {
              icon = <Text style={{ fontSize: size, color }}>📱</Text>;
            }

            return icon;
          },
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#9CA3AF',
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 10,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            height: 60,
          },
        })}
      >
        <Tab.Screen name="Home" component={DashboardScreen} />
        <Tab.Screen name="Workout" component={WorkoutScreen} />
        <Tab.Screen name="Nutrition" component={NutritionScreen} />
        <Tab.Screen name="Progress" component={ProgressScreen} />
        <Tab.Screen name="More">
          {() => <MoreStack onLogout={handleLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
