import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NutritionRepository } from '../database/repositories';
import { foods, todayISO, type Food } from '../services';

interface FoodSearchScreenProps {
  navigation: any;
}

export default function FoodSearchScreen({ navigation }: FoodSearchScreenProps) {
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<Food[]>([]);

  React.useEffect(() => {
    if (search.trim().length > 0) {
      const filtered = foods.filter(f =>
        f.name.toLowerCase().includes(search.trim().toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [search]);

  const addFoodToMeal = (food: Food) => {
    Alert.alert('Add Food', `Add ${food.name} (1 serving, ${food.serving_size}${food.unit})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add',
        onPress: async () => {
          try {
            const nutritionRepo = new NutritionRepository();
            const meals = await nutritionRepo.getMealsByDate(todayISO());
            let mealId = meals.find(m => m.meal_type === 'snack')?.id;

            if (!mealId) {
              mealId = await nutritionRepo.createMeal({
                date: todayISO(),
                meal_type: 'snack',
                name: 'Quick snack',
                notes: '',
              });
            }

            await nutritionRepo.createMealItem({
              meal_id: mealId,
              food_id: food.id,
              food_name: food.name,
              quantity: food.serving_size,
              unit: food.unit,
              calories: food.calories,
              protein_g: food.protein_g,
              carbs_g: food.carbs_g,
              fat_g: food.fat_g,
            });

            Alert.alert('Added', `${food.name} added to today's log.`);
          } catch (e) {
            console.error('Failed to add food:', e);
          }
        },
      },
    ]);
  };

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
          placeholder="Search foods..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {search.trim().length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.foodCard} onPress={() => addFoodToMeal(item)}>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodServing}>Per {item.serving_size}{item.unit}</Text>
              </View>
              <View style={styles.foodCalories}>
                <Text style={styles.foodCalsText}>{item.calories}</Text>
                <Text style={styles.foodCalsUnit}>kcal</Text>
              </View>
              <View style={styles.foodMacros}>
                <Text style={styles.macroText}>P:{item.protein_g}g</Text>
                <Text style={styles.macroText}>C:{item.carbs_g}g</Text>
                <Text style={styles.macroText}>F:{item.fat_g}g</Text>
              </View>
              <Icon name="add-circle" size={24} color="#2563EB" style={styles.addIcon} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.foodList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No foods found matching "{search}"</Text>
          }
        />
      )}

      {search.trim().length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="restaurant-menu" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Food Database</Text>
          <Text style={styles.emptySubtitle}>Search for foods to add to your meals</Text>
        </View>
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
  },
  foodList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    elevation: 1,
  },
  foodInfo: {
    flex: 2,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  foodServing: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  foodCalories: {
    alignItems: 'center',
    marginRight: 12,
  },
  foodCalsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  foodCalsUnit: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  foodMacros: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  macroText: {
    fontSize: 11,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: '#6B7280',
  },
  addIcon: {
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 24,
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
});