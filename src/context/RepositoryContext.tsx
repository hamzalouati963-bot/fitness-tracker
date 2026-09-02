import React, { ReactNode } from 'react';
import {
  WorkoutRepository,
  NutritionRepository,
  MeasurementRepository,
  GoalRepository,
  DailyLogRepository,
  HydrationRepository,
  SettingsRepository,
  CustomWorkoutRepository,
  UserProfileRepository,
} from '../database/repositories';

interface RepositoryContextType {
  workoutRepo: WorkoutRepository;
  nutritionRepo: NutritionRepository;
  measurementRepo: MeasurementRepository;
  goalRepo: GoalRepository;
  dailyLogRepo: DailyLogRepository;
  hydrationRepo: HydrationRepository;
  settingsRepo: SettingsRepository;
  customWorkoutRepo: CustomWorkoutRepository;
  userProfileRepo: UserProfileRepository;
}

/**
 * Global repository context - singleton instances shared across app
 * Avoids memory leaks from creating new repository instances per screen
 */
const RepositoryContext = React.createContext<RepositoryContextType | undefined>(undefined);

/**
 * Initialize all repositories once at app startup
 * These instances are reused across the entire application
 */
function createRepositories(): RepositoryContextType {
  return {
    workoutRepo: new WorkoutRepository(),
    nutritionRepo: new NutritionRepository(),
    measurementRepo: new MeasurementRepository(),
    goalRepo: new GoalRepository(),
    dailyLogRepo: new DailyLogRepository(),
    hydrationRepo: new HydrationRepository(),
    settingsRepo: new SettingsRepository(),
    customWorkoutRepo: new CustomWorkoutRepository(),
    userProfileRepo: new UserProfileRepository(),
  };
}

interface RepositoryProviderProps {
  children: ReactNode;
}

/**
 * Wrap your app root with this provider to enable repository singleton
 * Example: <RepositoryProvider><App /></RepositoryProvider>
 */
export function RepositoryProvider({ children }: RepositoryProviderProps) {
  const repositories = React.useMemo(() => createRepositories(), []);

  return (
    <RepositoryContext.Provider value={repositories}>
      {children}
    </RepositoryContext.Provider>
  );
}

/**
 * Hook to access singleton repositories throughout the app
 * Usage: const { workoutRepo, nutritionRepo, ... } = useRepositories();
 *
 * @throws Error if used outside of RepositoryProvider
 */
export function useRepositories(): RepositoryContextType {
  const context = React.useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepositories must be used within a RepositoryProvider');
  }
  return context;
}
