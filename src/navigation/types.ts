import type { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { StackScreenProps } from '@react-navigation/stack';

// ─── Tab Navigator (App.tsx) ───────────────────────────────────────────────

export type TabParamList = {
  Home: undefined;
  Workout: { sessionId?: number } | undefined;
  Nutrition: undefined;
  Progress: undefined;
  More: NavigatorScreenParams<MoreStackParamList>;
};

// ─── More Stack Navigator (MoreStack.tsx) ──────────────────────────────────

export type MoreStackParamList = {
  MoreHome: undefined;
  Profile: undefined;
  Goals: undefined;
  Calculators: undefined;
  Journal: undefined;
  Settings: undefined;
  Hydration: undefined;
  Measurements: undefined;
  Exercises: undefined;
  Programs: undefined;
  CustomWorkouts: undefined;
  CreateCustomWorkout: { workoutId?: number } | undefined;
  ExercisePicker: undefined;
  WorkoutHistory: undefined;
  FoodSearch: undefined;
  CustomFoods: undefined;
  Recommendations: undefined;
  WeeklyReview: undefined;
};

// ─── Screen Props Helpers ──────────────────────────────────────────────────

export type TabScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<
  TabParamList,
  T
>;

export type MoreScreenProps<T extends keyof MoreStackParamList> = CompositeScreenProps<
  StackScreenProps<MoreStackParamList, T>,
  BottomTabScreenProps<TabParamList, 'More'>
>;

export type RootTabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  StackScreenProps<MoreStackParamList>
>;
