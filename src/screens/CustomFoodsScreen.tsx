import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { nutritionRepo } from '../database/repositories';
import type { CustomFood } from '../models';
import type { MoreScreenProps } from '../navigation/types';
import { validateRequiredText, validatePositiveNumber } from '../utils/validation';

interface FoodDraft {
  name: string;
  serving_size: string;
  unit: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
}

const EMPTY_DRAFT: FoodDraft = {
  name: '',
  serving_size: '100',
  unit: 'g',
  calories: '',
  protein_g: '',
  carbs_g: '',
  fat_g: '',
};

export default function CustomFoodsScreen({ navigation }: MoreScreenProps<'CustomFoods'>) {
  const [foods, setFoods] = useState<CustomFood[]>([]);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<FoodDraft>(EMPTY_DRAFT);

  const loadFoods = useCallback(async () => {
    try {
      const data = await nutritionRepo.getCustomFoods();
      setFoods(data);
    } catch (e) {
      console.error('Failed to load custom foods:', e);
      Alert.alert('Error', 'Failed to load custom foods.');
    }
  }, []);

  useEffect(() => { loadFoods(); }, [loadFoods]);

  const filtered = query.trim()
    ? foods.filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    : foods;

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setShowForm(true);
  };

  const openEdit = (food: CustomFood) => {
    setEditingId(food.id!);
    setDraft({
      name: food.name,
      serving_size: String(food.serving_size),
      unit: food.unit,
      calories: String(food.calories),
      protein_g: String(food.protein_g),
      carbs_g: String(food.carbs_g),
      fat_g: String(food.fat_g),
    });
    setShowForm(true);
  };

  const validate = (): string | null => {
    const nameErr = validateRequiredText(draft.name, 'Name');
    if (nameErr) return nameErr;
    const calErr = validatePositiveNumber(draft.calories, 'Calories');
    if (calErr) return calErr;
    const protErr = validatePositiveNumber(draft.protein_g, 'Protein');
    if (protErr) return protErr;
    const carbErr = validatePositiveNumber(draft.carbs_g, 'Carbohydrates');
    if (carbErr) return carbErr;
    const fatErr = validatePositiveNumber(draft.fat_g, 'Fat');
    if (fatErr) return fatErr;
    const servingErr = validatePositiveNumber(draft.serving_size, 'Serving size');
    if (servingErr) return servingErr;
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) { Alert.alert('Invalid Input', error); return; }

    const foodData = {
      name: draft.name.trim(),
      serving_size: parseFloat(draft.serving_size),
      unit: draft.unit.trim() || 'g',
      calories: parseFloat(draft.calories),
      protein_g: parseFloat(draft.protein_g),
      carbs_g: parseFloat(draft.carbs_g),
      fat_g: parseFloat(draft.fat_g),
    };

    try {
      if (editingId) {
        await nutritionRepo.updateCustomFood(editingId, foodData);
      } else {
        await nutritionRepo.createCustomFood(foodData);
      }
      setShowForm(false);
      await loadFoods();
    } catch (e) {
      console.error('Failed to save custom food:', e);
      Alert.alert('Error', 'Failed to save custom food.');
    }
  };

  const handleDelete = (food: CustomFood) => {
    Alert.alert('Delete Food', `Delete "${food.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await nutritionRepo.deleteCustomFood(food.id!);
            await loadFoods();
          } catch (e) {
            console.error('Failed to delete custom food:', e);
            Alert.alert('Error', 'Failed to delete food.');
          }
        },
      },
    ]);
  };

  const updateDraft = (field: keyof FoodDraft, value: string) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Custom Foods</Text>
        <TouchableOpacity onPress={openCreate}>
          <Icon name="add" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search custom foods..."
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
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardMeta}>
                {item.calories} cal · {item.protein_g}g protein · {item.carbs_g}g carbs · {item.fat_g}g fat
              </Text>
              <Text style={styles.cardServing}>Per {item.serving_size}{item.unit}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.cardBtn}>
                <Icon name="edit" size={20} color="#2563EB" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.cardBtn}>
                <Icon name="delete" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="restaurant" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Custom Foods</Text>
            <Text style={styles.emptyText}>Create your own foods to track nutrition.</Text>
          </View>
        }
      />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Food' : 'New Food'}</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.label}>Name *</Text>
            <TextInput style={styles.input} value={draft.name} onChangeText={v => updateDraft('name', v)} placeholder="e.g. Greek Yogurt" placeholderTextColor="#9CA3AF" />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Serving Size *</Text>
                <TextInput style={styles.input} value={draft.serving_size} onChangeText={v => updateDraft('serving_size', v)} keyboardType="decimal-pad" placeholder="100" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Unit</Text>
                <TextInput style={styles.input} value={draft.unit} onChangeText={v => updateDraft('unit', v)} placeholder="g" placeholderTextColor="#9CA3AF" />
              </View>
            </View>

            <Text style={styles.label}>Calories *</Text>
            <TextInput style={styles.input} value={draft.calories} onChangeText={v => updateDraft('calories', v)} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#9CA3AF" />

            <Text style={styles.label}>Protein (g) *</Text>
            <TextInput style={styles.input} value={draft.protein_g} onChangeText={v => updateDraft('protein_g', v)} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#9CA3AF" />

            <Text style={styles.label}>Carbohydrates (g) *</Text>
            <TextInput style={styles.input} value={draft.carbs_g} onChangeText={v => updateDraft('carbs_g', v)} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#9CA3AF" />

            <Text style={styles.label}>Fat (g) *</Text>
            <TextInput style={styles.input} value={draft.fat_g} onChangeText={v => updateDraft('fat_g', v)} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#9CA3AF" />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 10, marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#1F2937', marginLeft: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
  },
  cardContent: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  cardMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardServing: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  cardBtn: { padding: 8 },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  emptyText: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1F2937' },
  modalCancel: { fontSize: 16, color: '#6B7280' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#2563EB' },
  modalBody: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#1F2937',
  },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
});
