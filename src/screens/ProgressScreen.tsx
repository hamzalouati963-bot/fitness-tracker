import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ProgressScreenProps {
  navigation: any;
}

export default function ProgressScreen({ navigation }: ProgressScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [weightData] = useState<{ date: string; weight: number }[]>([
    { date: '2026-07-01', weight: 119.6 },
    { date: '2026-08-07', weight: 119.6 },
    { date: '2026-08-19', weight: 116.2 },
    { date: '2026-09-01', weight: 114 },
    { date: '2026-09-15', weight: 112.8 },
    { date: '2026-10-01', weight: 111.5 },
  ]);

  const [bodyFatData] = useState<{ date: string; bodyFat: number }[]>([
    { date: '2026-07-01', bodyFat: 31.9 },
    { date: '2026-08-07', bodyFat: 31.9 },
    { date: '2026-08-19', bodyFat: 31.1 },
    { date: '2026-10-01', bodyFat: 30 },
  ]);

  const [muscleMassData] = useState<{ date: string; muscleMass: number }[]>([
    { date: '2026-07-01', muscleMass: 77.4 },
    { date: '2026-08-07', muscleMass: 77.4 },
    { date: '2026-08-19', muscleMass: 76.2 },
    { date: '2026-10-01', muscleMass: 77 },
  ]);

  const [workoutsPerWeek] = useState<{ week: string; count: number }[]>([
    { week: 'Week 1', count: 2 },
    { week: 'Week 2', count: 3 },
    { week: 'Week 3', count: 3 },
    { week: 'Week 4', count: 4 },
  ]);

  const formatWeight = (w: number) => `${w.toFixed(1)} kg`;
  const formatBodyFat = (bf: number) => `${bf.toFixed(1)}%`;
  const formatMuscle = (m: number) => `${m.toFixed(1)} kg`;

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
            <Text style={styles.chartValue}>{weightData[weightData.length - 1]?.weight.toFixed(1)} kg</Text>
            <Text style={styles.chartChange}>
              From {weightData[0]?.weight.toFixed(1)} → {weightData[weightData.length - 1]?.weight.toFixed(1)} kg
            </Text>
            <Text style={[styles.chartBadge, { backgroundColor: weightData[weightData.length - 1]?.weight < weightData[0]?.weight ? '#D1FAE5' : '#FEE2E2' }]}>
              {weightData[weightData.length - 1]?.weight < weightData[0]?.weight ? '↓ Losing' : '↑ Gaining'}
            </Text>
          </View>
        </View>
        <View style={styles.chartPoints}>
          {weightData.map((d, i) => (
            <View key={i} style={styles.chartPoint}>
              <View style={[styles.chartDot, { backgroundColor: i === weightData.length - 1 ? '#2563EB' : '#93C5FD' }]} />
            </View>
          ))}
        </View>
      </View>

      {/* Body Fat Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>📊 Body Fat Over Time</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartValue}>{bodyFatData[bodyFatData.length - 1]?.bodyFat.toFixed(1)}%</Text>
            <Text style={styles.chartChange}>
              From {bodyFatData[0]?.bodyFat.toFixed(1)}% → {bodyFatData[bodyFatData.length - 1]?.bodyFat.toFixed(1)}%
            </Text>
            <Text style={[styles.chartBadge, { backgroundColor: bodyFatData[bodyFatData.length - 1]?.bodyFat < bodyFatData[0]?.bodyFat ? '#D1FAE5' : '#FEE2E2' }]}>
              {bodyFatData[bodyFatData.length - 1]?.bodyFat < bodyFatData[0]?.bodyFat ? '↓ Improving' : '↑ Increasing'}
            </Text>
          </View>
        </View>
      </View>

      {/* Muscle Mass Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>💪 Muscle Mass Over Time</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartValue}>{muscleMassData[muscleMassData.length - 1]?.muscleMass.toFixed(1)} kg</Text>
            <Text style={styles.chartChange}>
              From {muscleMassData[0]?.muscleMass.toFixed(1)} → {muscleMassData[muscleMassData.length - 1]?.muscleMass.toFixed(1)} kg
            </Text>
            <Text style={[styles.chartBadge, { backgroundColor: muscleMassData[muscleMassData.length - 1]?.muscleMass > muscleMassData[0]?.muscleMass ? '#D1FAE5' : '#FEE2E2' }]}>
              {muscleMassData[muscleMassData.length - 1]?.muscleMass > muscleMassData[0]?.muscleMass ? '↑ Gaining' : '↓ Losing'}
            </Text>
          </View>
        </View>
      </View>

      {/* Workouts Per Week Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>🏋️ Workouts Per Week</Text>
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
      </View>

      {/* Nutrition Summary */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>🍽️ Average Daily Calories</Text>
        <View style={styles.avgCaloriesContainer}>
          <Text style={styles.avgCaloriesValue}>1,688</Text>
          <Text style={styles.avgCaloriesUnit}>kcal / day (30-day average)</Text>
          <View style={styles.avgCaloriesBreakdown}>
            <View style={styles.avgCaloriesRow}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>135g</Text>
              <Text style={styles.macroCals}>540 kcal</Text>
            </View>
            <View style={styles.avgCaloriesRow}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>156g</Text>
              <Text style={styles.macroCals}>624 kcal</Text>
            </View>
            <View style={styles.avgCaloriesRow}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>59g</Text>
              <Text style={styles.macroCals}>531 kcal</Text>
            </View>
          </View>
        </View>
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
