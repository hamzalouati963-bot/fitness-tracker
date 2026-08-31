import { getDatabase } from '../database';
import type {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  Meal,
  MealItem,
  BodyMeasurement,
  Goal,
  DailyLog,
  HydrationEntry,
  CustomFood,
  Profile,
  NutritionTargets,
  UserProfile,
  UserGoal,
  FitnessLevel,
  Equipment
} from '../models';

export class WorkoutRepository {
  async getSessions(limit?: number, offset?: number): Promise<WorkoutSession[]> {
    const db = await getDatabase();
    let query = 'SELECT * FROM workout_sessions ORDER BY date DESC, start_time DESC';
    const params: string[] = [];
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit.toString());
    }
    if (offset) {
      query += ' OFFSET ?';
      params.push(offset.toString());
    }
    return db.getAllAsync<WorkoutSession>(query, params);
  }

  async getSession(id: number): Promise<WorkoutSession | null> {
    const db = await getDatabase();
    return db.getFirstAsync<WorkoutSession>('SELECT * FROM workout_sessions WHERE id = ?', [id]);
  }

  async getSessionsByDateRange(startDate: string, endDate: string): Promise<WorkoutSession[]> {
    const db = await getDatabase();
    return db.getAllAsync<WorkoutSession>(
      'SELECT * FROM workout_sessions WHERE date BETWEEN ? AND ? ORDER BY date DESC',
      [startDate, endDate]
    );
  }

  async getWeeklySessionCount(weekStart: string, weekEnd: string): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM workout_sessions WHERE date BETWEEN ? AND ?',
      [weekStart, weekEnd]
    );
    return result?.count ?? 0;
  }

  async createSession(session: Omit<WorkoutSession, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO workout_sessions (date, start_time, end_time, duration_minutes, program_id, program_name, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [session.date, session.start_time, session.end_time ?? null, session.duration_minutes ?? null,
       session.program_id ?? null, session.program_name ?? null, session.notes, now, now]
    );
    return result.lastInsertRowId;
  }

  async updateSession(id: number, updates: Partial<WorkoutSession>): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.end_time !== undefined) { fields.push('end_time'); values.push(updates.end_time); }
    if (updates.duration_minutes !== undefined) { fields.push('duration_minutes'); values.push(updates.duration_minutes); }
    if (updates.notes !== undefined) { fields.push('notes'); values.push(updates.notes); }
    fields.push('updated_at');
    values.push(now);

    values.push(id);
    await db.runAsync(
      `UPDATE workout_sessions SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteSession(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM workout_sessions WHERE id = ?', [id]);
  }

  async getExercisesBySession(sessionId: number): Promise<WorkoutExercise[]> {
    const db = await getDatabase();
    return db.getAllAsync<WorkoutExercise>(
      'SELECT * FROM workout_exercises WHERE session_id = ? ORDER BY order_index',
      [sessionId]
    );
  }

  async createExercise(exercise: Omit<WorkoutExercise, 'id' | 'created_at'>): Promise<number> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO workout_exercises (session_id, exercise_id, exercise_name, order_index, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [exercise.session_id, exercise.exercise_id, exercise.exercise_name, exercise.order_index,
       exercise.notes, now]
    );
    return result.lastInsertRowId;
  }

  async getSetsByExercise(exerciseId: number): Promise<WorkoutSet[]> {
    const db = await getDatabase();
    return db.getAllAsync<WorkoutSet>(
      'SELECT * FROM workout_sets WHERE exercise_id = ? ORDER BY set_number',
      [exerciseId]
    );
  }

  async getLastSessionSets(exerciseId: string): Promise<{ sets: WorkoutSet[]; sessionDate: string; sessionId: number } | null> {
    const db = await getDatabase();
    const exercise = await db.getFirstAsync<WorkoutExercise>(
      'SELECT id, session_id FROM workout_exercises WHERE exercise_id = ? ORDER BY session_id DESC LIMIT 1',
      [exerciseId]
    );
    if (!exercise) return null;

    const sets = await this.getSetsByExercise(exercise.id!);
    const session = await this.getSession(exercise.session_id);
    if (!session) return null;

    return { sets, sessionDate: session.date, sessionId: exercise.session_id };
  }

  async createSet(setData: Omit<WorkoutSet, 'id' | 'created_at'>): Promise<number> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO workout_sets (exercise_id, set_number, weight_kg, reps, completed, rpe, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [setData.exercise_id, setData.set_number, setData.weight_kg, setData.reps,
       setData.completed ? 1 : 0, setData.rpe ?? null, now]
    );
    return result.lastInsertRowId;
  }

  async getTodaysSession(): Promise<WorkoutSession | null> {
    const today = new Date().toISOString().split('T')[0];
    const db = await getDatabase();
    return db.getFirstAsync<WorkoutSession>(
      'SELECT * FROM workout_sessions WHERE date = ? AND end_time IS NULL LIMIT 1',
      [today]
    );
  }
}

export class NutritionRepository {
  async getMealsByDate(date: string): Promise<Meal[]> {
    const db = await getDatabase();
    return db.getAllAsync<Meal>(
      'SELECT * FROM meals WHERE date = ? ORDER BY CASE meal_type WHEN "breakfast" THEN 1 WHEN "lunch" THEN 2 WHEN "dinner" THEN 3 WHEN "snack" THEN 4 END',
      [date]
    );
  }

  async createMeal(meal: Omit<Meal, 'id' | 'created_at'>): Promise<number> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO meals (date, meal_type, name, notes, created_at) VALUES (?, ?, ?, ?, ?)`,
      [meal.date, meal.meal_type, meal.name, meal.notes, now]
    );
    return result.lastInsertRowId;
  }

  async deleteMeal(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM meals WHERE id = ?', [id]);
  }

  async getMealItems(mealId: number): Promise<MealItem[]> {
    const db = await getDatabase();
    return db.getAllAsync<MealItem>('SELECT * FROM meal_items WHERE meal_id = ?', [mealId]);
  }

  async createMealItem(item: Omit<MealItem, 'id' | 'created_at'>): Promise<number> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO meal_items (meal_id, food_id, food_name, quantity, unit, calories, protein_g, carbs_g, fat_g, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.meal_id, item.food_id, item.food_name, item.quantity, item.unit,
       item.calories, item.protein_g, item.carbs_g, item.fat_g, now]
    );
    return result.lastInsertRowId;
  }

  async deleteMealItem(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM meal_items WHERE id = ?', [id]);
  }

  async getDailyNutrition(date: string): Promise<{ calories: number; protein: number; carbs: number; fat: number }> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ calories: number; protein: number; carbs: number; fat: number }>(
      `SELECT
        COALESCE(SUM(mi.calories), 0) as calories,
        COALESCE(SUM(mi.protein_g), 0) as protein,
        COALESCE(SUM(mi.carbs_g), 0) as carbs,
        COALESCE(SUM(mi.fat_g), 0) as fat
       FROM meal_items mi
       JOIN meals m ON mi.meal_id = m.id
       WHERE m.date = ?`,
      [date]
    );
    return result ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  async getAverageDailyCalories(days: number): Promise<number> {
    const db = await getDatabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const result = await db.getFirstAsync<{ avg: number }>(
      `SELECT AVG(daily_calories) as avg FROM (
        SELECT m.date, COALESCE(SUM(mi.calories), 0) as daily_calories
        FROM meals m JOIN meal_items mi ON m.id = mi.meal_id
        WHERE m.date >= ? GROUP BY m.date
      )`,
      [startDate.toISOString().split('T')[0]]
    );
    return result?.avg ?? 0;
  }

  async getNutritionLogCount(days: number): Promise<number> {
    const db = await getDatabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM (
        SELECT DISTINCT m.date FROM meals m WHERE m.date >= ?
      )`,
      [startDate.toISOString().split('T')[0]]
    );
    return result?.count ?? 0;
  }

  async getCustomFoods(): Promise<CustomFood[]> {
    const db = await getDatabase();
    return db.getAllAsync<CustomFood>('SELECT * FROM custom_foods ORDER BY name');
  }

  async createCustomFood(food: Omit<CustomFood, 'id' | 'created_at'>): Promise<number> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO custom_foods (name, serving_size, unit, calories, protein_g, carbs_g, fat_g, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [food.name, food.serving_size, food.unit, food.calories, food.protein_g, food.carbs_g, food.fat_g, now]
    );
    return result.lastInsertRowId;
  }

  async deleteCustomFood(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM custom_foods WHERE id = ?', [id]);
  }
}

export class MeasurementRepository {
  async getMeasurements(limit?: number): Promise<BodyMeasurement[]> {
    const db = await getDatabase();
    let query = 'SELECT * FROM body_measurements ORDER BY date DESC';
    const params: string[] = [];
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit.toString());
    }
    return db.getAllAsync<BodyMeasurement>(query, params);
  }

  async getMeasurementsByDateRange(startDate: string, endDate: string): Promise<BodyMeasurement[]> {
    const db = await getDatabase();
    return db.getAllAsync<BodyMeasurement>(
      'SELECT * FROM body_measurements WHERE date BETWEEN ? AND ? ORDER BY date',
      [startDate, endDate]
    );
  }

  async getLatestMeasurement(): Promise<BodyMeasurement | null> {
    const db = await getDatabase();
    return db.getFirstAsync<BodyMeasurement>('SELECT * FROM body_measurements ORDER BY date DESC LIMIT 1');
  }

  async createMeasurement(measurement: Omit<BodyMeasurement, 'id' | 'created_at'>): Promise<number> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO body_measurements (date, weight_kg, waist_cm, chest_cm, arm_cm, thigh_cm,
       body_fat_percent, muscle_mass_kg, bmi, water_percent, visceral_fat, phase_angle, source, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [measurement.date, measurement.weight_kg, measurement.waist_cm, measurement.chest_cm,
       measurement.arm_cm, measurement.thigh_cm, measurement.body_fat_percent, measurement.muscle_mass_kg,
       measurement.bmi, measurement.water_percent, measurement.visceral_fat, measurement.phase_angle,
       measurement.source, measurement.notes, now]
    );
    return result.lastInsertRowId;
  }

  async deleteMeasurement(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM body_measurements WHERE id = ?', [id]);
  }

  async getDaysSinceLastMeasurement(): Promise<number> {
    const latest = await this.getLatestMeasurement();
    if (!latest) return Infinity;
    const lastDate = new Date(latest.date);
    const today = new Date();
    const diff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }
}

export class GoalRepository {
  async getActiveGoals(): Promise<Goal[]> {
    const db = await getDatabase();
    return db.getAllAsync<Goal>('SELECT * FROM goals WHERE is_active = 1 ORDER BY created_at');
  }

  async getAllGoals(): Promise<Goal[]> {
    const db = await getDatabase();
    return db.getAllAsync<Goal>('SELECT * FROM goals ORDER BY created_at DESC');
  }

  async getGoal(id: number): Promise<Goal | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Goal>('SELECT * FROM goals WHERE id = ?', [id]);
  }

  async createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO goals (goal_type, name, start_value, target_value, current_value, unit,
       start_date, target_date, is_active, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [goal.goal_type, goal.name, goal.start_value, goal.target_value, goal.current_value,
       goal.unit, goal.start_date, goal.target_date, goal.is_active ? 1 : 0, goal.notes, now, now]
    );
    return result.lastInsertRowId;
  }

  async updateGoal(id: number, updates: Partial<Goal>): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    if (updates.current_value !== undefined) { fields.push('current_value'); values.push(updates.current_value); }
    if (updates.is_active !== undefined) { fields.push('is_active'); values.push(updates.is_active ? 1 : 0); }
    if (updates.notes !== undefined) { fields.push('notes'); values.push(updates.notes); }
    if (updates.target_value !== undefined) { fields.push('target_value'); values.push(updates.target_value); }
    fields.push('updated_at');
    values.push(now);

    values.push(id);
    await db.runAsync(
      `UPDATE goals SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteGoal(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
  }

  async getGoalProgress(id: number): Promise<number> {
    const goal = await this.getGoal(id);
    if (!goal || goal.start_value === goal.target_value) return 0;
    const current = goal.current_value ?? goal.start_value;
    const progress = ((current - goal.start_value) / (goal.target_value - goal.start_value)) * 100;
    return Math.max(0, Math.min(100, progress));
  }
}

export class DailyLogRepository {
  async getLog(date: string): Promise<DailyLog | null> {
    const db = await getDatabase();
    return db.getFirstAsync<DailyLog>('SELECT * FROM daily_logs WHERE date = ?', [date]);
  }

  async getLogsByDateRange(startDate: string, endDate: string): Promise<DailyLog[]> {
    const db = await getDatabase();
    return db.getAllAsync<DailyLog>(
      'SELECT * FROM daily_logs WHERE date BETWEEN ? AND ? ORDER BY date',
      [startDate, endDate]
    );
  }

  async getOrCreateLog(date: string): Promise<number> {
    const db = await getDatabase();
    let log = await this.getLog(date);
    if (log) return log.id!;

    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO daily_logs (date, weight_kg, water_liters, sleep_hours, steps,
       workout_completed, nutrition_logged, mood, notes, created_at)
       VALUES (?, NULL, NULL, NULL, NULL, 0, 0, NULL, '', ?)`,
      [date, now]
    );
    return result.lastInsertRowId;
  }

  async updateLog(id: number, updates: Partial<DailyLog>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    if (updates.weight_kg !== undefined) { fields.push('weight_kg'); values.push(updates.weight_kg); }
    if (updates.water_liters !== undefined) { fields.push('water_liters'); values.push(updates.water_liters); }
    if (updates.sleep_hours !== undefined) { fields.push('sleep_hours'); values.push(updates.sleep_hours); }
    if (updates.steps !== undefined) { fields.push('steps'); values.push(updates.steps); }
    if (updates.workout_completed !== undefined) { fields.push('workout_completed'); values.push(updates.workout_completed ? 1 : 0); }
    if (updates.nutrition_logged !== undefined) { fields.push('nutrition_logged'); values.push(updates.nutrition_logged ? 1 : 0); }
    if (updates.mood !== undefined) { fields.push('mood'); values.push(updates.mood); }
    if (updates.notes !== undefined) { fields.push('notes'); values.push(updates.notes); }

    values.push(id);
    await db.runAsync(
      `UPDATE daily_logs SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`,
      values
    );
  }

  async getWorkoutDaysCount(days: number): Promise<number> {
    const db = await getDatabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM daily_logs WHERE workout_completed = 1 AND date >= ?',
      [startDate.toISOString().split('T')[0]]
    );
    return result?.count ?? 0;
  }

  async getHydrationGoalDaysCount(days: number): Promise<number> {
    const db = await getDatabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM daily_logs WHERE water_liters > 0 AND date >= ?',
      [startDate.toISOString().split('T')[0]]
    );
    return result?.count ?? 0;
  }
}

export class HydrationRepository {
  async getTodaysHydration(date: string): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount_liters), 0) as total FROM hydration_entries WHERE date = ?',
      [date]
    );
    return result?.total ?? 0;
  }

  async addEntry(entry: Omit<HydrationEntry, 'id' | 'created_at'>): Promise<number> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO hydration_entries (date, time, amount_liters, source, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [entry.date, entry.time, entry.amount_liters, entry.source, now]
    );
    return result.lastInsertRowId;
  }

  async getEntriesByDate(date: string): Promise<HydrationEntry[]> {
    const db = await getDatabase();
    return db.getAllAsync<HydrationEntry>(
      'SELECT * FROM hydration_entries WHERE date = ? ORDER BY time',
      [date]
    );
  }

  async deleteEntry(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM hydration_entries WHERE id = ?', [id]);
  }
}

export class SettingsRepository {
  async getProfile(): Promise<Profile> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM app_settings LIMIT 1');
    if (!row) {
      return {
        id: 1,
        name: '',
        age: null,
        sex: 'male',
        height_cm: 182,
        current_weight_kg: 116.2,
        activity_level: 'sedentary',
        fitness_goal: 'weight_loss',
        preferred_workout_days: 'mon_wed_fri',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    return {
      id: row.id as number,
      name: (row.profile_name as string) || '',
      age: row.profile_age as number | null,
      sex: row.profile_sex as Profile['sex'],
      height_cm: row.profile_height_cm as number,
      current_weight_kg: row.profile_current_weight_kg as number,
      activity_level: row.profile_activity_level as Profile['activity_level'],
      fitness_goal: row.profile_fitness_goal as Profile['fitness_goal'],
      preferred_workout_days: row.profile_workout_days as string,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async getNutritionTargets(): Promise<NutritionTargets> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM app_settings LIMIT 1');
    if (!row) {
      return { calories_kcal: 2200, protein_g: 150, carbohydrates_g: 250, fat_g: 70, hydration_liters: 2.5 };
    }
    return {
      id: 1,
      calories_kcal: row.nutrition_calories as number,
      protein_g: row.nutrition_protein as number,
      carbohydrates_g: row.nutrition_carbs as number,
      fat_g: row.nutrition_fat as number,
      hydration_liters: row.nutrition_hydration as number
    };
  }

  async updateProfile(updates: Partial<Profile>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name !== undefined) { fields.push('profile_name'); values.push(updates.name); }
    if (updates.age !== undefined) { fields.push('profile_age'); values.push(updates.age); }
    if (updates.sex !== undefined) { fields.push('profile_sex'); values.push(updates.sex); }
    if (updates.height_cm !== undefined) { fields.push('profile_height_cm'); values.push(updates.height_cm); }
    if (updates.current_weight_kg !== undefined) { fields.push('profile_current_weight_kg'); values.push(updates.current_weight_kg); }
    if (updates.activity_level !== undefined) { fields.push('profile_activity_level'); values.push(updates.activity_level); }
    if (updates.fitness_goal !== undefined) { fields.push('profile_fitness_goal'); values.push(updates.fitness_goal); }
    if (updates.preferred_workout_days !== undefined) { fields.push('profile_workout_days'); values.push(updates.preferred_workout_days); }

    if (fields.length > 0) {
      values.push(now());
      await db.runAsync(
        `UPDATE app_settings SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = ? WHERE id = 1`,
        values
      );
    }
  }

  async updateNutritionTargets(targets: Partial<NutritionTargets>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: number[] = [];

    if (targets.calories_kcal !== undefined) { fields.push('nutrition_calories'); values.push(targets.calories_kcal); }
    if (targets.protein_g !== undefined) { fields.push('nutrition_protein'); values.push(targets.protein_g); }
    if (targets.carbohydrates_g !== undefined) { fields.push('nutrition_carbs'); values.push(targets.carbohydrates_g); }
    if (targets.fat_g !== undefined) { fields.push('nutrition_fat'); values.push(targets.fat_g); }
    if (targets.hydration_liters !== undefined) { fields.push('nutrition_hydration'); values.push(targets.hydration_liters); }

    if (fields.length > 0) {
      await db.runAsync(
        `UPDATE app_settings SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = 1`,
        values
      );
    }
  }

  async getNotificationSettings(): Promise<import('../models').NotificationSettings> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM app_settings LIMIT 1');
    if (!row) {
      return {
        workout_reminder: { enabled: true, time: '08:00' },
        hydration_reminder: { enabled: true, interval_minutes: 60 },
        meal_logging_reminder: { enabled: true, time: '12:00' },
        measurement_reminder: { enabled: false, interval_days: 7 },
        weekly_review_reminder: { enabled: true, day: 'sunday', time: '20:00' }
      };
    }
    return {
      workout_reminder: {
        enabled: row.notification_workout_enabled === 1,
        time: row.notification_workout_time as string
      },
      hydration_reminder: {
        enabled: row.notification_hydration_enabled === 1,
        interval_minutes: row.notification_hydration_interval as number
      },
      meal_logging_reminder: {
        enabled: row.notification_meal_enabled === 1,
        time: row.notification_meal_time as string
      },
      measurement_reminder: {
        enabled: row.notification_measurement_enabled === 1,
        interval_days: row.notification_measurement_interval as number
      },
      weekly_review_reminder: {
        enabled: row.notification_weekly_enabled === 1,
        day: row.notification_weekly_day as string,
        time: row.notification_weekly_time as string
      }
    };
  }

  async updateNotificationSettings(settings: Partial<import('../models').NotificationSettings>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (settings.workout_reminder?.enabled !== undefined) {
      fields.push('notification_workout_enabled');
      values.push(settings.workout_reminder.enabled ? 1 : 0);
    }
    if (settings.workout_reminder?.time !== undefined) {
      fields.push('notification_workout_time');
      values.push(settings.workout_reminder.time);
    }
    if (settings.hydration_reminder?.enabled !== undefined) {
      fields.push('notification_hydration_enabled');
      values.push(settings.hydration_reminder.enabled ? 1 : 0);
    }
    if (settings.hydration_reminder?.interval_minutes !== undefined) {
      fields.push('notification_hydration_interval');
      values.push(settings.hydration_reminder.interval_minutes);
    }
    if (settings.meal_logging_reminder?.enabled !== undefined) {
      fields.push('notification_meal_enabled');
      values.push(settings.meal_logging_reminder.enabled ? 1 : 0);
    }
    if (settings.meal_logging_reminder?.time !== undefined) {
      fields.push('notification_meal_time');
      values.push(settings.meal_logging_reminder.time);
    }
    if (settings.measurement_reminder?.enabled !== undefined) {
      fields.push('notification_measurement_enabled');
      values.push(settings.measurement_reminder.enabled ? 1 : 0);
    }
    if (settings.measurement_reminder?.interval_days !== undefined) {
      fields.push('notification_measurement_interval');
      values.push(settings.measurement_reminder.interval_days);
    }
    if (settings.weekly_review_reminder?.enabled !== undefined) {
      fields.push('notification_weekly_enabled');
      values.push(settings.weekly_review_reminder.enabled ? 1 : 0);
    }
    if (settings.weekly_review_reminder?.day !== undefined) {
      fields.push('notification_weekly_day');
      values.push(settings.weekly_review_reminder.day);
    }
    if (settings.weekly_review_reminder?.time !== undefined) {
      fields.push('notification_weekly_time');
      values.push(settings.weekly_review_reminder.time);
    }

    if (fields.length > 0) {
      await db.runAsync(
        `UPDATE app_settings SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = 1`,
        values
      );
    }
  }

  async getAppearance(): Promise<import('../models').AppAppearance> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM app_settings LIMIT 1');
    return {
      theme: (row?.theme as import('../models').AppAppearance['theme']) || 'system',
      unit_system: (row?.unit_system as import('../models').AppAppearance['unit_system']) || 'metric'
    };
  }

  async updateAppearance(appearance: Partial<import('../models').AppAppearance>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: string[] = [];

    if (appearance.theme !== undefined) { fields.push('theme'); values.push(appearance.theme); }
    if (appearance.unit_system !== undefined) { fields.push('unit_system'); values.push(appearance.unit_system); }

    if (fields.length > 0) {
      await db.runAsync(
        `UPDATE app_settings SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = 1`,
        values
      );
    }
  }

  async getLastWeeklyReviewDate(): Promise<string | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ last_weekly_review_date: string | null }>(
      'SELECT last_weekly_review_date FROM app_settings LIMIT 1'
    );
    return row?.last_weekly_review_date ?? null;
  }

  async setLastWeeklyReviewDate(date: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE app_settings SET last_weekly_review_date = ? WHERE id = 1', [date]);
  }
}

export class CustomWorkoutRepository {
  async getAll(): Promise<import('../models').CustomWorkout[]> {
    const db = await getDatabase();
    return db.getAllAsync<import('../models').CustomWorkout>(
      'SELECT * FROM custom_workouts ORDER BY updated_at DESC'
    );
  }

  async getById(id: number): Promise<import('../models').CustomWorkout | null> {
    const db = await getDatabase();
    return db.getFirstAsync<import('../models').CustomWorkout>(
      'SELECT * FROM custom_workouts WHERE id = ?',
      [id]
    );
  }

  async create(workout: Omit<import('../models').CustomWorkout, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const db = await getDatabase();
    const ts = now();
    const result = await db.runAsync(
      'INSERT INTO custom_workouts (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [workout.name, workout.description, ts, ts]
    );
    return result.lastInsertRowId;
  }

  async update(id: number, updates: Partial<Pick<import('../models').CustomWorkout, 'name' | 'description'>>): Promise<void> {
    const db = await getDatabase();
    const ts = now();
    const fields: string[] = [];
    const values: (string | number)[] = [];
    if (updates.name !== undefined) { fields.push('name'); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push('description'); values.push(updates.description); }
    fields.push('updated_at');
    values.push(ts);
    values.push(id);
    await db.runAsync(
      `UPDATE custom_workouts SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`,
      values
    );
  }

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM custom_workout_exercises WHERE custom_workout_id = ?', [id]);
      await db.runAsync('DELETE FROM custom_workouts WHERE id = ?', [id]);
    });
  }

  async getExercises(workoutId: number): Promise<import('../models').CustomWorkoutExercise[]> {
    const db = await getDatabase();
    return db.getAllAsync<import('../models').CustomWorkoutExercise>(
      'SELECT * FROM custom_workout_exercises WHERE custom_workout_id = ? ORDER BY order_index',
      [workoutId]
    );
  }

  async addExercise(exercise: Omit<import('../models').CustomWorkoutExercise, 'id'>): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO custom_workout_exercises
       (custom_workout_id, exercise_id, exercise_name, order_index, sets, reps, weight_kg, rest_seconds, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [exercise.custom_workout_id, exercise.exercise_id, exercise.exercise_name,
       exercise.order_index, exercise.sets, exercise.reps, exercise.weight_kg,
       exercise.rest_seconds, exercise.notes]
    );
    return result.lastInsertRowId;
  }

  async updateExercise(id: number, updates: Partial<Omit<import('../models').CustomWorkoutExercise, 'id' | 'custom_workout_id'>>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: (string | number)[] = [];
    if (updates.exercise_id !== undefined) { fields.push('exercise_id'); values.push(updates.exercise_id); }
    if (updates.exercise_name !== undefined) { fields.push('exercise_name'); values.push(updates.exercise_name); }
    if (updates.order_index !== undefined) { fields.push('order_index'); values.push(updates.order_index); }
    if (updates.sets !== undefined) { fields.push('sets'); values.push(updates.sets); }
    if (updates.reps !== undefined) { fields.push('reps'); values.push(updates.reps); }
    if (updates.weight_kg !== undefined) { fields.push('weight_kg'); values.push(updates.weight_kg); }
    if (updates.rest_seconds !== undefined) { fields.push('rest_seconds'); values.push(updates.rest_seconds); }
    if (updates.notes !== undefined) { fields.push('notes'); values.push(updates.notes); }
    if (fields.length > 0) {
      values.push(id);
      await db.runAsync(
        `UPDATE custom_workout_exercises SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  async deleteExercise(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM custom_workout_exercises WHERE id = ?', [id]);
  }

  async deleteAllExercises(workoutId: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM custom_workout_exercises WHERE custom_workout_id = ?', [workoutId]);
  }

  async reorderExercises(workoutId: number, exerciseIds: number[]): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      for (let i = 0; i < exerciseIds.length; i++) {
        await db.runAsync(
          'UPDATE custom_workout_exercises SET order_index = ? WHERE id = ? AND custom_workout_id = ?',
          [i, exerciseIds[i], workoutId]
        );
      }
    });
  }
}

export class UserProfileRepository {
  async get(): Promise<UserProfile | null> {
    const db = await getDatabase();
    return db.getFirstAsync<UserProfile>('SELECT * FROM user_profile LIMIT 1');
  }

  async create(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const db = await getDatabase();
    const ts = now();
    const result = await db.runAsync(
      `INSERT INTO user_profile (first_name, last_name, age, gender, height_cm, weight_kg, goal, fitness_level, training_days, session_duration, equipment, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [profile.first_name, profile.last_name, profile.age, profile.gender,
       profile.height_cm, profile.weight_kg, profile.goal, profile.fitness_level,
       profile.training_days, profile.session_duration, profile.equipment, ts, ts]
    );
    return result.lastInsertRowId;
  }

  async update(id: number, updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const db = await getDatabase();
    const ts = now();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    if (updates.first_name !== undefined) { fields.push('first_name'); values.push(updates.first_name); }
    if (updates.last_name !== undefined) { fields.push('last_name'); values.push(updates.last_name); }
    if (updates.age !== undefined) { fields.push('age'); values.push(updates.age); }
    if (updates.gender !== undefined) { fields.push('gender'); values.push(updates.gender); }
    if (updates.height_cm !== undefined) { fields.push('height_cm'); values.push(updates.height_cm); }
    if (updates.weight_kg !== undefined) { fields.push('weight_kg'); values.push(updates.weight_kg); }
    if (updates.goal !== undefined) { fields.push('goal'); values.push(updates.goal); }
    if (updates.fitness_level !== undefined) { fields.push('fitness_level'); values.push(updates.fitness_level); }
    if (updates.training_days !== undefined) { fields.push('training_days'); values.push(updates.training_days); }
    if (updates.session_duration !== undefined) { fields.push('session_duration'); values.push(updates.session_duration); }
    if (updates.equipment !== undefined) { fields.push('equipment'); values.push(updates.equipment); }
    if (fields.length > 0) {
      fields.push('updated_at');
      values.push(ts);
      values.push(id);
      await db.runAsync(
        `UPDATE user_profile SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`,
        values
      );
    }
  }
}

function now(): string {
  return new Date().toISOString();
}
