/**
 * Validation de backup — pure, testable en Node.
 * Format v2.0 : tables completes. v1.0 : profil + targets uniquement (legacy).
 */
export interface BackupValidation {
  valid: boolean;
  version: string | null;
  error?: string;
}

const REQUIRED_V2_TABLES = [
  'workouts', 'workout_exercises', 'workout_sets',
  'meals', 'meal_items',
  'body_measurements', 'goals', 'daily_logs', 'hydration_entries',
] as const;

/** Taille maximale acceptee pour le texte JSON d'un backup (10 Mo). */
export const MAX_BACKUP_JSON_LENGTH = 10 * 1024 * 1024;

export function isBackupSizeAllowed(json: string): boolean {
  return typeof json === 'string' && json.length <= MAX_BACKUP_JSON_LENGTH;
}

export function validateBackup(json: unknown): BackupValidation {
  if (typeof json !== 'object' || json === null) {
    return { valid: false, version: null, error: 'Invalid file: not a JSON object' };
  }
  const data = json as Record<string, unknown>;
  if (typeof data.version !== 'string') {
    return { valid: false, version: null, error: 'Invalid backup: missing version' };
  }
  if (data.version === '1.0') {
    if (!data.profile) {
      return { valid: false, version: '1.0', error: 'Invalid backup: missing profile' };
    }
    return { valid: true, version: '1.0' };
  }
  if (data.version === '2.0') {
    for (const table of REQUIRED_V2_TABLES) {
      const rows = data[table];
      if (!Array.isArray(rows)) {
        return { valid: false, version: '2.0', error: `Invalid backup: missing table "${table}"` };
      }
      if (rows.some(row => typeof row !== 'object' || row === null)) {
        return { valid: false, version: '2.0', error: `Invalid backup: malformed rows in "${table}"` };
      }
    }
    return { valid: true, version: '2.0' };
  }
  return { valid: false, version: data.version, error: `Unsupported backup version: ${data.version}` };
}

/** minutes entre deux heures locales "HH:MM" (gere le passage de minuit) */
export function minutesBetweenTimeStrings(start: string, end: string): number | null {
  const parse = (t: string) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(t || '');
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const s = parse(start);
  const e = parse(end);
  if (s === null || e === null) return null;
  let diff = e - s;
  if (diff < 0) diff += 24 * 60; // chevauche minuit
  return diff;
}