import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface WorkoutHistoryScreenProps {
  navigation: any;
}

const mockHistory = [
  { id: 1, date: '2026-08-28', name: 'Full Body A', duration: 45, exercises: 5, sets: 15, volume: 1870, notes: 'Felt good' },
  { id: 2, date: '2026-08-26', name: 'Full Body B', duration: 42, exercises: 5, sets: 15, volume: 1740, notes: 'A bit tired' },
  { id: 3, date: '2026-08-24', name: 'Full Body A', duration: 48, exercises: 5, sets: 15, volume: 1920, notes: 'Strong workout' },
  { id: 4, date: '2026-08-21', name: 'Cardio & Core', duration: 30, exercises: 3, sets: 7, volume: 850, notes: 'Light day' },
  { id: 5, date: '2026-08-20', name: 'Full Body C', duration: 40, exercises: 5, sets: 12, volume: 1450, notes: 'First week back' },
];

const formatDuration = (min: number) => `${min} min`;
const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function WorkoutHistoryScreen({ navigation }: WorkoutHistoryScreenProps) {
  const renderItem = ({ item }: { item: typeof mockHistory[0] }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          <Text style={styles.workoutName}>{item.name}</Text>
        </View>
        <View style={styles.durationBadge}>
          <Icon name="schedule" size={14} color="#6B7280" />
          <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
        </View>
      </View>

      <View style={styles.cardStats}>
        <View style={styles.stat}>
          <Icon name="fitness-center" size={14} color="#6B7280" />
          <Text style={styles.statText}>{item.exercises} exercises</Text>
        </View>
        <View style={styles.stat}>
          <Icon name="format-quote" size={14} color="#6B7280" />
          <Text style={styles.statText}>{item.sets} sets</Text>
        </View>
        <View style={styles.stat}>
          <Icon name="local-fire-department" size={14} color="#6B7280" />
          <Text style={styles.statText}>{item.volume} kg</Text>
        </View>
      </View>

      {item.notes && (
        <Text style={styles.cardNotes}>{item.notes}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout History</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.subtitle}>{mockHistory.length} workouts logged</Text>

      <FlatList
        data={mockHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.spacer} />
    </View>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardStats: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardNotes: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  spacer: {
    height: 20,
  },
});

export { WorkoutHistoryScreen };
