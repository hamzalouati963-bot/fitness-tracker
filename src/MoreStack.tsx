import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import GoalsScreen from './screens/GoalsScreen';
import CalculatorsScreen from './screens/CalculatorsScreen';
import JournalScreen from './screens/JournalScreen';
import SettingsScreen from './screens/SettingsScreen';
import HydrationScreen from './screens/HydrationScreen';
import MeasurementsScreen from './screens/MeasurementsScreen';
import ExerciseLibraryScreen from './screens/ExerciseLibraryScreen';
import WorkoutHistoryScreen from './screens/WorkoutHistoryScreen';
import FoodSearchScreen from './screens/FoodSearchScreen';
import ProgramsScreen from './screens/ProgramsScreen';
import RecommendationScreen from './screens/RecommendationScreen';
import WeeklyReviewScreen from './screens/WeeklyReviewScreen';
import CustomWorkoutsScreen from './screens/CustomWorkoutsScreen';
import CreateCustomWorkoutScreen from './screens/CreateCustomWorkoutScreen';
import ExercisePickerScreen from './screens/ExercisePickerScreen';

const Stack = createStackNavigator();

const menuItems = [
  { id: 'goals', label: 'Goals', icon: 'flag', screen: 'Goals', color: '#2563EB' },
  { id: 'calculators', label: 'Calculators', icon: 'calculate', screen: 'Calculators', color: '#059669' },
  { id: 'journal', label: 'Journal', icon: 'edit', screen: 'Journal', color: '#7C3AED' },
  { id: 'settings', label: 'Settings', icon: 'settings', screen: 'Settings', color: '#6B7280' },
  { id: 'hydration', label: 'Hydration', icon: 'water', screen: 'Hydration', color: '#06B6D4' },
  { id: 'measurements', label: 'Measurements', icon: 'measure', screen: 'Measurements', color: '#D97706' },
  { id: 'exercises', label: 'Exercises', icon: 'fitness-center', screen: 'Exercises', color: '#DC2626' },
  { id: 'programs', label: 'Programs', icon: 'sports', screen: 'Programs', color: '#0891B2' },
  { id: 'custom_workouts', label: 'My Workouts', icon: 'create', screen: 'CustomWorkouts', color: '#8B5CF6' },
  { id: 'history', label: 'Workout History', icon: 'history', screen: 'WorkoutHistory', color: '#65A30D' },
  { id: 'foods', label: 'Food Database', icon: 'restaurant', screen: 'FoodSearch', color: '#CA8A04' },
  { id: 'suggestions', label: 'Suggestions', icon: 'lightbulb', screen: 'Recommendations', color: '#F59E0B' },
  { id: 'weekly', label: 'Weekly Review', icon: 'assessment', screen: 'WeeklyReview', color: '#7C3AED' },
];

export default function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: '#F9FAFB',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#1F2937',
        },
        headerBackTitleVisible: false,
        headerTintColor: '#2563EB',
        cardStyle: {
          backgroundColor: '#F9FAFB',
        },
      }}
    >
      <Stack.Screen name="MoreHome" component={MoreHomeScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="Calculators" component={CalculatorsScreen} />
      <Stack.Screen name="Journal" component={JournalScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Hydration" component={HydrationScreen} />
      <Stack.Screen name="Measurements" component={MeasurementsScreen} />
      <Stack.Screen name="Exercises" component={ExerciseLibraryScreen} />
      <Stack.Screen name="Programs" component={ProgramsScreen} />
      <Stack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} />
      <Stack.Screen name="FoodSearch" component={FoodSearchScreen} />
      <Stack.Screen name="Recommendations" component={RecommendationScreen} />
      <Stack.Screen name="WeeklyReview" component={WeeklyReviewScreen} />
      <Stack.Screen name="CustomWorkouts" component={CustomWorkoutsScreen} />
      <Stack.Screen name="CreateCustomWorkout" component={CreateCustomWorkoutScreen} />
      <Stack.Screen name="ExercisePicker" component={ExercisePickerScreen} />
    </Stack.Navigator>
  );
}

function MoreHomeScreen({ navigation }: { navigation: any }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>More Options</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TRACKING</Text>
        <View style={styles.menuGrid}>
          {menuItems.filter(item => ['goals', 'measurements', 'hydration'].includes(item.id)).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Icon name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PLANNING</Text>
        <View style={styles.menuGrid}>
          {menuItems.filter(item => ['programs', 'custom_workouts', 'exercises', 'journal', 'history'].includes(item.id)).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Icon name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ANALYTICS & CONFIG</Text>
        <View style={styles.menuGrid}>
          {menuItems.filter(item => ['calculators', 'foods', 'suggestions', 'weekly', 'settings'].includes(item.id)).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Icon name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.waterfall}>
        <View style={styles.separator} />
        <View style={styles.waterfallLabel}>
          <Text style={styles.waterfallText}>INFORMATION</Text>
        </View>
        <View style={styles.waterfallRow}>
          <Text style={styles.waterfallInfo}>All data stored locally. No cloud, no tracking.</Text>
        </View>
        <View style={styles.waterfallRow}>
          <Text style={styles.waterfallInfo}>Version 1.0.0 • Personal use only</Text>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 4,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  menuCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  waterfall: {
    marginHorizontal: 16,
    paddingTop: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  waterfallLabel: {
    marginBottom: 8,
  },
  waterfallText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  waterfallRow: {
    marginBottom: 6,
  },
  waterfallInfo: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 20,
  },
});

export { MoreStack };
