import { getDatabase } from '../database';
import { sessionManager } from '../utils/session';
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
  Equipment,
  UserAccount,
} from '../models';
import { todayLocal, formatDateLocal } from '../utils/dates';
import { minutesBetweenTimeStrings } from '../utils/backup';

function uid(): number {
  return sessionManager.getCurrentUserId();
}

function now(): string {
  return new Date().toISOString();
}

// ─── Account Repository ─────────────────────────────────────────────────────

export class AccountRepository {
  async createAccount(email: string, passwordHash: string, passwordSalt: string, displayName: string): Promise<number> {
    const db = await getDatabase();
    const ts = now();
    const result = await db.runAsync(
      'INSERT INTO user_accounts (email, password_hash, password_salt, display_name, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?)',
      [email.trim().toLowerCase(), passwordHash, passwordSalt, displayName.trim(), ts, ts]
    );
    return result.lastInsertRowId;
  }

  async getAccountByEmail(email: string): Promise<UserAccount | null> {
    const db = await getDatabase();
    return db.getFirstAsync<UserAccount>(
      'SELECT * FROM user_accounts WHERE email = ?',
      [email.trim().toLowerCase()]
    );
  }

  async getAccountById(id: number): Promise<UserAccount | null> {
    const db = await getDatabase();
    return db.getFirstAsync<UserAccount>(
      'SELECT * FROM user_accounts WHERE id = ?',
      [id]
    );
  }

  async updateLastLogin(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE user_accounts SET last_login_at = ? WHERE id = ?',
      [now(), id]
    );
  }

  async updateDisplayName(id: number, displayName: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE user_accounts SET display_name = ? WHERE id = ?',
      [displayName.trim(), id]
    );
  }

  async emailExists(email: string): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM user_accounts WHERE email = ?',
      [email.trim().toLowerCase()]
    );
    return (row?.cnt ?? 0) > 0;
  }

  async getAccountCount(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM user_accounts',
      []
    );
    return row?.cnt ?? 0;
  }

  async deleteAccount(id: number): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      // FK cascades handle child data
      await db.runAsync('DELETE FROM user_accounts WHERE id = ?', [id]);
    });
  }
}

// ─── Workout Repository ──────────────────────────────────────────────────────

export class WorkoutRepository {
  async getSessions(limit?: number, offset?: number): Promise<WorkoutSession[]> {
    const db = await getDatabase();
    const userId = uid();
    let query = 'SELECT * FROM workout_sessions WHERE user_id = ? ORDER BY date DESC, start_time DESC';
    const params: (string | number)[] = [userId];
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }
    if (offset) {
      query += ' OFFSET ?';
      params.push(offset);
    }
    return db.getAllAsync<WorkoutSession>(query, params);
  }

  async getSession(id: number): Promise<WorkoutSession | null> {
    const db = await getDatabase();
    const userId = uid();
    return db.getFirstAsync<WorkoutSession>(
      'SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  }

  async getSessionsByDateRange(startDate: string, endDate: string): Promise<WorkoutSession[]> {
    const db = await getDatabase();
    const userId = uid();
    return db.getAllAsync<WorkoutSession>(
      'SELECT * FROM workout_sessions WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC',
      [userId, startDate, endDate]
    );
  }

  async getWeeklySessionCount(weekStart: string, weekEnd: string): Promise<number> {
    const db = await getDatabase();
    const userId = uid();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM workout_sessions WHERE user_id = ? AND date BETWEEN ? AND ?',
      [userId, weekStart, weekEnd]
    );
    return result?.count ?? 0;
  }

  async createSession(session: Omit<WorkoutSession, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<number> {
    const db = await getDatabase();
    const userId = uid();
    const ts = now();
    const result = await db.runAsync(
      `INSERT INTO workout_sessions (user_id, date, start_time, end_time, duration_minutes, program_id, program_name, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, session.date, session.start_time, session.end_time ?? null, session.duration_minutes ?? null,
       session.program_id ?? null, session.program_name ?? null, session.notes, ts, ts]
    );
    return result.lastInsertRowId;
  }

  async updateSession(id: number, updates: Partial<WorkoutSession>): Promise<void> {
    const db = await getDatabase();
    const userId = uid();

    if (updates.end_time && updates.duration_minutes === undefined) {
      const session = await this.getSession(id);
      if (session?.start_time) {
        const duration = minutesBetweenTimeStrings(session.start_time, updates.end_time);
        if (duration !== null && duration >= 0) {
          updates = { ...updates, duration_minutes: duration };
        }
      }
    }

    const ts = now();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.end_time !== undefined) { fields.push('end_time'); values.push(updates.end_time); }
    if (updates.duration_minutes !== undefined) { fields.push('duration_minutes'); values.push(updates.duration_minutes); }
    if (updates.notes !== undefined) { fields.push('notes'); values.push(updates.notes); }
    fields.push('updated_at');
    values.push(ts);

    values.push(id);
    values.push(userId);
    await db.runAsync(
      `UPDATE workout_sessions SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
  }

  async getSessionSummaries(limit = 50): Promise<Array<{
    id: number; date: string; name: string; duration: number;
    exercises: number; sets: number; volume: number; notes: string;
  }>> {
    const db = await getDatabase();
    const userId = uid();
    const sessions = await db.getAllAsync<WorkoutSession & { notes: string }>(
      'SELECT * FROM workout_sessions WHERE user_id = ? ORDER BY date DESC, start_time DESC LIMIT ?',
      [userId, limit]
    );
    if (sessions.length === 0) return [];

    const sessionIds = sessions.map(s => s.id!);
    const placeholders = sessionIds.map(() => '?').join(',');

    const exRows = await db.getAllAsync<{ session_id: number; exercise_count: number }>(
      `SELECT session_id, COUNT(*) as exercise_count FROM workout_exercises WHERE session_id IN (${placeholders}) GROUP BY session_id`,
      sessionIds
    );

    const exIdRows = await db.getAllAsync<{ id: number; session_id: number }>(
      `SELECT id, session_id FROM workout_exercises WHERE session_id IN (${placeholders})`,
      sessionIds
    );

    const exIds = exIdRows.map(r => r.id);
    let setRows: { exercise_id: number; set_count: number; volume: number }[] = [];
    if (exIds.length > 0) {
      const exPlaceholders = exIds.map(() => '?').join(',');
      setRows = await db.getAllAsync<{ exercise_id: number; set_count: number; volume: number }>(
        `SELECT we.id as exercise_id, COUNT(ws.id) as set_count,
                COALESCE(SUM(ws.weight_kg * ws.reps), 0) as volume
         FROM workout_exercises we
         LEFT JOIN workout_sets ws ON ws.exercise_id = we.id
         WHERE we.id IN (${exPlaceholders})
         GROUP BY we.id`,
        exIds
      );
    }

    const exBySession = new Map(exRows.map(r => [r.session_id, r.exercise_count]));
    const exIdToSession = new Map(exIdRows.map(r => [r.id, r.session_id]));
    const setsBySession = new Map<number, { sets: number; volume: number }>();
    for (const row of setRows) {
      const sid = exIdToSession.get(row.exercise_id);
      if (sid === undefined) continue;
      const agg = setsBySession.get(sid) ?? { sets: 0, volume: 0 };
      agg.sets += row.set_count;
      agg.volume += row.volume;
      setsBySession.set(sid, agg);
    }

    return sessions.map(s => ({
      id: s.id!,
      date: s.date,
      name: s.program_name || 'Workout',
      duration: s.duration_minutes ?? 0,
      exercises: exBySession.get(s.id!) ?? 0,
      sets: setsBySession.get(s.id!)?.sets ?? 0,
      volume: Math.round(setsBySession.get(s.id!)?.volume ?? 0),
      notes: s.notes ?? '',
    }));
  }

  async deleteSession(id: number): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.runAsync('DELETE FROM workout_sessions WHERE id = ? AND user_id = ?', [id, userId]);
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
    const ts = now();
    const result = await db.runAsync(
      `INSERT INTO workout_exercises (session_id, exercise_id, exercise_name, order_index, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [exercise.session_id, exercise.exercise_id, exercise.exercise_name, exercise.order_index,
       exercise.notes, ts]
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
    const userId = uid();
    const exercise = await db.getFirstAsync<WorkoutExercise>(
      `SELECT we.id, we.session_id FROM workout_exercises we
       JOIN workout_sessions ws ON we.session_id = ws.id
       WHERE we.exercise_id = ? AND ws.user_id = ? ORDER BY we.session_id DESC LIMIT 1`,
      [exerciseId, userId]
    );
    if (!exercise) return null;

    const sets = await this.getSetsByExercise(exercise.id!);
    const session = await this.getSession(exercise.session_id);
    if (!session) return null;

    return { sets, sessionDate: session.date, sessionId: exercise.session_id };
  }

  async createSet(setData: Omit<WorkoutSet, 'id' | 'created_at'>): Promise<number> {
    const db = await getDatabase();
    const ts = now();
    const result = await db.runAsync(
      `INSERT INTO workout_sets (exercise_id, set_number, weight_kg, reps, completed, rpe, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [setData.exercise_id, setData.set_number, setData.weight_kg, setData.reps,
       setData.completed ? 1 : 0, setData.rpe ?? null, ts]
    );
    return result.lastInsertRowId;
  }

  async getTodaysSession(): Promise<WorkoutSession | null> {
    const today = todayLocal();
    const db = await getDatabase();
    const userId = uid();
    return db.getFirstAsync<WorkoutSession>(
      'SELECT * FROM workout_sessions WHERE user_id = ? AND date = ? AND end_time IS NULL LIMIT 1',
      [userId, today]
    );
  }
}

// ─── Nutrition Repository ────────────────────────────────────────────────────

export class NutritionRepository {
  async getMealsByDate(date: string): Promise<Meal[]> {
    const db = await getDatabase();
    const userId = uid();
    return db.getAllAsync<Meal>(
      'SELECT * FROM meals WHERE user_id = ? AND date = ? ORDER BY CASE meal_type WHEN "breakfast" THEN 1 WHEN "lunch" THEN 2 WHEN "dinner" THEN 3 WHEN "snack" THEN 4 END',
      [userId, date]
    );
  }

  async createMeal(meal: Omit<Meal, 'id' | 'created_at' | 'user_id'>): Promise<number> {
    const db = await getDatabase();
    const userId = uid();
    const ts = now();
    const result = await db.runAsync(
      `INSERT INTO meals (user_id, date, meal_type, name, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, meal.date, meal.meal_type, meal.name, meal.notes, ts]
    );
    return result.lastInsertRowId;
  }

  async deleteMeal(id: number): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.runAsync('DELETE FROM meals WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async getMealItems(mealId: number): Promise<MealItem[]> {
    const db = await getDatabase();
    return db.getAllAsync<MealItem>('SELECT * FROM meal_items WHERE meal_id = ?', [mealId]);
  }

  async getMealItemsByMealIds(mealIds: number[]): Promise<Map<number, MealItem[]>> {
    if (mealIds.length === 0) return new Map();
    const db = await getDatabase();
    const placeholders = mealIds.map(() => '?').join(',');
    const items = await db.getAllAsync<MealItem & { meal_id: number }>(
      `SELECT * FROM meal_items WHERE meal_id IN (${placeholders}) ORDER BY meal_id`,
      mealIds
    );
    const itemsByMealId = new Map<number, MealItem[]>();
    for (const item of items) {
      if (!itemsByMealId.has(item.meal_id)) itemsByMealId.set(item.meal_id, []);
      itemsByMealId.get(item.meal_id)!.push(item);
    }
    return itemsByMealId;
  }

  async createMealItem(item: Omit<MealItem, 'id' | 'created_at'>): Promise<number> {
    const db = await getDatabase();
    const ts = now();
    const result = await db.runAsync(
      `INSERT INTO meal_items (meal_id, food_id, food_name, quantity, unit, calories, protein_g, carbs_g, fat_g, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.meal_id, item.food_id, item.food_name, item.quantity, item.unit,
       item.calories, item.protein_g, item.carbs_g, item.fat_g, ts]
    );
    return result.lastInsertRowId;
  }

  async deleteMealItem(id: number): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.runAsync(
      'DELETE FROM meal_items WHERE id = ? AND meal_id IN (SELECT id FROM meals WHERE user_id = ?)',
      [id, userId]
    );
  }

  async updateMealItem(id: number, updates: { quantity: number; calories: number; protein_g: number; carbs_g: number; fat_g: number }): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.runAsync(
      'UPDATE meal_items SET quantity = ?, calories = ?, protein_g = ?, carbs_g = ?, fat_g = ? WHERE id = ? AND meal_id IN (SELECT id FROM meals WHERE user_id = ?)',
      [updates.quantity, updates.calories, updates.protein_g, updates.carbs_g, updates.fat_g, id, userId]
    );
  }

  async getDailyNutrition(date: string): Promise<{ calories: number; protein: number; carbs: number; fat: number }> {
    const db = await getDatabase();
    const userId = uid();
    const result = await db.getFirstAsync<{ calories: number; protein: number; carbs: number; fat: number }>(
      `SELECT
        COALESCE(SUM(mi.calories), 0) as calories,
        COALESCE(SUM(mi.protein_g), 0) as protein,
        COALESCE(SUM(mi.carbs_g), 0) as carbs,
        COALESCE(SUM(mi.fat_g), 0) as fat
       FROM meal_items mi
       JOIN meals m ON mi.meal_id = m.id
       WHERE m.user_id = ? AND m.date = ?`,
      [userId, date]
    );
    return result ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  async getAverageDailyCalories(days: number): Promise<number> {
    const db = await getDatabase();
    const userId = uid();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const result = await db.getFirstAsync<{ avg: number }>(
      `SELECT AVG(daily_calories) as avg FROM (
        SELECT m.date, COALESCE(SUM(mi.calories), 0) as daily_calories
        FROM meals m JOIN meal_items mi ON m.id = mi.meal_id
        WHERE m.user_id = ? AND m.date >= ? GROUP BY m.date
      )`,
      [userId, formatDateLocal(startDate)]
    );
    return result?.avg ?? 0;
  }

  async getNutritionLogCount(days: number): Promise<number> {
    const db = await getDatabase();
    const userId = uid();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM (
        SELECT DISTINCT m.date FROM meals m WHERE m.user_id = ? AND m.date >= ?
      )`,
      [userId, formatDateLocal(startDate)]
    );
    return result?.count ?? 0;
  }

  async getCustomFoods(): Promise<CustomFood[]> {
    const db = await getDatabase();
    const userId = uid();
    return db.getAllAsync<CustomFood>('SELECT * FROM custom_foods WHERE user_id = ? ORDER BY name', [userId]);
  }

  async createCustomFood(food: Omit<CustomFood, 'id' | 'created_at' | 'user_id'>): Promise<number> {
    const db = await getDatabase();
    const userId = uid();
    const ts = now();
    const result = await db.runAsync(
      `INSERT INTO custom_foods (user_id, name, serving_size, unit, calories, protein_g, carbs_g, fat_g, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, food.name, food.serving_size, food.unit, food.calories, food.protein_g, food.carbs_g, food.fat_g, ts]
    );
    return result.lastInsertRowId;
  }

  async deleteCustomFood(id: number): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.runAsync('DELETE FROM custom_foods WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async updateCustomFood(id: number, food: Omit<CustomFood, 'id' | 'created_at' | 'user_id'>): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.runAsync(
      `UPDATE custom_foods SET name = ?, serving_size = ?, unit = ?, calories = ?, protein_g = ?, carbs_g = ?, fat_g = ? WHERE id = ? AND user_id = ?`,
      [food.name, food.serving_size, food.unit, food.calories, food.protein_g, food.carbs_g, food.fat_g, id, userId]
    );
  }

  async getAllMeals(): Promise<Meal[]> {
    const db = await getDatabase();
    const userId = uid();
    return db.getAllAsync<Meal>('SELECT * FROM meals WHERE user_id = ? ORDER BY date, id', [userId]);
  }

  async getAllMealItems(): Promise<MealItem[]> {
    const db = await getDatabase();
    const userId = uid();
    return db.getAllAsync<MealItem>(
      `SELECT mi.* FROM meal_items mi
       JOIN meals m ON mi.meal_id = m.id
       WHERE m.user_id = ?
       ORDER BY mi.meal_id, mi.id`,
      [userId]
    );
  }
}

// ─── Measurement Repository ──────────────────────────────────────────────────

export class MeasurementRepository {
  async getMeasurements(limit?: number): Promise<BodyMeasurement[]> {
    const db = await getDatabase();
    const userId = uid();
    let query = 'SELECT * FROM body_measurements WHERE user_id = ? ORDER BY date DESC';
    const params: (string | number)[] = [userId];
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }
    return db.getAllAsync<BodyMeasurement>(query, params);
  }

  async getMeasurementsByDateRange(startDate: string, endDate: string): Promise<BodyMeasurement[]> {
    const db = await getDatabase();
    const userId = uid();
    return db.getAllAsync<BodyMeasurement>(
      'SELECT * FROM body_measurements WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date',
      [userId, startDate, endDate]
    );
  }

  async getLatestMeasurement(): Promise<BodyMeasurement | null> {
    const db = await getDatabase();
    const userId = uid();
    return db.getFirstAsync<BodyMeasurement>(
      'SELECT * FROM body_measurements WHERE user_id = ? ORDER BY date DESC LIMIT 1',
      [userId]
    );
  }

  async createMeasurement(measurement: Omit<BodyMeasurement, 'id' | 'created_at' | 'user_id'>): Promise<number> {
    const db = await getDatabase();
    const userId = uid();
    const ts = now();
    const result = await db.runAsync(
      `INSERT INTO body_measurements (user_id, date, weight_kg, waist_cm, chest_cm, arm_cm, thigh_cm,
       body_fat_percent, muscle_mass_kg, bmi, water_percent, visceral_fat, phase_angle, source, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, measurement.date, measurement.weight_kg, measurement.waist_cm, measurement.chest_cm,
       measurement.arm_cm, measurement.thigh_cm, measurement.body_fat_percent, measurement.muscle_mass_kg,
       measurement.bmi, measurement.water_percent, measurement.visceral_fat, measurement.phase_angle,
       measurement.source, measurement.notes, ts]
    );
    return result.lastInsertRowId;
  }

  async deleteMeasurement(id: number): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.runAsync('DELETE FROM body_measurements WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async getDaysSinceLastMeasurement(): Promise<number> {
    const latest = await this.getLatestMeasurement();
    if (!latest) return Infinity;
    const parts = latest.date.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return Infinity;
    const lastDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const nowDate = new Date();
    const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
    const diff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }
}

// ─── Goal Repository ─────────────────────────────────────────────────────────

export class GoalRepository {
  async getActiveGoals(): Promise<Goal[]> {
    const db = await getDatabase();
    const userId = uid();
    return db.getAllAsync<Goal>('SELECT * FROM goals WHERE user_id = ? AND is_active = 1 ORDER BY created_at', [userId]);
  }

  async getAllGoals(): Promise<Goal[]> {
    const db = await getDatabase();
    const userId = uid();
    return db.getAllAsync<Goal>('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  }

  async getGoal(id: number): Promise<Goal | null> {
    const db = await getDatabase();
    const userId = uid();
    return db.getFirstAsync<Goal>('SELECT * FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<number> {
    const db = await getDatabase();
    const userId = uid();
    const ts = now();
    const result = await db.runAsync(
      `INSERT INTO goals (user_id, goal_type, name, start_value, target_value, current_value, unit,
       start_date, target_date, is_active, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, goal.goal_type, goal.name, goal.start_value, goal.target_value, goal.current_value,
       goal.unit, goal.start_date, goal.target_date, goal.is_active ? 1 : 0, goal.notes, ts, ts]
    );
    return result.lastInsertRowId;
  }

  async updateGoal(id: number, updates: Partial<Goal>): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    const ts = now();
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    if (updates.current_value !== undefined) { fields.push('current_value'); values.push(updates.current_value); }
    if (updates.is_active !== undefined) { fields.push('is_active'); values.push(updates.is_active ? 1 : 0); }
    if (updates.notes !== undefined) { fields.push('notes'); values.push(updates.notes); }
    if (updates.target_value !== undefined) { fields.push('target_value'); values.push(updates.target_value); }
    fields.push('updated_at');
    values.push(ts);

    values.push(id);
    values.push(userId);
    await db.runAsync(
      `UPDATE goals SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
  }

  async deleteGoal(id: number): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.runAsync('DELETE FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async getGoalProgress(id: number): Promise<number> {
    const goal = await this.getGoal(id);
    if (!goal || goal.start_value === goal.target_value) return 0;
    const current = goal.current_value ?? goal.start_value;
    const progress = ((current - goal.start_value) / (goal.target_value - goal.start_value)) * 100;
    return Math.max(0, Math.min(100, progress));
  }
}

// ─── Daily Log Repository ────────────────────────────────────────────────────

export class DailyLogRepository {
  async getLog(date: string): Promise<DailyLog | null> {
    const db = await getDatabase();
    const userId = uid();
    return db.getFirstAsync<DailyLog>('SELECT * FROM daily_logs WHERE user_id = ? AND date = ?', [userId, date]);
  }

  async getLogsByDateRange(startDate: string, endDate: string): Promise<DailyLog[]> {
    const db = await getDatabase();
    const userId = uid();
    return db.getAllAsync<DailyLog>(
      'SELECT * FROM daily_logs WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date',
      [userId, startDate, endDate]
    );
  }

  async getOrCreateLog(date: string): Promise<number> {
    const db = await getDatabase();
    const userId = uid();
    let log = await this.getLog(date);
    if (log) return log.id!;

    const ts = now();
    const result = await db.runAsync(
      `INSERT INTO daily_logs (user_id, date, weight_kg, water_liters, sleep_hours, steps,
       workout_completed, nutrition_logged, mood, notes, created_at)
       VALUES (?, ?, NULL, NULL, NULL, NULL, 0, 0, NULL, '', ?)`,
      [userId, date, ts]
    );
    return result.lastInsertRowId;
  }

  async updateLog(id: number, updates: Partial<DailyLog>): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
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
    values.push(userId);
    await db.runAsync(
      `UPDATE daily_logs SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
  }

  async getWorkoutDaysCount(days: number): Promise<number> {
    const db = await getDatabase();
    const userId = uid();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(DISTINCT date) as count FROM workout_sessions WHERE user_id = ? AND end_time IS NOT NULL AND date >= ?",
      [userId, formatDateLocal(startDate)]
    );
    return result?.count ?? 0;
  }

  async getHydrationGoalDaysCount(days: number): Promise<number> {
    const db = await getDatabase();
    const userId = uid();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(DISTINCT date) as count FROM hydration_entries WHERE user_id = ? AND date >= ?',
      [userId, formatDateLocal(startDate)]
    );
    return result?.count ?? 0;
  }
}

// ─── Hydration Repository ────────────────────────────────────────────────────

export class HydrationRepository {
  async getTodaysHydration(date: string): Promise<number> {
    const db = await getDatabase();
    const userId = uid();
    const result = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount_liters), 0) as total FROM hydration_entries WHERE user_id = ? AND date = ?',
      [userId, date]
    );
    return result?.total ?? 0;
  }

  async addEntry(entry: Omit<HydrationEntry, 'id' | 'created_at' | 'user_id'>): Promise<number> {
    const db = await getDatabase();
    const userId = uid();
    const ts = now();
    const result = await db.runAsync(
      `INSERT INTO hydration_entries (user_id, date, time, amount_liters, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, entry.date, entry.time, entry.amount_liters, entry.source, ts]
    );
    return result.lastInsertRowId;
  }

  async getEntriesByDate(date: string): Promise<HydrationEntry[]> {
    const db = await getDatabase();
    const userId = uid();
    return db.getAllAsync<HydrationEntry>(
      'SELECT * FROM hydration_entries WHERE user_id = ? AND date = ? ORDER BY time',
      [userId, date]
    );
  }

  async getAllEntries(): Promise<HydrationEntry[]> {
    const db = await getDatabase();
    const userId = uid();
    return db.getAllAsync<HydrationEntry>('SELECT * FROM hydration_entries WHERE user_id = ? ORDER BY date, time', [userId]);
  }

  async deleteEntry(id: number): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.runAsync('DELETE FROM hydration_entries WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async updateEntry(id: number, amount_ml: number): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    const amount_liters = amount_ml / 1000;
    await db.runAsync('UPDATE hydration_entries SET amount_liters = ? WHERE id = ? AND user_id = ?', [amount_liters, id, userId]);
  }
}

// ─── Settings Repository ─────────────────────────────────────────────────────

const FITNESS_LEVEL_MAP: Record<string, Profile['activity_level']> = {
  beginner: 'lightly_active',
  intermediate: 'moderately_active',
  advanced: 'very_active',
};

const USER_GOAL_MAP: Record<string, Profile['fitness_goal']> = {
  lose_weight: 'weight_loss',
  build_muscle: 'muscle_gain',
  maintain_weight: 'general_fitness',
  improve_fitness: 'general_fitness',
  increase_strength: 'strength',
  improve_endurance: 'endurance',
};

const DAYS_MAP: Record<number, string> = {
  1: 'monday',
  2: 'tues_thurs',
  3: 'mon_wed_fri',
  4: 'tues_wed_thurs_sat',
  5: 'mon_tues_thurs_fri_sat',
  6: 'mon_tues_wed_thurs_fri_sat',
  7: 'everyday',
};

export class SettingsRepository {
  async getProfile(): Promise<Profile> {
    const db = await getDatabase();
    const userId = uid();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM user_profile WHERE user_id = ? LIMIT 1',
      [userId]
    );
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
    const trainingDays = (row.training_days as number) || 3;
    return {
      id: row.id as number,
      name: ((row.first_name as string) || '') + (row.last_name ? ' ' + row.last_name : ''),
      age: row.age as number | null,
      sex: (row.gender as Profile['sex']) || 'male',
      height_cm: (row.height_cm as number) || 182,
      current_weight_kg: (row.weight_kg as number) || 75,
      activity_level: FITNESS_LEVEL_MAP[row.fitness_level as string] || 'moderately_active',
      fitness_goal: USER_GOAL_MAP[row.goal as string] || 'general_fitness',
      preferred_workout_days: DAYS_MAP[trainingDays] || 'mon_wed_fri',
      created_at: (row.created_at as string) || new Date().toISOString(),
      updated_at: (row.updated_at as string) || new Date().toISOString()
    };
  }

  async getNutritionTargets(): Promise<NutritionTargets> {
    const db = await getDatabase();
    const userId = uid();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM app_settings WHERE user_id = ? LIMIT 1',
      [userId]
    );
    if (!row) {
      return { calories_kcal: 2200, protein_g: 150, carbohydrates_g: 250, fat_g: 70, hydration_liters: 2.5 };
    }
    return {
      id: row.id as number,
      calories_kcal: row.nutrition_calories as number,
      protein_g: row.nutrition_protein as number,
      carbohydrates_g: row.nutrition_carbs as number,
      fat_g: row.nutrition_fat as number,
      hydration_liters: row.nutrition_hydration as number
    };
  }

  async updateProfile(updates: Partial<Profile>): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    const existing = await this.getProfile();
    const merged = { ...existing, ...updates };

    const firstName = (merged.name || '').trim().split(' ')[0] || '';
    const lastName = (merged.name || '').trim().split(' ').slice(1).join(' ') || '';

    const REVERSE_LEVEL: Record<string, string> = {
      sedentary: 'beginner', lightly_active: 'beginner',
      moderately_active: 'intermediate', very_active: 'advanced',
    };
    const REVERSE_GOAL: Record<string, string> = {
      weight_loss: 'lose_weight', muscle_gain: 'build_muscle',
      general_fitness: 'improve_fitness', strength: 'increase_strength',
      endurance: 'improve_endurance',
    };

    const levelKey = Object.entries(FITNESS_LEVEL_MAP).find(([, v]) => v === merged.activity_level)?.[1] || 'intermediate';

    const existingProfile = await userProfileRepo.get();
    if (existingProfile?.id) {
      await userProfileRepo.update(existingProfile.id, {
        first_name: firstName,
        last_name: lastName,
        age: merged.age,
        gender: merged.sex,
        height_cm: merged.height_cm,
        weight_kg: merged.current_weight_kg,
        goal: (Object.entries(USER_GOAL_MAP).find(([, v]) => v === merged.fitness_goal)?.[0] || 'improve_fitness') as any,
        fitness_level: levelKey as any,
      });
    }
  }

  async updateNutritionTargets(targets: Partial<NutritionTargets>): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    const fields: string[] = [];
    const values: number[] = [];

    if (targets.calories_kcal !== undefined) { fields.push('nutrition_calories'); values.push(targets.calories_kcal); }
    if (targets.protein_g !== undefined) { fields.push('nutrition_protein'); values.push(targets.protein_g); }
    if (targets.carbohydrates_g !== undefined) { fields.push('nutrition_carbs'); values.push(targets.carbohydrates_g); }
    if (targets.fat_g !== undefined) { fields.push('nutrition_fat'); values.push(targets.fat_g); }
    if (targets.hydration_liters !== undefined) { fields.push('nutrition_hydration'); values.push(targets.hydration_liters); }

    if (fields.length > 0) {
      values.push(userId);
      await db.runAsync(
        `UPDATE app_settings SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE user_id = ?`,
        values
      );
    }
  }

  async getNotificationSettings(): Promise<import('../models').NotificationSettings> {
    const db = await getDatabase();
    const userId = uid();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM app_settings WHERE user_id = ? LIMIT 1',
      [userId]
    );
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

  async updateNotificationSettings(settings: import('../models').NotificationSettingsUpdate): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
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
      values.push(userId);
      await db.runAsync(
        `UPDATE app_settings SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE user_id = ?`,
        values
      );
    }
  }

  async getAppearance(): Promise<import('../models').AppAppearance> {
    const db = await getDatabase();
    const userId = uid();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM app_settings WHERE user_id = ? LIMIT 1',
      [userId]
    );
    return {
      theme: (row?.theme as import('../models').AppAppearance['theme']) || 'system',
      unit_system: (row?.unit_system as import('../models').AppAppearance['unit_system']) || 'metric'
    };
  }

  async updateAppearance(appearance: Partial<import('../models').AppAppearance>): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    const fields: string[] = [];
    const values: string[] = [];

    if (appearance.theme !== undefined) { fields.push('theme'); values.push(appearance.theme); }
    if (appearance.unit_system !== undefined) { fields.push('unit_system'); values.push(appearance.unit_system); }

    if (fields.length > 0) {
      values.push(String(userId));
      await db.runAsync(
        `UPDATE app_settings SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE user_id = ?`,
        values
      );
    }
  }

  async getLastWeeklyReviewDate(): Promise<string | null> {
    const db = await getDatabase();
    const userId = uid();
    const row = await db.getFirstAsync<{ last_weekly_review_date: string | null }>(
      'SELECT last_weekly_review_date FROM app_settings WHERE user_id = ? LIMIT 1',
      [userId]
    );
    return row?.last_weekly_review_date ?? null;
  }

  async setLastWeeklyReviewDate(date: string): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.runAsync('UPDATE app_settings SET last_weekly_review_date = ? WHERE user_id = ?', [date, userId]);
  }
}

// ─── Custom Workout Repository ───────────────────────────────────────────────

export class CustomWorkoutRepository {
  async getAll(): Promise<import('../models').CustomWorkout[]> {
    const db = await getDatabase();
    const userId = uid();
    return db.getAllAsync<import('../models').CustomWorkout>(
      'SELECT * FROM custom_workouts WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
  }

  async getById(id: number): Promise<import('../models').CustomWorkout | null> {
    const db = await getDatabase();
    const userId = uid();
    return db.getFirstAsync<import('../models').CustomWorkout>(
      'SELECT * FROM custom_workouts WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  }

  async create(workout: Omit<import('../models').CustomWorkout, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<number> {
    const db = await getDatabase();
    const userId = uid();
    const ts = now();
    const result = await db.runAsync(
      'INSERT INTO custom_workouts (user_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [userId, workout.name, workout.description, ts, ts]
    );
    return result.lastInsertRowId;
  }

  async update(id: number, updates: Partial<Pick<import('../models').CustomWorkout, 'name' | 'description'>>): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    const ts = now();
    const fields: string[] = [];
    const values: (string | number)[] = [];
    if (updates.name !== undefined) { fields.push('name'); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push('description'); values.push(updates.description); }
    fields.push('updated_at');
    values.push(ts);
    values.push(id);
    values.push(userId);
    await db.runAsync(
      `UPDATE custom_workouts SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
  }

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM custom_workouts WHERE id = ? AND user_id = ?', [id, userId]);
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
        `UPDATE custom_workout_exercises SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ? AND custom_workout_id IN (SELECT id FROM custom_workouts WHERE user_id = ?)`,
        [...values, uid()]
      );
    }
  }

  async deleteExercise(id: number): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.runAsync(
      'DELETE FROM custom_workout_exercises WHERE id = ? AND custom_workout_id IN (SELECT id FROM custom_workouts WHERE user_id = ?)',
      [id, userId]
    );
  }

  async deleteAllExercises(workoutId: number): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.runAsync(
      'DELETE FROM custom_workout_exercises WHERE custom_workout_id = ? AND custom_workout_id IN (SELECT id FROM custom_workouts WHERE user_id = ?)',
      [workoutId, userId]
    );
  }

  async reorderExercises(workoutId: number, exerciseIds: number[]): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.withTransactionAsync(async () => {
      for (let i = 0; i < exerciseIds.length; i++) {
        await db.runAsync(
          'UPDATE custom_workout_exercises SET order_index = ? WHERE id = ? AND custom_workout_id = ? AND custom_workout_id IN (SELECT id FROM custom_workouts WHERE user_id = ?)',
          [i, exerciseIds[i], workoutId, userId]
        );
      }
    });
  }
}

// ─── User Profile Repository ─────────────────────────────────────────────────

export class UserProfileRepository {
  async get(): Promise<UserProfile | null> {
    const db = await getDatabase();
    const userId = uid();
    return db.getFirstAsync<UserProfile>('SELECT * FROM user_profile WHERE user_id = ? LIMIT 1', [userId]);
  }

  async create(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const db = await getDatabase();
    const ts = now();
    const result = await db.runAsync(
      `INSERT INTO user_profile (user_id, first_name, last_name, age, gender, height_cm, weight_kg, goal, fitness_level, training_days, session_duration, equipment, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [profile.user_id, profile.first_name, profile.last_name, profile.age, profile.gender,
       profile.height_cm, profile.weight_kg, profile.goal, profile.fitness_level,
       profile.training_days, profile.session_duration, profile.equipment, ts, ts]
    );
    return result.lastInsertRowId;
  }

  async update(id: number, updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
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
      values.push(userId);
      await db.runAsync(
        `UPDATE user_profile SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ? AND user_id = ?`,
        values
      );
    }
  }
}

// ─── Security Repository ─────────────────────────────────────────────────────

export interface SecurityInfo {
  pin_salt: string | null;
  pin_hash: string | null;
  pin_length: number | null;
}

export class SecurityRepository {
  async getSecurity(): Promise<SecurityInfo | null> {
    const db = await getDatabase();
    const userId = uid();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT pin_salt, pin_hash, pin_length FROM app_security WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [userId]
    );
    if (!row || !row.pin_hash || !row.pin_salt) return null;
    return {
      pin_salt: row.pin_salt as string,
      pin_hash: row.pin_hash as string,
      pin_length: (row.pin_length as number) || null,
    };
  }

  async setPin(pinHash: string, pinSalt: string, pinLength: number): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM app_security WHERE user_id = ?', [userId]);
      await db.runAsync(
        'INSERT INTO app_security (user_id, pin_salt, pin_hash, pin_length, pin_set_at) VALUES (?, ?, ?, ?, ?)',
        [userId, pinSalt, pinHash, pinLength, now()]
      );
    });
  }

  async clearPin(): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.runAsync('DELETE FROM app_security WHERE user_id = ?', [userId]);
  }

  async isPremium(): Promise<boolean> {
    const db = await getDatabase();
    const userId = uid();
    const row = await db.getFirstAsync<{ is_premium: number }>(
      'SELECT is_premium FROM app_settings WHERE user_id = ? LIMIT 1',
      [userId]
    );
    return !!row && row.is_premium === 1;
  }

  async setPremium(value: boolean): Promise<void> {
    const db = await getDatabase();
    const userId = uid();
    await db.runAsync('UPDATE app_settings SET is_premium = ? WHERE user_id = ?', [value ? 1 : 0, userId]);
  }
}

// ─── Singleton instances ─────────────────────────────────────────────────────

export const accountRepo = new AccountRepository();
export const workoutRepo = new WorkoutRepository();
export const nutritionRepo = new NutritionRepository();
export const measurementRepo = new MeasurementRepository();
export const goalRepo = new GoalRepository();
export const dailyLogRepo = new DailyLogRepository();
export const hydrationRepo = new HydrationRepository();
export const settingsRepo = new SettingsRepository();
export const customWorkoutRepo = new CustomWorkoutRepository();
export const securityRepo = new SecurityRepository();
export const userProfileRepo = new UserProfileRepository();
