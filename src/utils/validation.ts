/**
 * Reusable input validation for the fitness tracker.
 * Returns null if valid, or an error message string if invalid.
 */

export function validatePositiveNumber(value: string, label: string): string | null {
  if (value.trim() === '') return `${label} is required`;
  const num = parseFloat(value);
  if (isNaN(num)) return `${label} must be a number`;
  if (num < 0) return `${label} cannot be negative`;
  return null;
}

export function validateAge(value: string): string | null {
  if (value.trim() === '') return 'Age is required';
  const num = parseInt(value, 10);
  if (isNaN(num)) return 'Age must be a number';
  if (num < 10 || num > 120) return 'Age must be between 10 and 120';
  return null;
}

export function validateHeight(value: string): string | null {
  if (value.trim() === '') return 'Height is required';
  const num = parseFloat(value);
  if (isNaN(num)) return 'Height must be a number';
  if (num < 50 || num > 300) return 'Height must be between 50 and 300 cm';
  return null;
}

export function validateWeight(value: string): string | null {
  if (value.trim() === '') return 'Weight is required';
  const num = parseFloat(value);
  if (isNaN(num)) return 'Weight must be a number';
  if (num < 20 || num > 500) return 'Weight must be between 20 and 500 kg';
  return null;
}

export function validateCalories(value: string): string | null {
  if (value.trim() === '') return 'Calories is required';
  const num = parseFloat(value);
  if (isNaN(num)) return 'Calories must be a number';
  if (num < 0) return 'Calories cannot be negative';
  if (num > 10000) return 'Calories seems too high (max 10,000)';
  return null;
}

export function validateMacro(value: string, label: string): string | null {
  if (value.trim() === '') return null; // macros can be optional
  const num = parseFloat(value);
  if (isNaN(num)) return `${label} must be a number`;
  if (num < 0) return `${label} cannot be negative`;
  if (num > 1000) return `${label} seems too high`;
  return null;
}

export function validateReps(value: string): string | null {
  if (value.trim() === '') return 'Reps is required';
  const num = parseInt(value, 10);
  if (isNaN(num)) return 'Reps must be a whole number';
  if (num < 1) return 'Reps must be at least 1';
  if (num > 999) return 'Reps cannot exceed 999';
  return null;
}

export function validateSets(value: string): string | null {
  if (value.trim() === '') return 'Sets is required';
  const num = parseInt(value, 10);
  if (isNaN(num)) return 'Sets must be a whole number';
  if (num < 1) return 'Sets must be at least 1';
  if (num > 50) return 'Sets cannot exceed 50';
  return null;
}

export function validateExerciseWeight(value: string): string | null {
  if (value.trim() === '') return null; // bodyweight exercises
  const num = parseFloat(value);
  if (isNaN(num)) return 'Weight must be a number';
  if (num < 0) return 'Weight cannot be negative';
  if (num > 1000) return 'Weight seems too high';
  return null;
}

export function validateWaterMl(value: string): string | null {
  if (value.trim() === '') return 'Amount is required';
  const num = parseFloat(value);
  if (isNaN(num)) return 'Amount must be a number';
  if (num <= 0) return 'Amount must be greater than 0';
  if (num > 5000) return 'Amount seems too high (max 5,000 ml)';
  return null;
}

export function validateGoalValue(value: string, label: string): string | null {
  if (value.trim() === '') return `${label} is required`;
  const num = parseFloat(value);
  if (isNaN(num)) return `${label} must be a number`;
  if (num < 0) return `${label} cannot be negative`;
  return null;
}

export function validateRequiredText(value: string, label: string): string | null {
  if (value.trim() === '') return `${label} is required`;
  return null;
}
