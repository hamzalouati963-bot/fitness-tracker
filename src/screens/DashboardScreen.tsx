import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { WorkoutRepository, NutritionRepository, HydrationRepository, GoalRepository, MeasurementRepository, SettingsRepository, UserProfileRepository } from '../database/repositories';
import { RecommendationService } from '../services';
import type { UserProfile, UserGoal } from '../models';

interface DashboardScreenProps {
  navigation: any;
}

const GOAL_LABELS: Record<UserGoal, string> = {
  lose_weight: 'Lose Weight',
  build_muscle: 'Build Muscle',
  maintain_weight: 'Maintain Weight',
  improve_fitness: 'Improve Fitness',
  increase_strength: 'Increase Strength',
  improve_endurance: 'Improve Endurance',
};

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null);
  const [goalProgress, setGoalProgress] = useState<number | null>(null);
  const [hydration, setHydration] = useState({ current: 0, target: 2.5 });
  const [nutrition, setNutrition] = useState({ calories: 0, target: 2200 });
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyCount, setWeeklyCount] = useState(0);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardData = useCallback(async () => {
    try {
      const workoutRepo = new WorkoutRepository();
      const hydrationRepo = new HydrationRepository();
      const nutritionRepo = new NutritionRepository();
      const goalRepo = new GoalRepository();
      const measurementRepo = new MeasurementRepository();
      const settingsRepo = new SettingsRepository();
      const profileRepo = new UserProfileRepository();
      const today = new Date().toISOString().split('T')[0];

      const userProfile = await profileRepo.get();
      setProfile(userProfile);

      const session = await workoutRepo.getTodaysSession();
      setTodaysWorkout(session);

      const [loggedWater, targets, totals, activeGoals, latestMeasurement] = await Promise.all([
        hydrationRepo.getTodaysHydration(today),
        settingsRepo.getNutritionTargets(),
        nutritionRepo.getDailyNutrition(today),
        goalRepo.getActiveGoals(),
        measurementRepo.getLatestMeasurement(),
      ]);

      setHydration({ current: loggedWater, target: targets.hydration_liters });
      setNutrition({ calories: Math.round(totals.calories), target: targets.calories_kcal });
      if (latestMeasurement?.weight_kg) setCurrentWeight(latestMeasurement.weight_kg);
      else if (userProfile?.weight_kg) setCurrentWeight(userProfile.weight_kg);

      if (activeGoals.length > 0) {
        const goal = activeGoals[0];
        const progress = await goalRepo.getGoalProgress(goal.id!);
        setGoalProgress(progress);
      }

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + (6 - weekEnd.getDay()));
      weekEnd.setHours(23, 59, 59, 999);
      const wCount = await workoutRepo.getWeeklySessionCount(
        weekStart.toISOString().split('T')[0],
        weekEnd.toISOString().split('T')[0]
      );
      setWeeklyCount(wCount);

      const recommendationService = new RecommendationService(
        workoutRepo, nutritionRepo, measurementRepo, goalRepo,
        new (await import('../database/repositories')).DailyLogRepository(),
        hydrationRepo, settingsRepo
      );
      const recs = await recommendationService.generateRecommendations();
      setSuggestions(recs.slice(0, 3).map(r => r.message));
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  return (
    <ScrollView style={styles.container} refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    }>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}, {profile?.first_name || 'there'} 👋</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        {profile && (
          <TouchableOpacity style={styles.goalBadge} onPress={() => navigation.navigate('More', { screen: 'Profile' })}>
            <Text style={styles.goalBadgeText}>🎯 {GOAL_LABELS[profile.goal]}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TODAY</Text>

        {todaysWorkout ? (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Workout', { sessionId: todaysWorkout.id })}
          >
            <View style={styles.cardRow}>
              <View>
                <Text style={styles.cardTitle}>🏋️ Workout</Text>
                <Text style={styles.cardSubtitle}>{todaysWorkout.program_name || 'In Progress'}</Text>
              </View>
              <Icon name="play-arrow" size={24} color="#2563EB" />
            </View>
            <TouchableOpacity style={styles.startButton}>
              <Text style={styles.startButtonText}>Continue Workout</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('More', { screen: 'CustomWorkouts' })}
          >
            <View style={styles.cardRow}>
              <View>
                <Text style={styles.cardTitle}>🏋️ Workout</Text>
                <Text style={styles.cardSubtitle}>No workout planned today</Text>
              </View>
              <Icon name="add-circle" size={24} color="#2563EB" />
            </View>
            <Text style={styles.cardHint}>Create your workout to start training</Text>
            <TouchableOpacity style={styles.startButton}>
              <Text style={styles.startButtonText}>Create Workout</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.metricsRow}>
        <TouchableOpacity
          style={[styles.metricCard, { width: '48%' }]}
          onPress={() => navigation.navigate('Nutrition')}
        >
          <Text style={styles.metricEmoji}>🍽️</Text>
          <Text style={styles.metricValue}>
            {nutrition.calories.toLocaleString()} / {nutrition.target.toLocaleString()}
          </Text>
          <Text style={styles.metricLabel}>kcal</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, (nutrition.calories / nutrition.target) * 100)}%` }]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, { width: '48%' }]}
          onPress={() => navigation.navigate('More', { screen: 'Hydration' })}
        >
          <Text style={styles.metricEmoji}>💧</Text>
          <Text style={styles.metricValue}>
            {hydration.current.toFixed(1)} / {hydration.target.toFixed(1)}
          </Text>
          <Text style={styles.metricLabel}>Liters</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, (hydration.current / hydration.target) * 100)}%` }]} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PROGRESS</Text>

        <TouchableOpacity
          style={styles.goalCard}
          onPress={() => navigation.navigate('More', { screen: 'Goals' })}
        >
          <View>
            <Text style={styles.goalTitle}>🎯 Goal Progress</Text>
            <Text style={styles.goalProgress}>
              {goalProgress !== null ? `${goalProgress.toFixed(0)}% complete` : 'No active goals'}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, goalProgress ?? 0)}%` }]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.goalCard}
          onPress={() => navigation.navigate('More', { screen: 'Measurements' })}
        >
          <View>
            <Text style={styles.goalTitle}>📊 Current Weight</Text>
            <Text style={styles.goalProgress}>
              {currentWeight !== null ? `${currentWeight.toFixed(1)} kg` : 'No measurement yet'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weeklyCount}</Text>
            <Text style={styles.statLabel}>Workouts this week</Text>
          </View>
          {profile && (
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.training_days || 3}</Text>
              <Text style={styles.statLabel}>Target days/week</Text>
            </View>
          )}
        </View>
      </View>

      {suggestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Suggestions</Text>
          {suggestions.map((s, i) => (
            <View key={i} style={styles.suggestionItem}>
              <Icon name="lightbulb" size={20} color="#F59E0B" />
              <Text style={styles.suggestionText}>{s}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
    gap: 4,
  },
  goalBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  cardHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  startButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  metricLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  goalProgress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});
