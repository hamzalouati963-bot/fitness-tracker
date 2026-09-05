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
import OnboardingScreen from './screens/OnboardingScreen';
import { getDatabase } from './database';
import { userProfileRepo } from './database/repositories';

const Tab = createBottomTabNavigator<TabParamList>();

export default function App() {
  const [ready, setReady] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await getDatabase();
        const profile = await userProfileRepo.get();
        setHasProfile(!!profile);
        setReady(true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const stack = e instanceof Error && e.stack ? e.stack : '';
        console.error('DB init failed', e);
        setError(`Database initialization failed\n\n${msg}\n\n${stack}`.slice(0, 1000));
      }
    })();
  }, []);

  const handleOnboardingDone = useCallback(() => {
    setHasProfile(true);
  }, []);

  if (error) {
    return (
      <ScrollView contentContainerStyle={styles.center}>
        <Icon name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Erreur de base de données</Text>
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

  if (hasProfile === false) {
    return <OnboardingScreen onDone={handleOnboardingDone} />;
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
        <Tab.Screen name="More" component={MoreStack} />
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
