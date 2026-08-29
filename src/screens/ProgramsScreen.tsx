import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ProgramsScreenProps {
  navigation: any;
}

export default function ProgramsScreen({ navigation }: ProgramsScreenProps) {
  const programs = [
    {
      id: 'beginner_full_body',
      name: 'Beginner Full Body',
      description: '8-week program, 3 days/week. Perfect for getting started.',
      duration_weeks: 8,
      days_per_week: 3,
      goal: 'general_fitness',
      days: 3,
      exercises_count: 15,
    },
    {
      id: 'strength_fundamentals',
      name: 'Strength Fundamentals',
      description: '12-week program focused on building foundational strength.',
      duration_weeks: 12,
      days_per_week: 3,
      goal: 'strength',
      days: 3,
      exercises_count: 10,
    },
    {
      id: 'hypertrophy_upper_lower',
      name: 'Hypertrophy Upper/Lower',
      description: '10-week split program for muscle growth. 4 days/week.',
      duration_weeks: 10,
      days_per_week: 4,
      goal: 'muscle_growth',
      days: 4,
      exercises_count: 15,
    },
    {
      id: 'weight_loss_beginner',
      name: 'Weight Loss Starter',
      description: '6-week gentle introduction to exercise. 3 days/week.',
      duration_weeks: 6,
      days_per_week: 3,
      goal: 'weight_loss',
      days: 3,
      exercises_count: 10,
    },
    {
      id: 'home_workout_bodyweight',
      name: 'Home Bodyweight Circuit',
      description: 'No equipment needed. 4-week program for working out at home.',
      duration_weeks: 4,
      days_per_week: 3,
      goal: 'general_fitness',
      days: 3,
      exercises_count: 8,
    },
  ];

  const handleStartProgram = (program: typeof programs[0]) => {
    // Import and start workout session
    navigation.navigate('Workout', { programId: program.id });
  };

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'weight_loss': return '⚖️';
      case 'strength': return '💪';
      case 'muscle_growth': return '🔺';
      default: return '🏋️';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header} />

      <Text style={styles.title}>Workout Programs</Text>
      <Text style={styles.subtitle}>Choose a program to start your fitness journey</Text>

      <View style={styles.grid}>
        {programs.map((program) => (
          <TouchableOpacity
            key={program.id}
            style={styles.programCard}
            onPress={() => handleStartProgram(program)}
          >
            <View style={styles.programHeader}>
              <Text style={styles.programIcon}>{getGoalIcon(program.goal)}</Text>
              <View style={styles.programMeta}>
                <Text style={styles.programDuration}>{program.duration_weeks} weeks</Text>
                <Text style={styles.programDays}>{program.days_per_week} days/week</Text>
              </View>
            </View>

            <Text style={styles.programName}>{program.name}</Text>
            <Text style={styles.programDescription}>{program.description}</Text>

            <View style={styles.programFooter}>
              <View style={styles.programStat}>
                <Icon name="fitness-center" size={16} color="#6B7280" />
                <Text style={styles.programStatText}>{program.exercises_count} exercises</Text>
              </View>
              <View style={styles.programStat}>
                <Icon name="schedule" size={16} color="#6B7280" />
                <Text style={styles.programStatText}>{program.days} days</Text>
              </View>
            </View>

            <View style={styles.startButton}>
              <Text style={styles.startButtonText}>Start Program →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.addProgramButton}
        onPress={() => {}}
      >
        <Icon name="add" size={24} color="#2563EB" />
        <Text style={styles.addProgramText}>Create Custom Program</Text>
      </TouchableOpacity>

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
    paddingBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  grid: {
    paddingHorizontal: 12,
    gap: 12,
  },
  programCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  programIcon: {
    fontSize: 28,
  },
  programMeta: {
    alignItems: 'flex-end',
  },
  programDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  programDays: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  programName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  programDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  programFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  programStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  programStatText: {
    fontSize: 13,
    color: '#6B7280',
  },
  startButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  addProgramButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  addProgramText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  spacer: {
    height: 20,
  },
});

export { ProgramsScreen };
