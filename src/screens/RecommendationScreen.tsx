import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface RecommendationScreenProps {
  navigation: any;
}

export default function RecommendationScreen({ navigation }: RecommendationScreenProps) {
  const recommendations = [
    { id: 1, icon: '🏋️', category: 'Workout', message: 'You have a planned workout today. Start it to stay on track.', priority: 'medium' },
    { id: 2, icon: '💧', category: 'Hydration', message: "You've logged 1.5 L of water today. Your target is 2.5 L. Try to drink more.", priority: 'medium' },
    { id: 3, icon: '🍽️', category: 'Nutrition', message: 'You haven\'t logged your lunch today. Don\'t forget to track your meals.', priority: 'medium' },
    { id: 4, icon: '📊', category: 'Progress', message: 'You logged workouts on 3 days this week. Consistency is key to long-term progress.', priority: 'low' },
    { id: 5, icon: '📏', category: 'Measurements', message: 'It\'s been over two weeks since your last body measurement. Regular tracking helps you see your progress.', priority: 'low' },
    { id: 6, icon: '🎯', category: 'Goals', message: 'You haven\'t set any goals yet. Goals help you stay focused and motivated. Create your first goal today.', priority: 'medium' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const renderItem = ({ item }: { item: typeof recommendations[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{item.icon}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardCategory}>{item.category}</Text>
          <Text style={styles.cardMessage}>{item.message}</Text>
        </View>
        <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
      </View>
      <View style={[styles.priorityBar, { backgroundColor: getPriorityColor(item.priority) }]} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suggestions</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Contextual suggestions based on your data</Text>
      </View>

      <FlatList
        data={recommendations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Empty State */}
      {recommendations.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="check-circle" size={48} color="#10B981" />
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>No suggestions right now. Keep up the good work!</Text>
        </View>
      )}

      <View style={styles.disclaimer}>
        <Icon name="info-outline" size={16} color="#6B7280" />
        <Text style={styles.disclaimerText}>
          These suggestions are based on your recorded data and do not replace professional advice.
        </Text>
      </View>

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
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  subtitleContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardIcon: {
    fontSize: 28,
    flexShrink: 0,
  },
  cardInfo: {
    flex: 1,
  },
  cardCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 4,
  },
  priorityBar: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    borderRadius: 0,
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
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  spacer: {
    height: 20,
  },
});

export { RecommendationScreen };
