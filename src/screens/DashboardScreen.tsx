import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface DashboardScreenProps {
  navigation: any;
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null);
  const [goalProgress, setGoalProgress] = useState(0);
  const [hydration, setHydration] = useState({ current: 0, target: 2.5 });
  const [nutrition, setNutrition] = useState({ calories: 0, target: 2200 });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const profile = await getProfile();
      const workoutRepo = new WorkoutRepository();
      const today = new Date().toISOString().split('T')[0];

      const session = await workoutRepo.getTodaysSession();
      setTodaysWorkout(session);

      const hydrationRepo = new HydrationRepository();
      const settingsRepo = new SettingsRepository();
      const loggedWater = await hydrationRepo.getTodaysHydration(today);
      const targets = await settingsRepo.getNutritionTargets();
      setHydration({ current: loggedWater, target: targets.hydration_liters });

      const nutritionRepo = new NutritionRepository();
      const totals = await nutritionRepo.getDailyNutrition(today);
      setNutrition({ calories: Math.round(totals.calories), target: targets.calories_kcal });

      const goalRepo = new GoalRepository();
      const activeGoals = await goalRepo.getActiveGoals();
      if (activeGoals.length > 0) {
        const goal = activeGoals[0];
        const progress = await goalRepo.getGoalProgress(goal.id!);
        setGoalProgress(progress);
      }

      // Load suggestions
      const recs = await generateRecommendations();
      setSuggestions(recs.slice(0, 3).map(r => r.message));
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    return `${h}:${m}`;
  };

  return (
    <ScrollView style={styles.container} refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    }>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning 👋</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
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
            onPress={() => navigation.navigate('Programs')}
          >
            <View style={styles.cardRow}>
              <View>
                <Text style={styles.cardTitle}>🏋️ Workout</Text>
                <Text style={styles.cardSubtitle}>No workout planned today</Text>
              </View>
              <Icon name="add-circle" size={24} color="#2563EB" />
            </View>
            <Text style={styles.cardHint}>Start a workout to begin tracking</Text>
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
          onPress={() => navigation.navigate('Hydration')}
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
        <Text style={styles.sectionTitle}>GOALS</Text>

        <TouchableOpacity
          style={styles.goalCard}
          onPress={() => navigation.navigate('Goals')}
        >
          <View>
            <Text style={styles.goalTitle}>🎯 Goal Progress</Text>
            <Text style={styles.goalProgress}>{goalProgress.toFixed(0)}% complete</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${goalProgress}%` }]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.goalCard}
          onPress={() => navigation.navigate('Progress')}
        >
          <View>
            <Text style={styles.goalTitle}>📊 Current Weight</Text>
            <Text style={styles.goalProgress}>116.2 kg</Text>
          </View>
        </TouchableOpacity>
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
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginRight: 4,
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

// Imported types - stub for now
function getProfile() { return Promise.resolve({ preferred_workout_days: 'mon_wed_fri' }); }
function getNutritionTargets() { return Promise.resolve({ hydration_liters: 2.5, calories_kcal: 2200 }); }

class WorkoutRepository {
  async getTodaysSession() { return Promise.resolve({ id: 1, program_name: 'Full Body A' }); }
}

class HydrationRepository {
  async getTodaysHydration(date: string) { return Promise.resolve(1.5); }
}

class NutritionRepository {
  async getDailyNutrition(date: string) { return { calories: 1650, protein: 110, carbs: 180, fat: 55 }; }
}

class GoalRepository {
  async getActiveGoals() { return Promise.resolve([{ id: 1, name: 'Weight Loss', start_value: 116.2, target_value: 95 }]); }
  async getGoalProgress(id: number) { return Promise.resolve(32); }
}

async function generateRecommendations() {
  return [
    { message: 'Workout planned today. Start it to stay on track.' },
    { message: "Hydration at 60% of your daily target." },
    { message: 'Consider logging your lunch.' },
  ];
}

export { DashboardScreen };
