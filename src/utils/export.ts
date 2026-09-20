import { workoutRepo, nutritionRepo, measurementRepo, dailyLogRepo, hydrationRepo, personalRecordRepo } from '../database/repositories';
import { todayLocal, formatDateLocal } from '../utils/dates';

function toCSVRow(values: (string | number | null)[]): string {
  return values.map(v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }).join(',');
}

export async function exportWorkoutsCSV(): Promise<string> {
  const sessions = await workoutRepo.getSessions(1000);
  const header = toCSVRow(['Date', 'Start Time', 'End Time', 'Duration (min)', 'Program', 'Notes']);
  const rows = sessions.map(s =>
    toCSVRow([s.date, s.start_time, s.end_time, s.duration_minutes, s.program_name, s.notes])
  );
  return [header, ...rows].join('\n');
}

export async function exportNutritionCSV(): Promise<string> {
  const meals = await nutritionRepo.getAllMeals();
  const items = await nutritionRepo.getAllMealItems();
  const itemsByMeal = new Map<number, typeof items>();
  for (const item of items) {
    if (!itemsByMeal.has(item.meal_id)) itemsByMeal.set(item.meal_id, []);
    itemsByMeal.get(item.meal_id)!.push(item);
  }

  const header = toCSVRow(['Date', 'Meal Type', 'Meal Name', 'Food', 'Quantity', 'Unit', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)']);
  const rows: string[] = [];
  for (const meal of meals) {
    const mealItems = itemsByMeal.get(meal.id!) || [];
    for (const item of mealItems) {
      rows.push(toCSVRow([meal.date, meal.meal_type, meal.name, item.food_name, item.quantity, item.unit, item.calories, item.protein_g, item.carbs_g, item.fat_g]));
    }
  }
  return [header, ...rows].join('\n');
}

export async function exportMeasurementsCSV(): Promise<string> {
  const measurements = await measurementRepo.getMeasurements(1000);
  const header = toCSVRow(['Date', 'Weight (kg)', 'Waist (cm)', 'Chest (cm)', 'Arm (cm)', 'Thigh (cm)', 'Body Fat %', 'Muscle Mass (kg)', 'BMI', 'Source', 'Notes']);
  const rows = measurements.map(m =>
    toCSVRow([m.date, m.weight_kg, m.waist_cm, m.chest_cm, m.arm_cm, m.thigh_cm, m.body_fat_percent, m.muscle_mass_kg, m.bmi, m.source, m.notes])
  );
  return [header, ...rows].join('\n');
}

export async function exportDailyLogsCSV(): Promise<string> {
  const today = todayLocal();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 365);
  const logs = await dailyLogRepo.getLogsByDateRange(formatDateLocal(startDate), today);
  const header = toCSVRow(['Date', 'Weight (kg)', 'Water (L)', 'Sleep (h)', 'Steps', 'Workout Done', 'Nutrition Logged', 'Mood', 'Notes']);
  const rows = logs.map(l =>
    toCSVRow([l.date, l.weight_kg, l.water_liters, l.sleep_hours, l.steps, l.workout_completed ? 'Yes' : 'No', l.nutrition_logged ? 'Yes' : 'No', l.mood, l.notes])
  );
  return [header, ...rows].join('\n');
}

export async function exportAllDataCSV(): Promise<string> {
  const workouts = await exportWorkoutsCSV();
  const nutrition = await exportNutritionCSV();
  const measurements = await exportMeasurementsCSV();
  const dailyLogs = await exportDailyLogsCSV();

  return [
    '=== WORKOUTS ===',
    workouts,
    '',
    '=== NUTRITION ===',
    nutrition,
    '',
    '=== MEASUREMENTS ===',
    measurements,
    '',
    '=== DAILY LOGS ===',
    dailyLogs,
  ].join('\n');
}
