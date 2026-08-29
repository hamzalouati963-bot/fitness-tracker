import {
  WorkoutRepository,
  NutritionRepository,
  MeasurementRepository,
  GoalRepository,
  DailyLogRepository,
  HydrationRepository,
  SettingsRepository,
} from '../database/repositories';
import type { Recommendation } from '../models';
import exercisesData from '../data/exercises.json';
import workoutProgramsData from '../data/workout_programs.json';
import foodsData from '../data/foods.json';
import recommendationRulesData from '../data/recommendation_rules.json';

export const exercises = exercisesData;
export const workoutPrograms = workoutProgramsData;
export const foods = foodsData;
export const recommendationRules = recommendationRulesData.recommendation_rules;

export type Food = (typeof foodsData)[number];
export type Exercise = (typeof exercisesData)[number];
export type WorkoutProgram = (typeof workoutProgramsData)[number];

export class CalculatorService {
  calculateBMI(weightKg: number, heightCm: number): number {
    if (weightKg <= 0 || heightCm <= 0) return 0;
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  }

  calculateBMR(sex: 'male' | 'female', weightKg: number, heightCm: number, age: number): number {
    if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0;
    if (sex === 'male') {
      return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }
  }

  calculateTDEE(bmr: number, activityLevel: string): number {
    const multipliers: Record<string, number> = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725,
    };
    return bmr * (multipliers[activityLevel] || 1.2);
  }

  calculateMacroCalories(proteinG: number, carbsG: number, fatG: number): number {
    return (proteinG * 4) + (carbsG * 4) + (fatG * 9);
  }

  calculateWorkoutCalories(activityType: string, durationMinutes: number, weightKg: number): number {
    const metValues: Record<string, number> = {
      'walking': 3.5,
      'running': 7.0,
      'cycling': 6.0,
      'strength_training': 4.0,
      'hiit': 8.0,
      'swimming': 6.0,
      'yoga': 2.5,
    };
    const met = metValues[activityType] || 4.0;
    return Math.round((met * 3.5 * weightKg * durationMinutes) / (200 * 60));
  }

  getHydrationTarget(weightKg: number, activityLevel: string): number {
    let baseLiters = weightKg * 0.033;
    const multipliers: Record<string, number> = {
      'sedentary': 1.0,
      'lightly_active': 1.1,
      'moderately_active': 1.2,
      'very_active': 1.3,
    };
    const multiplier = multipliers[activityLevel] || 1.0;
    return Math.round((baseLiters * multiplier) * 10) / 10;
  }
}

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
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const weightData: { date: string; weight: number | null }[] = measurements.map(m => ({
      date: m.date,
      weight: m.weight_kg,
    }));

    const logs = await this.dailyLogRepo.getLogsByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
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
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
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
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
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
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      results.push({
        weekStart: startDate.toISOString().split('T')[0],
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
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
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
    const today = new Date().toISOString().split('T')[0];
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
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
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
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
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
  async exportAll(): Promise<string> {
    const workoutRepo = new WorkoutRepository();
    const nutritionRepo = new NutritionRepository();
    const measurementRepo = new MeasurementRepository();
    const goalRepo = new GoalRepository();
    const dailyLogRepo = new DailyLogRepository();
    const hydrationRepo = new HydrationRepository();
    const settingsRepo = new SettingsRepository();

    const profile = await settingsRepo.getProfile();
    const workouts = await workoutRepo.getSessions();
    const measurements = await measurementRepo.getMeasurements();
    const goals = await goalRepo.getAllGoals();
    const logs = await dailyLogRepo.getLogsByDateRange(
      '2020-01-01',
      new Date().toISOString().split('T')[0]
    );
    const nutritionTargets = await settingsRepo.getNutritionTargets();

    const allHydration: import('../models').HydrationEntry[] = [];
    const uniqueDates = new Set<string>();
    for (const workout of workouts) {
      uniqueDates.add(workout.date);
    }
    for (const date of uniqueDates) {
      const entries = await hydrationRepo.getEntriesByDate(date);
      allHydration.push(...entries);
    }

    const backup = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      profile,
      nutrition_targets: nutritionTargets,
      workouts,
      measurements,
      goals,
      daily_logs: logs,
      hydration: allHydration,
    };

    return JSON.stringify(backup, null, 2);
  }

  async importData(jsonString: string): Promise<{ success: boolean; error?: string }> {
    try {
      const data = JSON.parse(jsonString);

      if (!data.version || !data.profile) {
        return { success: false, error: 'Invalid backup format' };
      }

      const settingsRepo = new SettingsRepository();
      await settingsRepo.updateProfile(data.profile);
      if (data.nutrition_targets) {
        await settingsRepo.updateNutritionTargets(data.nutrition_targets);
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: 'Failed to parse backup data' };
    }
  }
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function timeNow(): string {
  return new Date().toTimeString().slice(0, 5);
}

export function dateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}