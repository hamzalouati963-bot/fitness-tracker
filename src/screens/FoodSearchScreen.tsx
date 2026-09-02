import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { nutritionRepo, dailyLogRepo } from '../database/repositories';
import { foods, todayISO, type Food } from '../services';
import type { MealType } from '../models';

interface FoodSearchScreenProps {
  navigation: any;
}

const MEAL_TYPES: { id: MealType; label: string; icon: string }[] = [
  { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { id: 'lunch', label: 'Lunch', icon: '☀️' },
  { id: 'dinner', label: 'Dinner', icon: '🌙' },
  { id: 'snack', label: 'Snack', icon: '🍿' },
];

export default function FoodSearchScreen({ navigation }: FoodSearchScreenProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealType>('snack');
  const [quantity, setQuantity] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  useEffect(() => {
    if (search.trim().length > 0) {
      const filtered = foods
        .filter(f => f.name.toLowerCase().includes(search.trim().toLowerCase()))
        .slice(0, 50);
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [search]);

  const markNutritionLogged = async () => {
    try {
      const logId = await dailyLogRepo.getOrCreateLog(todayISO());
      await dailyLogRepo.updateLog(logId, { nutrition_logged: true });
    } catch (e) {
      console.error('Failed to mark nutrition logged:', e);
    }
  };

  const confirmAdd = async () => {
    if (!selectedFood) return;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid quantity', 'Enter a quantity greater than 0.');
      return;
    }
    const multiplier = qty / selectedFood.serving_size;

    try {
      const meals = await nutritionRepo.getMealsByDate(todayISO());
      let mealId = meals.find(m => m.meal_type === selectedMeal)?.id;

      if (!mealId) {
        const label = MEAL_TYPES.find(t => t.id === selectedMeal)?.label || 'Meal';
        mealId = await nutritionRepo.createMeal({
          date: todayISO(),
          meal_type: selectedMeal,
          name: label,
          notes: '',
        });
      }

      await nutritionRepo.createMealItem({
        meal_id: mealId,
        food_id: selectedFood.id,
        food_name: selectedFood.name,
        quantity: qty,
        unit: selectedFood.unit,
        calories: Math.round(selectedFood.calories * multiplier),
        protein_g: Math.round(selectedFood.protein_g * multiplier * 10) / 10,
        carbs_g: Math.round(selectedFood.carbs_g * multiplier * 10) / 10,
        fat_g: Math.round(selectedFood.fat_g * multiplier * 10) / 10,
      });

      await markNutritionLogged();

      setSelectedFood(null);
      setQuantity('');
      setSearch('');

      Alert.alert('Added', `${selectedFood.name} (${qty}${selectedFood.unit}) added to ${selectedMeal}.`);
    } catch (e) {
      console.error('Failed to add food:', e);
      Alert.alert('Error', 'Impossible to add this food. Please try again.');
    }
  };

  const openAddDialog = (food: Food) => {
    setSelectedFood(food);
    setQuantity(String(food.serving_size));
  };

  const renderFood = ({ item }: { item: Food }) => (
    <TouchableOpacity style={styles.foodCard} onPress={() => openAddDialog(item)}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodMeta}>
          {item.serving_size}{item.unit} · {item.calories} kcal · P {item.protein_g}g / C {item.carbs_g}g / F {item.fat_g}g
        </Text>
      </View>
      <Icon name="add-circle-outline" size={24} color="#2563EB" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Database</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search a food..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={results}
        renderItem={renderFood}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          search.trim().length > 0 ? (
            <View style={styles.emptyState}>
              <Icon name="search-off" size={40} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No food found</Text>
              <Text style={styles.emptySubtitle}>Try another search term</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="restaurant" size={40} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Search the food database</Text>
              <Text style={styles.emptySubtitle}>Type to find foods and log them</Text>
            </View>
          )
        }
      />

      {selectedFood && (
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{selectedFood.name}</Text>
            <Text style={styles.dialogMeta}>
              1 serving = {selectedFood.serving_size}{selectedFood.unit} · {selectedFood.calories} kcal
            </Text>

            <Text style={styles.dialogLabel}>ADD TO</Text>
            <View style={styles.mealChips}>
              {MEAL_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.mealChip, selectedMeal === t.id && styles.mealChipActive]}
                  onPress={() => setSelectedMeal(t.id)}
                >
                  <Text style={[styles.mealChipText, selectedMeal === t.id && styles.mealChipTextActive]}>
                    {t.icon} {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.dialogLabel}>QUANTITY ({selectedFood.unit})</Text>
            <TextInput
              style={styles.quantityInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              placeholder="0"
            />

            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setSelectedFood(null); setQuantity(''); }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={confirmAdd}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#1F2937', paddingVertical: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  foodInfo: { flex: 1, marginRight: 8 },
  foodName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  foodMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24,
  },
  dialog: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
  },
  dialogTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  dialogMeta: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 16 },
  dialogLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  mealChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  mealChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 20 },
  mealChipActive: { backgroundColor: '#2563EB' },
  mealChipText: { fontSize: 12, color: '#6B7280' },
  mealChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  quantityInput: {
    backgroundColor: '#F9FAFB', borderRadius: 8, padding: 14, fontSize: 18,
    fontWeight: '600', color: '#1F2937',
  },
  dialogActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelButton: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelButtonText: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
  addButton: { flex: 1, backgroundColor: '#2563EB', borderRadius: 10, padding: 14, alignItems: 'center' },
  addButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});

export { FoodSearchScreen };