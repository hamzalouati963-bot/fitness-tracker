import * as SQLite from 'expo-sqlite/next';

const DB_NAME = 'fitness_tracker.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON');
  await runMigrations();
  return db;
}

async function runMigrations() {
  const database = db!;

  const statements = [
    `CREATE TABLE IF NOT EXISTS user_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      display_name TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      last_login_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS app_session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      active_user_id INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_minutes REAL,
      program_id TEXT,
      program_name TEXT,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS workout_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      exercise_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      reps INTEGER NOT NULL,
      completed INTEGER DEFAULT 0,
      rpe REAL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      name TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS meal_items (
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
    )`,
    `CREATE TABLE IF NOT EXISTS body_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
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
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
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
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS daily_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      date TEXT NOT NULL,
      weight_kg REAL,
      water_liters REAL,
      sleep_hours REAL,
      steps INTEGER,
      workout_completed INTEGER DEFAULT 0,
      nutrition_logged INTEGER DEFAULT 0,
      mood INTEGER,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
      UNIQUE(user_id, date)
    )`,
    `CREATE TABLE IF NOT EXISTS hydration_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      amount_liters REAL NOT NULL,
      source TEXT DEFAULT 'manual',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS custom_foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      serving_size REAL NOT NULL,
      unit TEXT NOT NULL,
      calories REAL NOT NULL,
      protein_g REAL NOT NULL,
      carbs_g REAL NOT NULL,
      fat_g REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
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
      last_weekly_review_date TEXT,
      is_premium INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS app_security (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      pin_salt TEXT,
      pin_hash TEXT,
      pin_length INTEGER,
      pin_set_at TEXT,
      FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_workout_sessions_user ON workout_sessions(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date)`,
    `CREATE INDEX IF NOT EXISTS idx_workout_exercises_session ON workout_exercises(session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id)`,
    `CREATE INDEX IF NOT EXISTS idx_meals_user ON meals(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date)`,
    `CREATE INDEX IF NOT EXISTS idx_meal_items_meal ON meal_items(meal_id)`,
    `CREATE INDEX IF NOT EXISTS idx_body_measurements_user ON body_measurements(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_body_measurements_date ON body_measurements(date)`,
    `CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_daily_logs_user ON daily_logs(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date)`,
    `CREATE INDEX IF NOT EXISTS idx_hydration_entries_user ON hydration_entries(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_hydration_entries_date ON hydration_entries(date)`,
    `CREATE INDEX IF NOT EXISTS idx_custom_foods_user ON custom_foods(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_custom_foods_name ON custom_foods(name)`,
    `CREATE TABLE IF NOT EXISTS custom_workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS custom_workout_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      custom_workout_id INTEGER NOT NULL,
      exercise_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      sets INTEGER DEFAULT 3,
      reps INTEGER DEFAULT 10,
      weight_kg REAL DEFAULT 0,
      rest_seconds INTEGER DEFAULT 90,
      notes TEXT DEFAULT '',
      FOREIGN KEY (custom_workout_id) REFERENCES custom_workouts(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_custom_workouts_user ON custom_workouts(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_custom_workout_exercises_workout ON custom_workout_exercises(custom_workout_id)`,
    `CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise ON workout_exercises(exercise_id)`,
    `CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      first_name TEXT NOT NULL,
      last_name TEXT DEFAULT '',
      age INTEGER,
      gender TEXT DEFAULT 'male',
      height_cm REAL,
      weight_kg REAL,
      goal TEXT NOT NULL DEFAULT 'improve_fitness',
      fitness_level TEXT NOT NULL DEFAULT 'beginner',
      training_days INTEGER DEFAULT 3,
      session_duration INTEGER DEFAULT 45,
      equipment TEXT DEFAULT 'no_equipment',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
    )`,
  ];

  await database.withTransactionAsync(async () => {
    for (const sql of statements) {
      await database.runAsync(sql, []);
    }
  });

  // Migration for existing installs: add user_id columns and create legacy account
  await migrateToMultiUser(database);

  const settingsCount = await database.getFirstAsync<{ id: number }>(
    'SELECT id FROM app_settings LIMIT 1',
    []
  );

  if (!settingsCount) {
    const legacyUserId = await getOrCreateLegacyAccount(database);
    await database.runAsync(
      `INSERT INTO app_settings (
        user_id, nutrition_calories, nutrition_protein, nutrition_carbs, nutrition_fat, nutrition_hydration,
        notification_workout_enabled, notification_workout_time,
        notification_hydration_enabled, notification_hydration_interval,
        notification_meal_enabled, notification_meal_time,
        notification_measurement_enabled, notification_measurement_interval,
        notification_weekly_enabled, notification_weekly_day, notification_weekly_time,
        theme, unit_system
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        legacyUserId,
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

/**
 * Ensures a legacy account exists for pre-multi-user data.
 * Returns the legacy account ID.
 */
async function getOrCreateLegacyAccount(database: SQLite.SQLiteDatabase): Promise<number> {
  const existing = await database.getFirstAsync<{ id: number }>(
    "SELECT id FROM user_accounts WHERE email = 'legacy@local.app' LIMIT 1",
    []
  );
  if (existing) return existing.id;

  const ts = new Date().toISOString();
  const result = await database.runAsync(
    "INSERT INTO user_accounts (email, password_hash, password_salt, display_name, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?)",
    ['legacy@local.app', 'legacy-no-password', 'legacy-salt', 'Legacy User', ts, ts]
  );
  return result.lastInsertRowId;
}

/**
 * Non-destructive migration for existing installs:
 * - Adds user_id columns to user-owned tables if missing
 * - Creates legacy account and assigns orphaned rows
 * - Adds user_id to app_settings, app_security if missing
 * - Migrates is_premium from old app_settings location
 */
async function migrateToMultiUser(database: SQLite.SQLiteDatabase): Promise<void> {
  // Check if user_accounts table has rows (migration already ran)
  const accountsCount = await database.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM user_accounts',
    []
  );
  if (accountsCount && accountsCount.cnt > 0) return; // Already migrated

  // Check if there's any existing data to migrate
  const hasOldData = await database.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM user_profile',
    []
  );
  if (!hasOldData || hasOldData.cnt === 0) return; // Fresh install, no migration needed

  // Create legacy account for existing data
  const legacyUserId = await getOrCreateLegacyAccount(database);

  // Tables that need user_id added and existing rows assigned
  const userOwnedTables = [
    'workout_sessions', 'meals', 'body_measurements', 'goals',
    'daily_logs', 'hydration_entries', 'custom_foods', 'custom_workouts',
    'user_profile',
  ];

  await database.withTransactionAsync(async () => {
    for (const table of userOwnedTables) {
      // Check if user_id column exists
      const cols = await database.getAllAsync<{ name: string }>(
        `PRAGMA table_info(${table})`,
        []
      );
      if (!cols.some(c => c.name === 'user_id')) {
        await database.runAsync(
          `ALTER TABLE ${table} ADD COLUMN user_id INTEGER NOT NULL DEFAULT ${legacyUserId}`,
          []
        );
      }
      // Assign all existing rows to legacy account
      await database.runAsync(
        `UPDATE ${table} SET user_id = ? WHERE user_id IS NULL OR user_id = 0`,
        [legacyUserId]
      );
    }

    // Migrate app_settings
    const settingsCols = await database.getAllAsync<{ name: string }>(
      'PRAGMA table_info(app_settings)',
      []
    );
    if (!settingsCols.some(c => c.name === 'user_id')) {
      await database.runAsync(
        `ALTER TABLE app_settings ADD COLUMN user_id INTEGER NOT NULL DEFAULT ${legacyUserId}`,
        []
      );
      // Copy profile data from old columns to new user_profile if needed
      await database.runAsync(
        `UPDATE app_settings SET user_id = ? WHERE user_id IS NULL OR user_id = 0`,
        [legacyUserId]
      );
    }

    // Migrate app_security
    const securityCols = await database.getAllAsync<{ name: string }>(
      'PRAGMA table_info(app_security)',
      []
    );
    if (!securityCols.some(c => c.name === 'user_id')) {
      await database.runAsync(
        `ALTER TABLE app_security ADD COLUMN user_id INTEGER NOT NULL DEFAULT ${legacyUserId}`,
        []
      );
      await database.runAsync(
        `UPDATE app_security SET user_id = ? WHERE user_id IS NULL OR user_id = 0`,
        [legacyUserId]
      );
    }

    // Migrate is_premium from old location (was in app_settings without user_id)
    const settingsPremium = await database.getAllAsync<{ name: string }>(
      'PRAGMA table_info(app_settings)',
      []
    );
    if (settingsPremium.some(c => c.name === 'is_premium')) {
      // Migrate is_premium value to the legacy user's app_settings
      const premRow = await database.getFirstAsync<{ is_premium: number }>(
        'SELECT is_premium FROM app_settings WHERE user_id = ? LIMIT 1',
        [legacyUserId]
      );
      if (premRow && premRow.is_premium) {
        await database.runAsync(
          'UPDATE app_settings SET is_premium = 1 WHERE user_id = ?',
          [legacyUserId]
        );
      }
    }
  });
}

export async function closeDatabase() {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

/**
 * Supprime TOUTES les donnees de tracking + profils, de facon transactionnelle.
 * Les structures (tables/index) sont conservees. Retourne le nombre de lignes supprimees.
 */
export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    // Ordre respectant les FK (enfants d'abord)
    await database.runAsync('DELETE FROM workout_sets', []);
    await database.runAsync('DELETE FROM workout_exercises', []);
    await database.runAsync('DELETE FROM workout_sessions', []);
    await database.runAsync('DELETE FROM meal_items', []);
    await database.runAsync('DELETE FROM meals', []);
    await database.runAsync('DELETE FROM custom_workout_exercises', []);
    await database.runAsync('DELETE FROM custom_workouts', []);
    await database.runAsync('DELETE FROM body_measurements', []);
    await database.runAsync('DELETE FROM goals', []);
    await database.runAsync('DELETE FROM daily_logs', []);
    await database.runAsync('DELETE FROM hydration_entries', []);
    await database.runAsync('DELETE FROM custom_foods', []);
    await database.runAsync('DELETE FROM user_profile', []);
    await database.runAsync('DELETE FROM app_security', []);
    await database.runAsync('DELETE FROM app_session', []);
    await database.runAsync('DELETE FROM user_accounts', []);
    // app_settings : re-seed des valeurs par defaut
    await database.runAsync('DELETE FROM app_settings', []);
  });
}
