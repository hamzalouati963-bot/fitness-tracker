import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface GoalsScreenProps {
  navigation: any;
}

export default function GoalsScreen({ navigation }: GoalsScreenProps) {
  const [goals, setGoals] = useState<any[]>([
    {
      id: 1,
      name: 'Weight Loss Target',
      type: 'weight',
      start_value: 116.2,
      target_value: 95,
      current_value: 112.8,
      unit: 'kg',
      is_active: true,
      progress: 25,
    },
    {
      id: 2,
      name: 'Weekly Workouts',
      type: 'workouts_per_week',
      start_value: 0,
      target_value: 4,
      current_value: 3,
      unit: 'days/week',
      is_active: true,
      progress: 75,
    },
    {
      id: 3,
      name: 'Hydration Goal',
      type: 'hydration',
      start_value: 0,
      target_value: 2.5,
      current_value: 2.5,
      unit: 'L',
      is_active: true,
      progress: 100,
    },
  ]);

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    type: 'weight',
    start_value: '',
    target_value: '',
    unit: 'kg',
  });

  const calculateProgress = (goal: any) => {
    if (goal.start_value === goal.target_value) return 0;
    const progress = ((goal.current_value - goal.start_value) / (goal.target_value - goal.start_value)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const addGoal = () => {
    if (!newGoal.name.trim() || !newGoal.target_value) {
      Alert.alert('Error', 'Please fill in the required fields');
      return;
    }

    const goal = {
      id: Date.now(),
      name: newGoal.name,
      type: newGoal.type,
      start_value: parseFloat(newGoal.start_value) || 0,
      target_value: parseFloat(newGoal.target_value),
      current_value: parseFloat(newGoal.start_value) || 0,
      unit: newGoal.unit,
      is_active: true,
      progress: 0,
    };

    setGoals([goal, ...goals]);
    setNewGoal({ name: '', type: 'weight', start_value: '', target_value: '', unit: 'kg' });
    setShowAddGoal(false);
    Alert.alert('Goal Created', `Your goal "${goal.name}" has been created!`);
  };

  const deleteGoal = (id: number) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const goalTypes = [
    { id: 'weight', label: 'Weight', icon: '⚖️', unit: 'kg' },
    { id: 'body_measurement', label: 'Body Measurement', icon: '📏', unit: 'cm' },
    { id: 'workouts_per_week', label: 'Workouts / Week', icon: '🏋️', unit: 'days/week' },
    { id: 'hydration', label: 'Hydration', icon: '💧', unit: 'L' },
    { id: 'nutrition_tracking', label: 'Nutrition Tracking', icon: '🍽️', unit: 'days' },
    { id: 'exercise_performance', label: 'Exercise Performance', icon: '💪', unit: 'reps' },
    { id: 'custom', label: 'Custom', icon: '🎯', unit: '' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goals</Text>
        <TouchableOpacity onPress={() => setShowAddGoal(true)}>
          <Icon name="add" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>MY GOALS</Text>

      {goals.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="flag" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Goals Yet</Text>
          <Text style={styles.emptySubtitle}>Set your first goal to start tracking</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => setShowAddGoal(true)}>
            <Text style={styles.emptyButtonText}>Create Goal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.goalsList}>
          {goals.map((goal) => (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={styles.goalInfo}>
                  <View style={styles.goalTypeIcon}>
                    <Text style={styles.typeIconText}>
                      {goalTypes.find(t => t.id === goal.type)?.icon || '🎯'}
                    </Text>
                  </View>
                  <View style={styles.goalTextContainer}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalType}>
                      {goalTypes.find(t => t.id === goal.type)?.label}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => deleteGoal(goal.id)}>
                  <Icon name="delete-outline" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <View style={styles.goalProgressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressValue}>{goal.progress.toFixed(0)}%</Text>
                </View>
                <View style={styles.progressBarOuter}>
                  <View style={[styles.progressBarInner, { width: `${goal.progress}%` }]} />
                </View>
              </View>

              <View style={styles.goalMetrics}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Starting Value</Text>
                  <Text style={styles.metricValue}>{goal.start_value} {goal.unit}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Current</Text>
                  <Text style={[styles.metricValue, { color: goal.current_value < goal.start_value && goal.target_value < goal.start_value ? '#10B981' : '#1F2937' }]}>
                    {goal.current_value} {goal.unit}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Target</Text>
                  <Text style={[styles.metricValue, { color: '#2563EB' }]}>
                    {goal.target_value} {goal.unit}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.spacer} />

      {showAddGoal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Goal</Text>
              <TouchableOpacity onPress={() => setShowAddGoal(false)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Goal Name (e.g., Lose 20 kg)"
              value={newGoal.name}
              onChangeText={(text) => setNewGoal({ ...newGoal, name: text })}
            />

            <Text style={styles.label}>Goal Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeContainer}>
              {goalTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.typeChip, newGoal.type === type.id && styles.typeChipActive]}
                  onPress={() => setNewGoal({ ...newGoal, type: type.id, unit: type.unit || newGoal.unit })}
                >
                  <Text style={styles.typeIconSmall}>{type.icon}</Text>
                  <Text style={[styles.typeLabel, newGoal.type === type.id && styles.typeLabelActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Starting Value</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  value={newGoal.start_value}
                  onChangeText={(text) => setNewGoal({ ...newGoal, start_value: text })}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Target Value</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  value={newGoal.target_value}
                  onChangeText={(text) => setNewGoal({ ...newGoal, target_value: text })}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.createButton} onPress={addGoal}>
              <Text style={styles.createButtonText}>Create Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginLeft: 4,
  },
  goalsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalTypeIcon: {
    marginRight: 12,
  },
  typeIconText: {
    fontSize: 24,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  goalType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  goalProgressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  progressBarOuter: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  goalMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  spacer: {
    height: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  typeContainer: {
    height: 44,
    marginBottom: 16,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    gap: 4,
  },
  typeChipActive: {
    backgroundColor: '#2563EB',
  },
  typeIconSmall: {
    fontSize: 16,
  },
  typeLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  typeLabelActive: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  createButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export { GoalsScreen };
