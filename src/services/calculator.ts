/**
 * Calculs fitness purs (aucune dépendance React Native) — testables en Node.
 */
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