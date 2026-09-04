import { todayLocal, formatDateLocal, dateDaysAgoLocal, getStartOfWeekLocal, getEndOfWeekLocal } from '../dates';

describe('Date Utilities', () => {
  describe('todayLocal', () => {
    it('returns YYYY-MM-DD format', () => {
      const result = todayLocal();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns today date', () => {
      const result = todayLocal();
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      expect(result).toBe(`${year}-${month}-${day}`);
    });
  });

  describe('formatDateLocal', () => {
    it('formats Date object to YYYY-MM-DD', () => {
      const d = new Date(2025, 2, 15); // March 15, 2025
      expect(formatDateLocal(d)).toBe('2025-03-15');
    });

    it('formats another Date object', () => {
      const d = new Date(2025, 11, 25); // December 25, 2025
      expect(formatDateLocal(d)).toBe('2025-12-25');
    });

    it('returns todayLocal() for empty input', () => {
      expect(formatDateLocal(new Date())).toBe(todayLocal());
    });
  });

  describe('dateDaysAgoLocal', () => {
    it('returns date N days ago', () => {
      const result = dateDaysAgoLocal(7);
      const expected = new Date();
      expected.setDate(expected.getDate() - 7);
      const year = expected.getFullYear();
      const month = String(expected.getMonth() + 1).padStart(2, '0');
      const day = String(expected.getDate()).padStart(2, '0');
      expect(result).toBe(`${year}-${month}-${day}`);
    });

    it('returns today for 0 days', () => {
      expect(dateDaysAgoLocal(0)).toBe(todayLocal());
    });
  });

  describe('getStartOfWeekLocal', () => {
    it('returns Monday', () => {
      const result = getStartOfWeekLocal();
      const date = new Date(result + 'T00:00:00');
      expect(date.getDay()).toBe(1); // Monday
    });

    it('returns same week for any day', () => {
      const today = todayLocal();
      const start = getStartOfWeekLocal();
      const todayDate = new Date(today + 'T00:00:00');
      const startDate = new Date(start + 'T00:00:00');
      const diff = todayDate.getTime() - startDate.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      expect(days).toBeGreaterThanOrEqual(0);
      expect(days).toBeLessThan(7);
    });
  });

  describe('getEndOfWeekLocal', () => {
    it('returns Sunday', () => {
      const result = getEndOfWeekLocal();
      const date = new Date(result + 'T00:00:00');
      expect(date.getDay()).toBe(0); // Sunday
    });

    it('end is 6 days after start', () => {
      const start = new Date(getStartOfWeekLocal() + 'T00:00:00');
      const end = new Date(getEndOfWeekLocal() + 'T00:00:00');
      const diff = end.getTime() - start.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      expect(days).toBe(6);
    });
  });
});
