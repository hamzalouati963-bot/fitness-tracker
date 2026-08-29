import * as SQLite from 'expo-sqlite/next';

const DB_NAME = 'fitness_tracker.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await runMigrations();
  return db;
}

async function runMigrations() {
  const database = await getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_minutes REAL,
      program_id TEXT,
      program_name TEXT,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      exercise_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      reps INTEGER NOT NULL,
      completed INTEGER DEFAULT 0,
      rpe REAL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      name TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL,
      food_id TEXT NOT NULL,
      food_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      calories REAL NOT NULL,
      protein_g REAL NOT NULL,
      carbs_g REAL NOT NULL,
      fat_g REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS body_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      weight_kg REAL,
      waist_cm REAL,
      chest_cm REAL,
      arm_cm REAL,
      thigh_cm REAL,
      body_fat_percent REAL,
      muscle_mass_kg REAL,
      bmi REAL,
      water_percent REAL,
      visceral_fat REAL,
      phase_angle REAL,
      source TEXT DEFAULT 'manual',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_type TEXT NOT NULL,
      name TEXT NOT NULL,
      start_value REAL NOT NULL,
      target_value REAL NOT NULL,
      current_value REAL,
      unit TEXT NOT NULL,
      start_date TEXT NOT NULL,
      target_date TEXT,
      is_active INTEGER DEFAULT 1,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      weight_kg REAL,
      water_liters REAL,
      sleep_hours REAL,
      steps INTEGER,
      workout_completed INTEGER DEFAULT 0,
      nutrition_logged INTEGER DEFAULT 0,
      mood INTEGER,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hydration_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      amount_liters REAL NOT NULL,
      source TEXT DEFAULT 'manual',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      serving_size REAL NOT NULL,
      unit TEXT NOT NULL,
      calories REAL NOT NULL,
      protein_g REAL NOT NULL,
      carbs_g REAL NOT NULL,
      fat_g REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_name TEXT,
      profile_age INTEGER,
      profile_sex TEXT DEFAULT 'male',
      profile_height_cm REAL DEFAULT 182,
      profile_current_weight_kg REAL DEFAULT 116.2,
      profile_activity_level TEXT DEFAULT 'sedentary',
      profile_fitness_goal TEXT DEFAULT 'weight_loss',
      profile_workout_days TEXT DEFAULT 'mon_wed_fri',
      nutrition_calories INTEGER DEFAULT 2200,
      nutrition_protein INTEGER DEFAULT 150,
      nutrition_carbs INTEGER DEFAULT 250,
      nutrition_fat INTEGER DEFAULT 70,
      nutrition_hydration REAL DEFAULT 2.5,
      notification_workout_enabled INTEGER DEFAULT 1,
      notification_workout_time TEXT DEFAULT '08:00',
      notification_hydration_enabled INTEGER DEFAULT 1,
      notification_hydration_interval INTEGER DEFAULT 60,
      notification_meal_enabled INTEGER DEFAULT 1,
      notification_meal_time TEXT DEFAULT '12:00',
      notification_measurement_enabled INTEGER DEFAULT 0,
      notification_measurement_interval INTEGER DEFAULT 7,
      notification_weekly_enabled INTEGER DEFAULT 1,
      notification_weekly_day TEXT DEFAULT 'sunday',
      notification_weekly_time TEXT DEFAULT '20:00',
      theme TEXT DEFAULT 'system',
      unit_system TEXT DEFAULT 'metric',
      last_weekly_review_date TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date);
    CREATE INDEX IF NOT EXISTS idx_workout_exercises_session ON workout_exercises(session_id);
    CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
    CREATE INDEX IF NOT EXISTS idx_meal_items_meal ON meal_items(meal_id);
    CREATE INDEX IF NOT EXISTS idx_body_measurements_date ON body_measurements(date);
    CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(is_active);
    CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
    CREATE INDEX IF NOT EXISTS idx_hydration_entries_date ON hydration_entries(date);
    CREATE INDEX IF NOT EXISTS idx_custom_foods_name ON custom_foods(name);
  `);

  // Seed initial profile if not exists
  const settingsCount = await database.getFirstAsync<{ id: number }>(
    'SELECT id FROM app_settings LIMIT 1'
  );

  if (!settingsCount) {
    await database.runAsync(
      `INSERT INTO app_settings (
        profile_name, profile_age, profile_sex, profile_height_cm, profile_current_weight_kg,
        profile_activity_level, profile_fitness_goal, profile_workout_days,
        nutrition_calories, nutrition_protein, nutrition_carbs, nutrition_fat, nutrition_hydration,
        notification_workout_enabled, notification_workout_time,
        notification_hydration_enabled, notification_hydration_interval,
        notification_meal_enabled, notification_meal_time,
        notification_measurement_enabled, notification_measurement_interval,
        notification_weekly_enabled, notification_weekly_day, notification_weekly_time,
        theme, unit_system
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        '', null, 'male', 182, 116.2,
        'sedentary', 'weight_loss', 'mon_wed_fri',
        2200, 150, 250, 70, 2.5,
        1, '08:00',
        1, 60,
        1, '12:00',
        0, 7,
        1, 'sunday', '20:00',
        'system', 'metric'
      ]
    );
  }
}

export async function closeDatabase() {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
