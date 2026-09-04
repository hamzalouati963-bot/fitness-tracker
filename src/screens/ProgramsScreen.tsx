import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { workoutPrograms, exercises as exercisesData, todayISO, timeNow, type WorkoutProgram } from '../services';
import { workoutRepo } from '../database/repositories';
import type { MoreScreenProps } from '../navigation/types';

export default function ProgramsScreen({ navigation }: MoreScreenProps<'Programs'>) {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'weight_loss': return '⚖️';
      case 'strength': return '💪';
      case 'muscle_gain':
      case 'muscle_growth': return '🔺';
      default: return '🏋️';
    }
  };

  const startDay = async (program: WorkoutProgram, dayIndex: number) => {
    try {
      const day = program.days[dayIndex];
      const sessionId = await workoutRepo.createSession({
        date: todayISO(),
        start_time: timeNow(),
        end_time: null,
        duration_minutes: null,
        program_id: program.id,
        program_name: `${program.name} — ${day.name}`,
        notes: '',
      });

      let orderIndex = 0;
      for (const ex of day.exercises) {
        const exerciseInfo = exercisesData.find(e => e.id === ex.exercise_id);
        await workoutRepo.createExercise({
          session_id: sessionId,
          exercise_id: ex.exercise_id,
          exercise_name: exerciseInfo?.name || ex.exercise_id,
          order_index: orderIndex,
          notes: '',
        });
        orderIndex++;
      }

      Alert.alert('Workout Started', `${program.name}\nDay ${day.day}: ${day.name}`, [
        {
          text: 'Let\'s Go',
          onPress: () => navigation.navigate('Workout', { sessionId }),
        },
      ]);
    } catch (e) {
      console.error('Failed to start workout:', e);
      Alert.alert('Error', 'Failed to start workout. Please try again.');
    }
  };

  const toggleProgram = (id: string) => {
    setSelectedProgram(selectedProgram === id ? null : id);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Programs</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.title}>Workout Programs</Text>
      <Text style={styles.subtitle}>Tap a program to see its days and start a session</Text>

      <View style={styles.grid}>
        {workoutPrograms.map((program) => {
          const isOpen = selectedProgram === program.id;
          const totalExercises = program.days.reduce((acc, d) => acc + d.exercises.length, 0);
          return (
            <View key={program.id} style={styles.programCard}>
              <TouchableOpacity onPress={() => toggleProgram(program.id)}>
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
                    <Text style={styles.programStatText}>{totalExercises} exercises</Text>
                  </View>
                  <View style={styles.programStat}>
                    <Icon name="schedule" size={16} color="#6B7280" />
                    <Text style={styles.programStatText}>{program.days.length} days</Text>
                  </View>
                </View>

                <View style={styles.startButton}>
                  <Text style={styles.startButtonText}>
                    {isOpen ? 'Hide Days' : 'View Days'} →
                  </Text>
                </View>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.daysList}>
                  {program.days.map((day, i) => (
                    <TouchableOpacity
                      key={day.day}
                      style={styles.dayCard}
                      onPress={() => startDay(program, i)}
                    >
                      <View style={styles.dayInfo}>
                        <Text style={styles.dayBadge}>Day {day.day}</Text>
                        <Text style={styles.dayName}>{day.name}</Text>
                      </View>
                      <View style={styles.dayMeta}>
                        <Text style={styles.dayCount}>{day.exercises.length} exercises</Text>
                        <Icon name="play-circle" size={28} color="#2563EB" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
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
    fontWeight: '600',
    color: '#1F2937',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    paddingHorizontal: 16,
    paddingTop: 8,
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
  daysList: {
    marginTop: 12,
    gap: 8,
  },
  dayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dayBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  dayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  spacer: {
    height: 20,
  },
});