import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { workoutRepo } from '../database/repositories';
import type { WorkoutSession } from '../models';
import type { MoreScreenProps } from '../navigation/types';

interface SessionSummary {
  id: number;
  date: string;
  name: string;
  duration: number | null;
  exercises: number;
  sets: number;
  volume: number;
  notes: string;
}

const formatDuration = (min: number) => `${min} min`;
const formatDate = (date: string) => {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function WorkoutHistoryScreen({ navigation }: MoreScreenProps<'WorkoutHistory'>) {
  const [history, setHistory] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      // 3 requetes agregees au lieu de N+1 par seance/exercice
      const summaries = await workoutRepo.getSessionSummaries(50);
      setHistory(summaries);
    } catch (e) {
      console.error('Failed to load history:', e);
      Alert.alert('Error', 'Failed to load workout history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    const unsubscribe = navigation.addListener('focus', loadHistory);
    return unsubscribe;
  }, [navigation, loadHistory]);

  const handleDelete = (item: SessionSummary) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await workoutRepo.deleteSession(item.id);
              loadHistory();
            } catch (e) {
              console.error('Failed to delete workout:', e);
              Alert.alert('Error', 'Failed to delete workout.');
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: SessionSummary }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Workout', { sessionId: item.id })}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          <Text style={styles.workoutName}>{item.name}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <View style={styles.durationBadge}>
            <Icon name="schedule" size={14} color="#6B7280" />
            <Text style={styles.durationText}>{item.duration != null && item.duration > 0 ? formatDuration(item.duration) : '—'}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="delete-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
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

      {item.notes ? (
        <Text style={styles.cardNotes}>{item.notes}</Text>
      ) : null}
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

      {loading ? (
        <ActivityIndicator style={styles.loading} size="large" color="#2563EB" />
      ) : (
        <>
          <Text style={styles.subtitle}>{history.length} workouts logged</Text>
          <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icon name="fitness-center" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No workouts yet</Text>
                <Text style={styles.emptySubtitle}>Start a program to log your first workout</Text>
              </View>
            }
          />
        </>
      )}

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
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  loading: {
    marginTop: 48,
  },
  emptyState: {
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
  spacer: {
    height: 20,
  },
});

export { WorkoutHistoryScreen };
