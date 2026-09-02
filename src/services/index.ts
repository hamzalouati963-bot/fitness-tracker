import {
  WorkoutRepository,
  NutritionRepository,
  MeasurementRepository,
  GoalRepository,
  DailyLogRepository,
  HydrationRepository,
  SettingsRepository,
  CustomWorkoutRepository,
  UserProfileRepository,
} from '../database/repositories';
import { getDatabase } from '../database';
import { validateBackup } from '../utils/backup';
import type { Recommendation } from '../models';
import exercisesData from '../data/exercises.json';
import workoutProgramsData from '../data/workout_programs.json';
import foodsData from '../data/foods.json';
import recommendationRulesData from '../data/recommendation_rules.json';
import { todayLocal, formatDateLocal, dateDaysAgoLocal } from '../utils/dates';

export { todayLocal, formatDateLocal, dateDaysAgoLocal } from '../utils/dates';

export const exercises = exercisesData;
export const workoutPrograms = workoutProgramsData;
export const foods = foodsData;
export const recommendationRules = recommendationRulesData.recommendation_rules;

export type Food = (typeof foodsData)[number];
export type Exercise = (typeof exercisesData)[number];
export type WorkoutProgram = (typeof workoutProgramsData)[number];

// Calculs purs extraits (testables en Node) : src/services/calculator.ts
export { CalculatorService } from './calculator';

export class ProgressService {
  constructor(
    private workoutRepo: WorkoutRepository,
    private nutritionRepo: NutritionRepository,
    private measurementRepo: MeasurementRepository,
    private dailyLogRepo: DailyLogRepository
  ) {}

  async getWeightHistory(days: number): Promise<{ date: string; weight: number | null }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const measurements = await this.measurementRepo.getMeasurementsByDateRange(
      formatDateLocal(startDate),
      formatDateLocal(endDate)
    );

    const weightData: { date: string; weight: number | null }[] = measurements.map(m => ({
      date: m.date,
      weight: m.weight_kg,
    }));

    const logs = await this.dailyLogRepo.getLogsByDateRange(
      formatDateLocal(startDate),
      formatDateLocal(endDate)
    );

    const logMap = new Map(weightData.map(w => [w.date, w]));
    logs.forEach(log => {
      if (log.weight_kg !== null && !logMap.has(log.date)) {
        logMap.set(log.date, { date: log.date, weight: log.weight_kg });
      }
    });

    return Array.from(logMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getBodyFatHistory(days: number): Promise<{ date: string; bodyFat: number | null }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const measurements = await this.measurementRepo.getMeasurementsByDateRange(
      formatDateLocal(startDate),
      formatDateLocal(endDate)
    );

    return measurements.map(m => ({
      date: m.date,
      bodyFat: m.body_fat_percent,
    }));
  }

  async getMuscleMassHistory(days: number): Promise<{ date: string; muscleMass: number | null }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const measurements = await this.measurementRepo.getMeasurementsByDateRange(
      formatDateLocal(startDate),
      formatDateLocal(endDate)
    );

    return measurements.map(m => ({
      date: m.date,
      muscleMass: m.muscle_mass_kg,
    }));
  }

  async getWorkoutsPerWeek(weeks: number): Promise<{ weekStart: string; count: number }[]> {
    const results: { weekStart: string; count: number }[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - (i * 7));
      endDate.setHours(0, 0, 0, 0);

      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      const count = await this.workoutRepo.getWeeklySessionCount(
        formatDateLocal(startDate),
        formatDateLocal(endDate)
      );

      results.push({
        weekStart: formatDateLocal(startDate),
        count,
      });
    }
    return results;
  }

  async getAverageCalories(days: number): Promise<number> {
    return this.nutritionRepo.getAverageDailyCalories(days);
  }

  async getWorkoutFrequencyPercentage(weeks: number = 1): Promise<number> {
    const profilesRepo = new SettingsRepository();

    const settings = await profilesRepo.getProfile();
    const preferredDays = settings.preferred_workout_days;

    const weekDays = preferredDays.split('_').length;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7) + 1);
    startDate.setHours(0, 0, 0, 0);

    const actualWorkouts = await this.workoutRepo.getWeeklySessionCount(
      formatDateLocal(startDate),
      formatDateLocal(endDate)
    );

    const expectedWorkouts = weekDays * weeks;
    return expectedWorkouts > 0 ? Math.round((actualWorkouts / expectedWorkouts) * 100) : 0;
  }
}

export class RecommendationService {
  constructor(
    private workoutRepo: WorkoutRepository,
    private nutritionRepo: NutritionRepository,
    private measurementRepo: MeasurementRepository,
    private goalRepo: GoalRepository,
    private dailyLogRepo: DailyLogRepository,
    private hydrationRepo: HydrationRepository,
    private settingsRepo: SettingsRepository
  ) {}

  async generateRecommendations(): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const today = todayLocal();
    const rules = recommendationRules;

    for (const rule of rules) {
      try {
        const result = await this.evaluateRule(rule, today);
        if (result) {
          recommendations.push({
            id: undefined,
            rule_id: rule.id,
            message: result,
            priority: rule.priority as Recommendation['priority'],
            category: rule.category,
            icon: rule.icon,
            created_at: new Date().toISOString(),
            dismissed: false,
          });
        }
      } catch (e) {
        // Skip rules that fail evaluation
      }
    }

    return recommendations;
  }

  private async evaluateRule(rule: (typeof recommendationRules)[number], today: string): Promise<string | null> {
    switch (rule.condition_type) {
      case 'today_workout_not_started':
        return this.checkTodayWorkoutNotStarted(today);

      case 'planned_workouts_not_completed_week':
        return this.checkPlannedWorkoutsNotCompleted(today);

      case 'no_workout_today':
        return this.checkNoWorkoutToday(today);

      case 'previous_performance_available':
        return null;

      case 'hydration_progress_less_than':
        return this.checkHydrationProgress(today);

      case 'hydration_progress_greater_than':
        return this.checkHydrationMet(today);

      case 'meal_not_logged_today':
        return this.checkMealNotLogged(today, rule.condition_value as string);

      case 'calories_progress_less_than':
        return this.checkCaloriesProgress(today);

      case 'calories_progress_greater_than':
        return this.checkCaloriesHigh(today);

      case 'macro_progress_less_than':
        return this.checkMacroProgress(today, rule.macro_type!, rule.condition_value as number);

      case 'no_nutrition_logged_today':
        return this.checkNoNutritionLogged(today);

      case 'always':
        return this.checkAlways(today, rule);

      case 'days_since_last_measurement_greater_than':
        return this.checkDaysSinceMeasurement(today, rule.condition_value as number);

      case 'no_active_goals':
        return this.checkNoActiveGoals();

      case 'goal_progress_less_than':
        return null;

      case 'journal_not_started_today':
        return this.checkJournalNotStarted(today);

      default:
        return null;
    }
  }

  private async checkTodayWorkoutNotStarted(today: string): Promise<string | null> {
    const session = await this.workoutRepo.getTodaysSession();
    if (!session) {
      const profile = await this.settingsRepo.getProfile();
      const workoutDays = profile.preferred_workout_days.split('_');
      const dayIndex = new Date().getDay();
      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const todayName = dayNames[dayIndex];

      if (workoutDays.includes(todayName)) {
        return "You have a workout planned for today. Start it to stay on track.";
      }
    }
    return null;
  }

  private async checkPlannedWorkoutsNotCompleted(today: string): Promise<string | null> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const count = await this.workoutRepo.getWeeklySessionCount(
      formatDateLocal(startDate),
      formatDateLocal(endDate)
    );
    if (count < 2) {
      return "You have planned workouts this week that are not yet completed. Finish them to stay consistent.";
    }
    return null;
  }

  private async checkNoWorkoutToday(today: string): Promise<string | null> {
    const sessions = await this.workoutRepo.getSessionsByDateRange(today, today);
    if (sessions.length === 0 || sessions.every(s => s.end_time !== null)) {
      return "You haven't completed a workout today yet. Consider doing one to build consistency.";
    }
    return null;
  }

  private async checkHydrationProgress(today: string): Promise<string | null> {
    const logged = await this.hydrationRepo.getTodaysHydration(today);
    const targets = await this.settingsRepo.getNutritionTargets();
    const target = targets.hydration_liters;
    if (target > 0) {
      const progress = (logged / target) * 100;
      if (progress < 60) {
        return `You've logged ${logged.toFixed(1)} L of water today. Your target is ${target} L. Try to drink more.`;
      }
    }
    return null;
  }

  private async checkHydrationMet(today: string): Promise<string | null> {
    const logged = await this.hydrationRepo.getTodaysHydration(today);
    const targets = await this.settingsRepo.getNutritionTargets();
    const target = targets.hydration_liters;
    if (target > 0 && logged >= target) {
      return "Great job! You've reached your daily hydration target.";
    }
    return null;
  }

  private async checkMealNotLogged(today: string, mealType: string): Promise<string | null> {
    const meals = await this.nutritionRepo.getMealsByDate(today);
    const hasMeal = meals.some(m => m.meal_type === mealType);
    if (!hasMeal) {
      const mealLabels: Record<string, string> = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snack: 'snacks' };
      return `You haven't logged your ${mealLabels[mealType] || mealType} today. Don't forget to track your meals.`;
    }
    return null;
  }

  private async checkCaloriesProgress(today: string): Promise<string | null> {
    const nutrition = await this.nutritionRepo.getDailyNutrition(today);
    const targets = await this.settingsRepo.getNutritionTargets();
    if (targets.calories_kcal > 0) {
      const progress = (nutrition.calories / targets.calories_kcal) * 100;
      if (progress < 80) {
        return `You've consumed ${Math.round(nutrition.calories)} kcal today. Your target is ${targets.calories_kcal} kcal. Make sure you're eating enough to support your goals.`;
      }
    }
    return null;
  }

  private async checkCaloriesHigh(today: string): Promise<string | null> {
    const nutrition = await this.nutritionRepo.getDailyNutrition(today);
    const targets = await this.settingsRepo.getNutritionTargets();
    if (targets.calories_kcal > 0 && nutrition.calories > targets.calories_kcal * 1.2) {
      return `You've exceeded your calorie target today (${Math.round(nutrition.calories)} / ${targets.calories_kcal} kcal). Consider lighter meals tomorrow.`;
    }
    return null;
  }

  private async checkMacroProgress(today: string, macroType: string, threshold: number): Promise<string | null> {
    const nutrition = await this.nutritionRepo.getDailyNutrition(today);
    const targets = await this.settingsRepo.getNutritionTargets();

    const macroMap: Record<string, { current: number; target: number }> = {
      protein: { current: nutrition.protein, target: targets.protein_g },
      carbohydrates: { current: nutrition.carbs, target: targets.carbohydrates_g },
      fat: { current: nutrition.fat, target: targets.fat_g },
    };

    const macro = macroMap[macroType];
    if (macro && macro.target > 0) {
      const progress = (macro.current / macro.target) * 100;
      if (progress < threshold) {
        const macroLabels: Record<string, string> = { protein: 'protein', carbohydrates: 'carbohydrates', fat: 'fat' };
        const safeType = macroType in macroLabels ? macroType : 'protein';
        return `You've consumed ${Math.round(macro.current)} g of ${macroLabels[safeType]} today. Your target is ${macro.target} g. Consider adding a ${macroLabels[safeType]}-rich snack.`;
      }
    }
    return null;
  }

  private async checkNoNutritionLogged(today: string): Promise<string | null> {
    const nutrition = await this.nutritionRepo.getDailyNutrition(today);
    if (nutrition.calories === 0) {
      return "You haven't logged any meals today. Start tracking your nutrition to see your daily totals.";
    }
    return null;
  }

  private async checkAlways(today: string, rule: (typeof recommendationRules)[number]): Promise<string | null> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const count = await this.workoutRepo.getWeeklySessionCount(
      formatDateLocal(startDate),
      formatDateLocal(endDate)
    );

    if (rule.id === 'consistency_streak_info') {
      return `You logged workouts on ${count} day${count !== 1 ? 's' : ''} this week. Consistency is key to long-term progress.`;
    }
    return null;
  }

  private async checkDaysSinceMeasurement(today: string, threshold: number): Promise<string | null> {
    const daysSince = await this.measurementRepo.getDaysSinceLastMeasurement();
    if (daysSince > threshold) {
      return "It's been over two weeks since your last body measurement. Regular tracking helps you see your progress.";
    }
    return null;
  }

  private async checkNoActiveGoals(): Promise<string | null> {
    const goals = await this.goalRepo.getActiveGoals();
    if (goals.length === 0) {
      return "You haven't set any goals yet. Goals help you stay focused and motivated. Create your first goal today.";
    }
    return null;
  }

  private async checkJournalNotStarted(today: string): Promise<string | null> {
    const log = await this.dailyLogRepo.getLog(today);
    if (!log) {
      return "You haven't written in your daily journal yet. Take a moment to reflect on your day.";
    }
    return null;
  }

  async getExerciseRecommendation(exerciseId: string): Promise<string | null> {
    const lastPerformance = await this.workoutRepo.getLastSessionSets(exerciseId);
    if (!lastPerformance || lastPerformance.sets.length === 0) {
      return null;
    }

    const setsText = lastPerformance.sets
      .filter(s => s.completed)
      .map(s => `${s.weight_kg} kg × ${s.reps}`)
      .join('\n');

    return `Your previous ${exerciseId} performance was:\n${setsText}\n\nTry to reproduce or slightly improve it today.`;
  }
}

export class NutritionService {
  constructor(
    private nutritionRepo: NutritionRepository,
    private settingsRepo: SettingsRepository
  ) {}

  async getDailyTotals(date: string): Promise<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
  }> {
    const nutrition = await this.nutritionRepo.getDailyNutrition(date);
    const targets = await this.settingsRepo.getNutritionTargets();

    return {
      calories: Math.round(nutrition.calories),
      protein: Math.round(nutrition.protein),
      carbs: Math.round(nutrition.carbs),
      fat: Math.round(nutrition.fat),
      targetCalories: targets.calories_kcal,
      targetProtein: targets.protein_g,
      targetCarbs: targets.carbohydrates_g,
      targetFat: targets.fat_g,
    };
  }

  async getCaloriesRemaining(date: string): Promise<number> {
    const totals = await this.getDailyTotals(date);
    return Math.max(0, totals.targetCalories - totals.calories);
  }

  async getMacroProgress(date: string): Promise<{ protein: number; carbs: number; fat: number }> {
    const totals = await this.getDailyTotals(date);
    return {
      protein: Math.min(100, Math.round((totals.protein / totals.targetProtein) * 100)),
      carbs: Math.min(100, Math.round((totals.carbs / totals.targetCarbs) * 100)),
      fat: Math.min(100, Math.round((totals.fat / totals.targetFat) * 100)),
    };
  }

  searchFoods(query: string): Food[] {
    const lowerQuery = query.toLowerCase();
    return foods.filter(f =>
      f.name.toLowerCase().includes(lowerQuery)
    );
  }

  calculateFoodTotals(foodId: string, quantity: number): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } {
    const food = foods.find(f => f.id === foodId);
    if (!food) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    const multiplier = quantity / food.serving_size;
    return {
      calories: Math.round(food.calories * multiplier),
      protein: Math.round(food.protein_g * multiplier * 10) / 10,
      carbs: Math.round(food.carbs_g * multiplier * 10) / 10,
      fat: Math.round(food.fat_g * multiplier * 10) / 10,
    };
  }
}

export class BackupService {
  /**
   * Export COMPLET (v2.0) : toutes les tables de donnees + profils + parametres.
   * Les cles primaires sont conservees pour restaurer les relations (FK).
   */
  async exportAll(): Promise<string> {
    const db = await getDatabase();

    const [
      workouts, workoutExercises, workoutSets,
      meals, mealItems,
      measurements, goals, logs, hydration, customFoods,
    ] = await Promise.all([
      db.getAllAsync('SELECT * FROM workout_sessions ORDER BY id'),
      db.getAllAsync('SELECT * FROM workout_exercises ORDER BY id'),
      db.getAllAsync('SELECT * FROM workout_sets ORDER BY id'),
      db.getAllAsync('SELECT * FROM meals ORDER BY id'),
      db.getAllAsync('SELECT * FROM meal_items ORDER BY id'),
      db.getAllAsync('SELECT * FROM body_measurements ORDER BY id'),
      db.getAllAsync('SELECT * FROM goals ORDER BY id'),
      db.getAllAsync('SELECT * FROM daily_logs ORDER BY id'),
      db.getAllAsync('SELECT * FROM hydration_entries ORDER BY id'),
      db.getAllAsync('SELECT * FROM custom_foods ORDER BY id'),
    ]);
    const userProfile = await new UserProfileRepository().get();
    const settings = await new SettingsRepository().getProfile();
    const nutritionTargets = await new SettingsRepository().getNutritionTargets();

    const backup = {
      version: '2.0',
      exported_at: new Date().toISOString(),
      workouts,
      workout_exercises: workoutExercises,
      workout_sets: workoutSets,
      meals,
      meal_items: mealItems,
      body_measurements: measurements,
      goals,
      daily_logs: logs,
      hydration_entries: hydration,
      custom_foods: customFoods,
      user_profile: userProfile,
      profile: settings,
      nutrition_targets: nutritionTargets,
    };

    return JSON.stringify(backup, null, 2);
  }

  /**
   * Import complet transactionnel : soit tout est restaure, soit rien (rollback).
   * v2.0 : restaure toutes les tables (remplace les donnees existantes).
   * v1.0 : restaure uniquement profil + objectifs nutritionnels (legacy).
   */
  async importData(jsonString: string): Promise<{ success: boolean; error?: string }> {
    let data: unknown;
    try {
      data = JSON.parse(jsonString);
    } catch {
      return { success: false, error: 'Invalid JSON file' };
    }

    const validation = validateBackup(data);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const parsed = data as Record<string, any>;

    try {
      if (validation.version === '1.0') {
        const settingsRepo = new SettingsRepository();
        await settingsRepo.updateProfile(parsed.profile);
        if (parsed.nutrition_targets) {
          await settingsRepo.updateNutritionTargets(parsed.nutrition_targets);
        }
        return { success: true };
      }

      const db = await getDatabase();

      /**
       * Batch insert rows efficiently
       * Inserts in chunks to avoid SQLite parameter limits (~999 params)
       */
      const insertRows = async (table: string, columns: string[], rows: any[][]) => {
        if (rows.length === 0) return;

        const BATCH_SIZE = 100; // Insert 100 rows per batch
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

        // Process in batches
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          // Use Promise.all to parallelize within transaction
          await Promise.all(batch.map(row => db.runAsync(sql, row)));
        }
      };
      const col = (row: any, key: string) => (row[key] === undefined ? null : row[key]);
      const pick = (rows: any[], columns: string[]) =>
        rows.map(r => columns.map(c => col(r, c)));

      await db.withTransactionAsync(async () => {
        // 1) purge (ordre FK : enfants d'abord)
        for (const t of ['workout_sets', 'workout_exercises', 'workout_sessions',
          'meal_items', 'meals', 'body_measurements', 'goals', 'daily_logs',
          'hydration_entries', 'custom_foods']) {
          await db.runAsync(`DELETE FROM ${t}`, []);
        }

        // 2) reinsertion dans l'ordre des dependances
        await insertRows('workout_sessions',
          ['id', 'date', 'start_time', 'end_time', 'duration_minutes', 'program_id', 'program_name', 'notes', 'created_at', 'updated_at'],
          pick(parsed.workouts, ['id', 'date', 'start_time', 'end_time', 'duration_minutes', 'program_id', 'program_name', 'notes', 'created_at', 'updated_at']));
        await insertRows('workout_exercises',
          ['id', 'session_id', 'exercise_id', 'exercise_name', 'order_index', 'notes', 'created_at'],
          pick(parsed.workout_exercises, ['id', 'session_id', 'exercise_id', 'exercise_name', 'order_index', 'notes', 'created_at']));
        await insertRows('workout_sets',
          ['id', 'exercise_id', 'set_number', 'weight_kg', 'reps', 'completed', 'rpe', 'created_at'],
          pick(parsed.workout_sets, ['id', 'exercise_id', 'set_number', 'weight_kg', 'reps', 'completed', 'rpe', 'created_at']));
        await insertRows('meals',
          ['id', 'date', 'meal_type', 'name', 'notes', 'created_at'],
          pick(parsed.meals, ['id', 'date', 'meal_type', 'name', 'notes', 'created_at']));
        await insertRows('meal_items',
          ['id', 'meal_id', 'food_id', 'food_name', 'quantity', 'unit', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'created_at'],
          pick(parsed.meal_items, ['id', 'meal_id', 'food_id', 'food_name', 'quantity', 'unit', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'created_at']));
        await insertRows('body_measurements',
          ['id', 'date', 'weight_kg', 'waist_cm', 'chest_cm', 'arm_cm', 'thigh_cm', 'body_fat_percent', 'muscle_mass_kg', 'bmi', 'water_percent', 'visceral_fat', 'phase_angle', 'source', 'notes', 'created_at'],
          pick(parsed.body_measurements, ['id', 'date', 'weight_kg', 'waist_cm', 'chest_cm', 'arm_cm', 'thigh_cm', 'body_fat_percent', 'muscle_mass_kg', 'bmi', 'water_percent', 'visceral_fat', 'phase_angle', 'source', 'notes', 'created_at']));
        await insertRows('goals',
          ['id', 'goal_type', 'name', 'start_value', 'target_value', 'current_value', 'unit', 'start_date', 'target_date', 'is_active', 'notes', 'created_at', 'updated_at'],
          pick(parsed.goals, ['id', 'goal_type', 'name', 'start_value', 'target_value', 'current_value', 'unit', 'start_date', 'target_date', 'is_active', 'notes', 'created_at', 'updated_at']));
        await insertRows('daily_logs',
          ['id', 'date', 'weight_kg', 'water_liters', 'sleep_hours', 'steps', 'workout_completed', 'nutrition_logged', 'mood', 'notes', 'created_at'],
          pick(parsed.daily_logs, ['id', 'date', 'weight_kg', 'water_liters', 'sleep_hours', 'steps', 'workout_completed', 'nutrition_logged', 'mood', 'notes', 'created_at']));
        await insertRows('hydration_entries',
          ['id', 'date', 'time', 'amount_liters', 'source', 'created_at'],
          pick(parsed.hydration_entries, ['id', 'date', 'time', 'amount_liters', 'source', 'created_at']));
        await insertRows('custom_foods',
          ['id', 'name', 'serving_size', 'unit', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'created_at'],
          pick(parsed.custom_foods, ['id', 'name', 'serving_size', 'unit', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'created_at']));

        // 3) profils (app_settings via repositories)
        if (parsed.profile) {
          await new SettingsRepository().updateProfile(parsed.profile);
        }
        if (parsed.nutrition_targets) {
          await new SettingsRepository().updateNutritionTargets(parsed.nutrition_targets);
        }
        if (parsed.user_profile) {
          await db.runAsync('DELETE FROM user_profile', []);
          const up = parsed.user_profile;
          await insertRows('user_profile',
            ['id', 'first_name', 'last_name', 'age', 'gender', 'height_cm', 'weight_kg', 'goal', 'fitness_level', 'training_days', 'session_duration', 'equipment', 'created_at', 'updated_at'],
            [[col(up, 'id'), col(up, 'first_name'), col(up, 'last_name'), col(up, 'age'), col(up, 'gender'),
              col(up, 'height_cm'), col(up, 'weight_kg'), col(up, 'goal'), col(up, 'fitness_level'),
              col(up, 'training_days'), col(up, 'session_duration'), col(up, 'equipment'),
              col(up, 'created_at'), col(up, 'updated_at')]]);
        }
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: 'Import failed. No data was changed.' };
    }
  }
}

/**
 * Returns today's date as a local date string (YYYY-MM-DD).
 * Note: Despite the name "ISO", this returns LOCAL date, not UTC.
 * This is for backward compatibility with existing screens.
 * @deprecated Use todayLocal() directly for clarity.
 */
export function todayISO(): string {
  return todayLocal();
}

export function timeNow(): string {
  return new Date().toTimeString().slice(0, 5);
}

export function dateDaysAgo(days: number): string {
  return dateDaysAgoLocal(days);
}