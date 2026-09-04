import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { workoutRepo, nutritionRepo, measurementRepo, dailyLogRepo } from '../database/repositories';
import { ProgressService, dateDaysAgo } from '../services';
import type { TabScreenProps } from '../navigation/types';

export default function ProgressScreen({ navigation }: TabScreenProps<'Progress'>) {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [weightData, setWeightData] = useState<{ date: string; weight: number }[]>([]);
  const [bodyFatData, setBodyFatData] = useState<{ date: string; bodyFat: number }[]>([]);
  const [muscleMassData, setMuscleMassData] = useState<{ date: string; muscleMass: number }[]>([]);
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState<{ week: string; count: number }[]>([]);
  const [avgCalories, setAvgCalories] = useState(0);
  const [avgMacros, setAvgMacros] = useState({ protein: 0, carbs: 0, fat: 0 });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const progressService = new ProgressService(
        workoutRepo,
        nutritionRepo,
        measurementRepo,
        dailyLogRepo
      );

      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '3m' ? 90 : selectedPeriod === '6m' ? 180 : selectedPeriod === '1y' ? 365 : 3650;

      const [weights, bodyFat, muscle, weeks, avgCal] = await Promise.all([
        progressService.getWeightHistory(days),
        progressService.getBodyFatHistory(days),
        progressService.getMuscleMassHistory(days),
        progressService.getWorkoutsPerWeek(4),
        progressService.getAverageCalories(30),
      ]);

      setWeightData(weights.filter(w => w.weight !== null).map(w => ({ date: w.date, weight: w.weight! })));
      setBodyFatData(bodyFat.filter(b => b.bodyFat !== null).map(b => ({ date: b.date, bodyFat: b.bodyFat! })));
      setMuscleMassData(muscle.filter(m => m.muscleMass !== null).map(m => ({ date: m.date, muscleMass: m.muscleMass! })));
      setWorkoutsPerWeek(weeks.map((w, i) => ({ week: `Week ${i + 1}`, count: w.count })));
      setAvgCalories(Math.round(avgCal));

      let p = 0, c = 0, f = 0, count = 0;
      const dailyNutrition = await Promise.all(
        Array.from({ length: 7 }, (_, i) => nutritionRepo.getDailyNutrition(dateDaysAgo(i)))
      );
      for (const totals of dailyNutrition) {
        if (totals.calories > 0) {
          p += totals.protein;
          c += totals.carbs;
          f += totals.fat;
          count++;
        }
      }
      if (count > 0) {
        setAvgMacros({
          protein: Math.round(p / count),
          carbs: Math.round(c / count),
          fat: Math.round(f / count),
        });
      }
    } catch (e) {
      console.error('Failed to load progress:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const formatWeight = (w: number) => `${w.toFixed(1)} kg`;
  const formatBodyFat = (bf: number) => `${bf.toFixed(1)}%`;
  const formatMuscle = (m: number) => `${m.toFixed(1)} kg`;

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header} />

      <Text style={styles.title}>Progress</Text>
      <Text style={styles.subtitle}>Track your fitness journey over time</Text>

      {/* Period Filters */}
      <View style={styles.periodRow}>
        {['7d', '30d', '3m', '6m', '1y', 'all'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.periodChip, selectedPeriod === period && styles.periodChipActive]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
              {period === '3m' ? '3 months' : period === '6m' ? '6 months' : period === '1y' ? '1 year' : period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Weight Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>⚖️ Weight Over Time</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartPlaceholder}>
            {weightData.length > 0 ? (
              <>
                <Text style={styles.chartValue}>{weightData[weightData.length - 1].weight.toFixed(1)} kg</Text>
                <Text style={styles.chartChange}>
                  From {weightData[0].weight.toFixed(1)} → {weightData[weightData.length - 1].weight.toFixed(1)} kg
                </Text>
                <Text style={[styles.chartBadge, { backgroundColor: weightData[weightData.length - 1].weight < weightData[0].weight ? '#D1FAE5' : '#FEE2E2' }]}>
                  {weightData[weightData.length - 1].weight < weightData[0].weight ? '↓ Losing' : '↑ Gaining'}
                </Text>
              </>
            ) : (
              <Text style={styles.noDataText}>Log your weight in Measurements to see trends</Text>
            )}
          </View>
        </View>
        {weightData.length > 0 && (
          <View style={styles.chartPoints}>
            {weightData.map((d, i) => (
              <View key={i} style={styles.chartPoint}>
                <View style={[styles.chartDot, { backgroundColor: i === weightData.length - 1 ? '#2563EB' : '#93C5FD' }]} />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Body Fat Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>📊 Body Fat Over Time</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartPlaceholder}>
            {bodyFatData.length > 0 ? (
              <>
                <Text style={styles.chartValue}>{bodyFatData[bodyFatData.length - 1].bodyFat.toFixed(1)}%</Text>
                <Text style={styles.chartChange}>
                  From {bodyFatData[0].bodyFat.toFixed(1)}% → {bodyFatData[bodyFatData.length - 1].bodyFat.toFixed(1)}%
                </Text>
                <Text style={[styles.chartBadge, { backgroundColor: bodyFatData[bodyFatData.length - 1].bodyFat < bodyFatData[0].bodyFat ? '#D1FAE5' : '#FEE2E2' }]}>
                  {bodyFatData[bodyFatData.length - 1].bodyFat < bodyFatData[0].bodyFat ? '↓ Improving' : '↑ Increasing'}
                </Text>
              </>
            ) : (
              <Text style={styles.noDataText}>No body fat data yet{'\n'}<Text style={styles.noDataHint}>Log measurements to see body fat trends</Text></Text>
            )}
          </View>
        </View>
      </View>

      {/* Muscle Mass Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>💪 Muscle Mass Over Time</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartPlaceholder}>
            {muscleMassData.length > 0 ? (
              <>
                <Text style={styles.chartValue}>{muscleMassData[muscleMassData.length - 1].muscleMass.toFixed(1)} kg</Text>
                <Text style={styles.chartChange}>
                  From {muscleMassData[0].muscleMass.toFixed(1)} → {muscleMassData[muscleMassData.length - 1].muscleMass.toFixed(1)} kg
                </Text>
                <Text style={[styles.chartBadge, { backgroundColor: muscleMassData[muscleMassData.length - 1].muscleMass > muscleMassData[0].muscleMass ? '#D1FAE5' : '#FEE2E2' }]}>
                  {muscleMassData[muscleMassData.length - 1].muscleMass > muscleMassData[0].muscleMass ? '↑ Gaining' : '↓ Losing'}
                </Text>
              </>
            ) : (
              <Text style={styles.noDataText}>No muscle mass data yet{'\n'}<Text style={styles.noDataHint}>Log measurements to track muscle mass changes</Text></Text>
            )}
          </View>
        </View>
      </View>

      {/* Workouts Per Week Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>🏋️ Workouts Per Week</Text>
        {workoutsPerWeek.length > 0 ? (
          <View style={styles.workoutsContainer}>
            {workoutsPerWeek.map((week, i) => (
              <View key={i} style={styles.workoutBar}>
                <Text style={styles.weekLabel}>{week.week}</Text>
                <View style={styles.workoutBarContainer}>
                  <View style={[styles.workoutBarFill, { width: `${(week.count / 7) * 100}%` }]} />
                </View>
                <Text style={styles.workoutCount}>{week.count}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.noDataText}>No workouts logged yet</Text>
            <Text style={styles.noDataHint}>Log workouts to see your weekly activity here</Text>
          </View>
        )}
      </View>

      {/* Nutrition Summary */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>🍽️ Average Daily Calories</Text>
        {avgCalories > 0 ? (
          <View style={styles.avgCaloriesContainer}>
            <Text style={styles.avgCaloriesValue}>{avgCalories.toLocaleString()}</Text>
            <Text style={styles.avgCaloriesUnit}>kcal / day (30-day average)</Text>
            <View style={styles.avgCaloriesBreakdown}>
              <View style={styles.avgCaloriesRow}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{avgMacros.protein > 0 ? `${avgMacros.protein}g` : '—'}</Text>
                <Text style={styles.macroCals}>{avgMacros.protein > 0 ? `${avgMacros.protein * 4} kcal` : ''}</Text>
              </View>
              <View style={styles.avgCaloriesRow}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>{avgMacros.carbs > 0 ? `${avgMacros.carbs}g` : '—'}</Text>
                <Text style={styles.macroCals}>{avgMacros.carbs > 0 ? `${avgMacros.carbs * 4} kcal` : ''}</Text>
              </View>
              <View style={styles.avgCaloriesRow}>
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroValue}>{avgMacros.fat > 0 ? `${avgMacros.fat}g` : '—'}</Text>
                <Text style={styles.macroCals}>{avgMacros.fat > 0 ? `${avgMacros.fat * 9} kcal` : ''}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.noDataText}>No nutrition data yet</Text>
            <Text style={styles.noDataHint}>Log meals to see your calorie and macro averages</Text>
          </View>
        )}
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    elevation: 1,
  },
  periodChipActive: {
    backgroundColor: '#2563EB',
  },
  periodText: {
    fontSize: 13,
    color: '#6B7280',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  chartContainer: {
    height: 180,
  },
  chartPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  noDataHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartChange: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  chartBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '600',
  },
  chartPoints: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  chartPoint: {
    alignItems: 'center',
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  workoutsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 8,
  },
  workoutBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  weekLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  workoutBarContainer: {
    width: '100%',
    height: 80,
    justifyContent: 'flex-end',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  workoutBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  workoutCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  avgCaloriesContainer: {
    alignItems: 'center',
  },
  avgCaloriesValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2563EB',
  },
  avgCaloriesUnit: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
  },
  avgCaloriesBreakdown: {
    width: '100%',
  },
  avgCaloriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  macroLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  macroCals: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  spacer: {
    height: 20,
  },
});

export { ProgressScreen };
