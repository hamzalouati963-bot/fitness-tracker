import {
  validateBackup,
  isBackupSizeAllowed,
  MAX_BACKUP_JSON_LENGTH,
} from '../backup';

const validV2 = {
  version: '2.0',
  workouts: [],
  workout_exercises: [],
  workout_sets: [],
  meals: [],
  meal_items: [],
  body_measurements: [],
  goals: [],
  daily_logs: [],
  hydration_entries: [],
};

describe('Backup validation', () => {
  describe('validateBackup', () => {
    it('accepts a valid v2.0 backup', () => {
      const result = validateBackup(validV2);
      expect(result.valid).toBe(true);
      expect(result.version).toBe('2.0');
    });

    it('rejects non-object payloads', () => {
      expect(validateBackup(null).valid).toBe(false);
      expect(validateBackup('string').valid).toBe(false);
      expect(validateBackup(42).valid).toBe(false);
    });

    it('rejects missing version', () => {
      const { version, ...noVersion } = validV2;
      expect(validateBackup(noVersion).valid).toBe(false);
    });

    it('rejects unsupported version', () => {
      expect(validateBackup({ ...validV2, version: '9.9' }).valid).toBe(false);
    });

    it('rejects v2.0 missing a required table', () => {
      const { meals, ...missing } = validV2 as Record<string, unknown>;
      expect(validateBackup(missing).valid).toBe(false);
    });

    it('rejects v2.0 with malformed (non-object) rows', () => {
      expect(
        validateBackup({ ...validV2, meals: [{ id: 1 }, 'not-a-row'] }).valid
      ).toBe(false);
      expect(validateBackup({ ...validV2, goals: [null] }).valid).toBe(false);
    });

    it('accepts v2.0 with empty tables', () => {
      expect(validateBackup(validV2).valid).toBe(true);
    });

    it('accepts legacy v1.0 with profile, rejects without', () => {
      expect(validateBackup({ version: '1.0', profile: { name: 'x' } }).valid).toBe(true);
      expect(validateBackup({ version: '1.0' }).valid).toBe(false);
    });
  });

  describe('isBackupSizeAllowed', () => {
    it('accepts normal-size payloads', () => {
      expect(isBackupSizeAllowed('{"version":"2.0"}')).toBe(true);
    });

    it('rejects oversized payloads', () => {
      expect(isBackupSizeAllowed('x'.repeat(MAX_BACKUP_JSON_LENGTH + 1))).toBe(false);
    });

    it('accepts payloads exactly at the limit', () => {
      expect(isBackupSizeAllowed('x'.repeat(MAX_BACKUP_JSON_LENGTH))).toBe(true);
    });
  });
});
