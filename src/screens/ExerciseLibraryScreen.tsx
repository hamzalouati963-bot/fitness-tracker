import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { exercises, type Exercise } from '../services';

interface ExerciseLibraryScreenProps {
  navigation: any;
}

const muscleGroups = [
  { id: 'chest', label: 'Chest', icon: '🏋️' },
  { id: 'back', label: 'Back', icon: '💪' },
  { id: 'shoulders', label: 'Shoulders', icon: '⬆️' },
  { id: 'arms', label: 'Arms', icon: '💪' },
  { id: 'legs', label: 'Legs', icon: '🦵' },
  { id: 'core', label: 'Core', icon: '📏' },
  { id: 'cardio', label: 'Cardio', icon: '🏃' },
  { id: 'full_body', label: 'Full Body', icon: '💥' },
];

const getDifficultyColor = (d: string) => {
  switch (d) {
    case 'beginner': return '#10B981';
    case 'intermediate': return '#F59E0B';
    case 'advanced': return '#EF4444';
    default: return '#6B7280';
  }
};

const getEquipmentIcon = (e: string) => {
  switch (e) {
    case 'bodyweight': return '🧘';
    case 'barbell': return '🏋️';
    case 'dumbbells': return '💪';
    case 'machine': return '⚙️';
    case 'cables': return '🛰️';
    case 'kettlebell': return '⚡';
    case 'cardio': return '🏃';
    default: return '🛠️';
  }
};

export default function ExerciseLibraryScreen({ navigation }: ExerciseLibraryScreenProps) {
  const exercisesByGroup = (groupId: string): Exercise[] =>
    exercises.filter(e => e.muscle_group === groupId);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise Library</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.groupsContainer}>
        {muscleGroups.map((group) => (
          <View key={group.id} style={styles.groupRow}>
            <Text style={styles.groupIcon}>{group.icon}</Text>
            <Text style={styles.groupLabel}>{group.label}</Text>
            <Text style={styles.groupCount}>{exercisesByGroup(group.id).length}</Text>
          </View>
        ))}
      </View>

      {muscleGroups.map((group) => {
        const groupExercises = exercisesByGroup(group.id);
        if (groupExercises.length === 0) return null;
        return (
          <View key={`exercises-${group.id}`} style={styles.exercisesSection}>
            <Text style={styles.sectionTitle}>{group.icon} {group.label}</Text>
            <View style={styles.exercisesList}>
              {groupExercises.map((exercise) => (
                <View key={exercise.id} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <View style={styles.exerciseBadges}>
                      <View style={[styles.badge, { backgroundColor: getDifficultyColor(exercise.difficulty) }]}>
                        <Text style={styles.badgeText}>{exercise.difficulty}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseEquipment}>{getEquipmentIcon(exercise.equipment)} {exercise.equipment}</Text>
                    {exercise.instructions?.length > 0 && (
                      <Text style={styles.exerciseRest}>{exercise.default_rest_seconds}s rest</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      })}

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
    fontWeight: '600',
    color: '#1F2937',
  },
  groupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  groupIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  groupLabel: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  groupCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  exercisesSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  exercisesList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  exerciseCard: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  exerciseBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  exerciseEquipment: {
    fontSize: 12,
    color: '#6B7280',
  },
  exerciseRest: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  spacer: {
    height: 20,
  },
});