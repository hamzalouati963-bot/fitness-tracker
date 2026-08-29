import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface WeeklyReviewScreenProps {
  navigation: any;
}

export default function WeeklyReviewScreen({ navigation }: WeeklyReviewScreenProps) {
  const [weekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1); // Start of current week (Monday)
    return d.toISOString().split('T')[0];
  });

  const [weekEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 7);
    return d.toISOString().split('T')[0];
  });

  // Mock data for weekly review
  const workoutsCompleted = 3;
  const workoutsPlanned = 3;
  const nutritionDaysLogged = 6;
  const hydrationDaysReached = 5;
  const currentWeight = 112.8;
  const progressPercentage = 85;

  const suggestions = [
    'Maintain your current workout frequency — 3 workouts this week is great!',
    'Continue logging meals consistently. You logged nutrition on 6 out of 7 days.',
    'Hydration goal reached on 5 days. Try to hit 7/7 next week.',
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Review</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Recommendations')}>
          <Icon name="lightbulb" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <View style={styles.periodCard}>
        <Text style={styles.periodTitle}>WEEKLY REVIEW</Text>
        <Text style={styles.periodDate}>
          {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — 
          {new Date(weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        {/* Workouts */}
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🏋️</Text>
          <Text style={styles.statCategory}>WORKOUTS</Text>
          <View style={styles.statMain}>
            <Text style={styles.statValue}>{workoutsCompleted}</Text>
            <Text style={styles.statSubtext}>/ {workoutsPlanned} completed</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, (workoutsCompleted/workoutsPlanned)*100)}%` }]} />
          </View>
        </View>

        {/* Nutrition */}
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🍽️</Text>
          <Text style={styles.statCategory}>NUTRITION</Text>
          <View style={styles.statMain}>
            <Text style={styles.statValue}>{nutritionDaysLogged}</Text>
            <Text style={styles.statSubtext}>/ 7 days logged</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(nutritionDaysLogged/7)*100}%` }]} />
          </View>
        </View>

        {/* Hydration */}
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>💧</Text>
          <Text style={styles.statCategory}>HYDRATION</Text>
          <View style={styles.statMain}>
            <Text style={styles.statValue}>{hydrationDaysReached}</Text>
            <Text style={styles.statSubtext}>/ 7 days reached</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(hydrationDaysReached/7)*100}%` }]} />
          </View>
        </View>

        {/* Weight */}
        <View style={[styles.statCard, styles.weightCard]}>
          <Text style={styles.statIcon}>⚖️</Text>
          <Text style={styles.statCategory}>WEIGHT</Text>
          <Text style={styles.currentWeight}>{currentWeight.toFixed(1)}</Text>
          <Text style={styles.weightUnit}>kg</Text>
          <Text style={styles.lastWeekText}>Last week: 114.0 kg</Text>
          <View style={styles.weightChange}>
            <Text style={styles.weightChangeValue}>-1.2 kg</Text>
          </View>
        </View>
      </View>

      {/* Overall Progress */}
      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>⭐ CONSISTENCY</Text>
        <View style={styles.bigProgressCard}>
          <Text style={styles.bigPercent}>{progressPercentage}%</Text>
          <Text style={styles.bigLabel}>weekly consistency</Text>
          <View style={styles.bigProgressBar}>
            <View style={[styles.bigProgressFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.consistencyLabel}>
            You completed {workoutsCompleted} of {workoutsPlanned} planned workouts, logged nutrition {nutritionDaysLogged} days, and reached hydration goals {hydrationDaysReached} days this week.
          </Text>
        </View>
      </View>

      {/* Suggestions */}
      <View style={styles.suggestionsSection}>
        <Text style={styles.sectionTitle}>SUGGESTIONS FOR NEXT WEEK</Text>
        {suggestions.map((s, i) => (
          <View key={i} style={styles.suggestionItem}>
            <Icon name="lightbulb-outline" size={20} color="#F59E0B" />
            <Text style={styles.suggestionText}>{s}</Text>
          </View>
        ))}
        <View style={styles.emptyDataAlert}>
          <Icon name="info-outline" size={16} color="#6B7280" />
          <Text style={styles.emptyDataText}>
            These suggestions are based on your weekly data. If a category shows 0/7, focus on that area next week.
          </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  periodCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  periodTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  periodDate: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 16,
    gap: 10,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  statMain: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  statSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  weightCard: {
    alignItems: 'center',
  },
  currentWeight: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
  },
  weightUnit: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: -8,
    marginBottom: 4,
  },
  lastWeekText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  weightChange: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  weightChangeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  progressSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  bigProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bigPercent: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2563EB',
    textAlign: 'center',
  },
  bigLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  bigProgressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  bigProgressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 5,
  },
  consistencyLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    gap: 10,
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
    lineHeight: 20,
  },
  emptyDataAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 14,
    gap: 8,
    marginTop: 8,
  },
  emptyDataText: {
    flex: 1,
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 18,
  },
  spacer: {
    height: 20,
  },
});

export { WeeklyReviewScreen };
