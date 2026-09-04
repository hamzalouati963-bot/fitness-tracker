/**
 * Shared state for cross-screen communication without callback-via-params.
 * Used by ExercisePicker → CreateCustomWorkoutScreen flow.
 */

import type { Exercise } from '../services';

let _pendingExercise: Exercise | null = null;

export function setPendingExercise(exercise: Exercise): void {
  _pendingExercise = exercise;
}

export function consumePendingExercise(): Exercise | null {
  const ex = _pendingExercise;
  _pendingExercise = null;
  return ex;
}
