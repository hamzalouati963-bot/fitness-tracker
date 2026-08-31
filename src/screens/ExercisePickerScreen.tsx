import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { exercises, type Exercise } from '../services';
import { UserProfileRepository } from '../database/repositories';
import type { UserProfile, Equipment } from '../models';

interface ExercisePickerScreenProps {
  navigation: any;
  route: any;
}

const EQUIPMENT_COMPATIBILITY: Record<Equipment, string[]> = {
  no_equipment: ['bodyweight'],
  dumbbells: ['dumbbells', 'bodyweight'],
  barbell: ['barbell', 'bodyweight'],
  machines: ['machines', 'cable', 'bodyweight'],
  resistance_bands: ['resistance_bands', 'bodyweight'],
  full_gym: ['barbell', 'dumbbells', 'machines', 'cable', 'bodyweight', 'resistance_bands', 'kettlebell'],
};

export default function ExercisePickerScreen({ navigation, route }: ExercisePickerScreenProps) {
  const onSelect = route.params?.onSelect as ((exercise: Exercise) => void) | undefined;
  const [query, setQuery] = useState('');
  const [userEquipment, setUserEquipment] = useState<Equipment>('full_gym');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const p = await new UserProfileRepository().get();
        if (p) setUserEquipment(p.equipment);
      } catch (e) { /* ignore */ }
    };
    loadProfile();
  }, []);

  const isCompatible = useCallback((exercise: Exercise): boolean => {
    const compatible = EQUIPMENT_COMPATIBILITY[userEquipment] || [];
    return compatible.includes(exercise.equipment);
  }, [userEquipment]);

  const searchFiltered = query.trim()
    ? exercises.filter(e =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.muscle_group.toLowerCase().includes(query.toLowerCase()) ||
        e.equipment.toLowerCase().includes(query.toLowerCase())
      )
    : exercises;

  const filtered = [...searchFiltered].sort((a, b) => {
    const aCompatible = isCompatible(a) ? 0 : 1;
    const bCompatible = isCompatible(b) ? 0 : 1;
    return aCompatible - bCompatible;
  });

  const handleSelect = (exercise: Exercise) => {
    if (onSelect) {
      onSelect(exercise);
      navigation.goBack();
    }
  };

  const getEquipmentLabel = (e: Equipment): string => {
    const labels: Record<Equipment, string> = {
      no_equipment: 'No Equipment',
      dumbbells: 'Dumbbells',
      barbell: 'Barbell',
      machines: 'Machines',
      resistance_bands: 'Bands',
      full_gym: 'Full Gym',
    };
    return labels[e];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pick Exercise</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.equipmentBadge}>
        <Icon name="fitness-center" size={14} color="#2563EB" />
        <Text style={styles.equipmentBadgeText}>Your equipment: {getEquipmentLabel(userEquipment)}</Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Icon name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const compatible = isCompatible(item);
          return (
            <TouchableOpacity style={[styles.card, !compatible && styles.cardDimmed]} onPress={() => handleSelect(item)}>
              <View style={styles.cardLeft}>
                <View style={styles.cardNameRow}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {!compatible && <Icon name="info-outline" size={14} color="#F59E0B" />}
                </View>
                <Text style={styles.cardMeta}>
                  {item.muscle_group} · {item.equipment} · {item.difficulty}
                </Text>
              </View>
              <Icon name="add-circle-outline" size={24} color={compatible ? '#2563EB' : '#D1D5DB'} />
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="search-off" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No exercises found</Text>
          </View>
        }
      />
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
  equipmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  equipmentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardDimmed: {
    opacity: 0.6,
  },
  cardLeft: {
    flex: 1,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
});
