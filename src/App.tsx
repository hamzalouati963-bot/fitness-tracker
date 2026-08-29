import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator, TabBarIconProps } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import DashboardScreen from './screens/DashboardScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import NutritionScreen from './screens/NutritionScreen';
import ProgressScreen from './screens/ProgressScreen';
import MoreStack from './MoreStack';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }: { route: { name: string } }) => ({
          tabBarIcon: ({ color, size }: TabBarIconProps) => {
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
