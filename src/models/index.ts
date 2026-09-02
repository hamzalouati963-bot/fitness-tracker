export interface Profile {
  id?: number;
  name: string;
  age: number | null;
  sex: 'male' | 'female' | 'other';
  height_cm: number;
  current_weight_kg: number;
  activity_level: ActivityLevel;
  fitness_goal: FitnessGoal;
  preferred_workout_days: string;
  created_at: string;
  updated_at: string;
}

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
export type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'general_fitness' | 'strength' | 'endurance';

export interface NutritionTargets {
  id?: number;
  calories_kcal: number;
  protein_g: number;
  carbohydrates_g: number;
  fat_g: number;
  hydration_liters: number;
}

export interface NotificationSettings {
  workout_reminder: { enabled: boolean; time: string };
  hydration_reminder: { enabled: boolean; interval_minutes: number };
  meal_logging_reminder: { enabled: boolean; time: string };
  measurement_reminder: { enabled: boolean; interval_days: number };
  weekly_review_reminder: { enabled: boolean; day: string; time: string };
}

/** Mise a jour partielle : chaque sous-champ est optionnel (merge, pas d'ecrasement). */
export interface NotificationSettingsUpdate {
  workout_reminder?: { enabled?: boolean; time?: string };
  hydration_reminder?: { enabled?: boolean; interval_minutes?: number };
  meal_logging_reminder?: { enabled?: boolean; time?: string };
  measurement_reminder?: { enabled?: boolean; interval_days?: number };
  weekly_review_reminder?: { enabled?: boolean; day?: string; time?: string };
}

export interface AppAppearance {
  theme: 'light' | 'dark' | 'system';
  unit_system: 'metric' | 'imperial';
}

export interface WorkoutSession {
  id?: number;
  date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  program_id: string | null;
  program_name: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id?: number;
  session_id: number;
  exercise_id: string;
  exercise_name: string;
  order_index: number;
  notes: string;
  created_at: string;
}

export interface WorkoutSet {
  id?: number;
  exercise_id: number;
  set_number: number;
  weight_kg: number;
  reps: number;
  completed: boolean;
  rpe?: number;
  created_at: string;
}

export interface Meal {
  id?: number;
  date: string;
  meal_type: MealType;
  name: string;
  notes: string;
  created_at: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealItem {
  id?: number;
  meal_id: number;
  food_id: string;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
}

export interface FoodEntry {
  id?: number;
  date: string;
  food_id: string;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal_type?: MealType;
  created_at: string;
}

export interface BodyMeasurement {
  id?: number;
  date: string;
  weight_kg: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  body_fat_percent: number | null;
  muscle_mass_kg: number | null;
  bmi: number | null;
  water_percent: number | null;
  visceral_fat: number | null;
  phase_angle: number | null;
  source: string;
  notes: string;
  created_at: string;
}

export interface Goal {
  id?: number;
  goal_type: GoalType;
  name: string;
  start_value: number;
  target_value: number;
  current_value: number | null;
  unit: string;
  start_date: string;
  target_date: string | null;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type GoalType = 'weight' | 'body_measurement' | 'workouts_per_week' | 'workout_consistency' | 'hydration' | 'nutrition_tracking' | 'exercise_performance' | 'custom';

export interface DailyLog {
  id?: number;
  date: string;
  weight_kg: number | null;
  water_liters: number | null;
  sleep_hours: number | null;
  steps: number | null;
  workout_completed: boolean;
  nutrition_logged: boolean;
  mood: number | null;
  notes: string;
  created_at: string;
}

export interface HydrationEntry {
  id?: number;
  date: string;
  time: string;
  amount_liters: number;
  source: string;
  created_at: string;
}

export interface Recommendation {
  id?: number;
  rule_id: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  icon: string;
  created_at: string;
  dismissed: boolean;
}

export interface CustomFood {
  id?: number;
  name: string;
  serving_size: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
}

export interface CustomWorkout {
  id?: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CustomWorkoutExercise {
  id?: number;
  custom_workout_id: number;
  exercise_id: string;
  exercise_name: string;
  order_index: number;
  sets: number;
  reps: number;
  weight_kg: number;
  rest_seconds: number;
  notes: string;
}

export type UserGoal = 'lose_weight' | 'build_muscle' | 'maintain_weight' | 'improve_fitness' | 'increase_strength' | 'improve_endurance';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'no_equipment' | 'dumbbells' | 'barbell' | 'machines' | 'resistance_bands' | 'full_gym';

export interface UserProfile {
  id?: number;
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string;
  height_cm: number | null;
  weight_kg: number | null;
  goal: UserGoal;
  fitness_level: FitnessLevel;
  training_days: number | null;
  session_duration: number | null;
  equipment: Equipment;
  created_at: string;
  updated_at: string;
}
