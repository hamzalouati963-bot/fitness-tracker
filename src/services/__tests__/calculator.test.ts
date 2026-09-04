import { CalculatorService } from '../calculator';

const calc = new CalculatorService();

describe('CalculatorService', () => {
  describe('calculateBMR', () => {
    it('calculates BMR for male', () => {
      const bmr = calc.calculateBMR('male', 80, 180, 30);
      expect(bmr).toBeGreaterThan(1500);
      expect(bmr).toBeLessThan(2000);
    });

    it('calculates BMR for female', () => {
      const bmr = calc.calculateBMR('female', 60, 165, 25);
      expect(bmr).toBeGreaterThan(1200);
      expect(bmr).toBeLessThan(1700);
    });

    it('returns 0 for invalid inputs', () => {
      expect(calc.calculateBMR('male', 0, 180, 30)).toBe(0);
      expect(calc.calculateBMR('male', 80, 0, 30)).toBe(0);
      expect(calc.calculateBMR('male', 80, 180, 0)).toBe(0);
    });
  });

  describe('calculateBMI', () => {
    it('calculates BMI correctly', () => {
      const bmi = calc.calculateBMI(80, 180);
      expect(bmi).toBeCloseTo(24.69, 1);
    });

    it('returns 0 for invalid inputs', () => {
      expect(calc.calculateBMI(0, 180)).toBe(0);
      expect(calc.calculateBMI(80, 0)).toBe(0);
    });
  });

  describe('calculateTDEE', () => {
    it('returns higher value for active person', () => {
      const sedentary = calc.calculateTDEE(1800, 'sedentary');
      const active = calc.calculateTDEE(1800, 'very_active');
      expect(active).toBeGreaterThan(sedentary);
    });

    it('returns BMR for sedentary', () => {
      const tdee = calc.calculateTDEE(1800, 'sedentary');
      expect(tdee).toBe(1800 * 1.2);
    });
  });

  describe('calculateWorkoutCalories', () => {
    it('calculates calories for strength training', () => {
      const calories = calc.calculateWorkoutCalories('strength_training', 60, 75);
      expect(calories).toBeGreaterThan(100);
      expect(calories).toBeLessThan(500);
    });

    it('returns reasonable value for running', () => {
      const calories = calc.calculateWorkoutCalories('running', 30, 75);
      expect(calories).toBeGreaterThan(0);
    });
  });

  describe('calculateMacroCalories', () => {
    it('calculates macro calories', () => {
      const cals = calc.calculateMacroCalories(50, 100, 30);
      expect(cals).toBe(50 * 4 + 100 * 4 + 30 * 9);
    });
  });

  describe('getHydrationTarget', () => {
    it('returns higher target for heavier person', () => {
      const light = calc.getHydrationTarget(60, 'sedentary');
      const heavy = calc.getHydrationTarget(100, 'sedentary');
      expect(heavy).toBeGreaterThan(light);
    });

    it('returns at least 1.0L for average person', () => {
      const target = calc.getHydrationTarget(60, 'sedentary');
      expect(target).toBeGreaterThanOrEqual(1.0);
    });
  });
});
