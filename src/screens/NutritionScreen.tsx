import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface NutritionScreenProps {
  navigation: any;
}

export default function NutritionScreen({ navigation }: NutritionScreenProps) {
  const [meals, setMeals] = useState<any[]>([]);
  const [todaysNutrition, setTodaysNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [targets, setTargets] = useState({ calories: 2200, protein: 150, carbs: 250, fat: 70 });

  useEffect(() => {
    loadNutritionData();
  }, []);

  const loadNutritionData = async () => {
    // Simulated data - in real app would come from SQLite
    setMeals([
      {
        id: 1,
        meal_type: 'breakfast',
        name: 'Breakfast',
        items: [
          { id: 1, food_name: 'Oatmeal (cooked)', quantity: 200, calories: 136, protein_g: 4.8, carbs_g: 24, fat_g: 2.8 },
          { id: 2, food_name: 'Banana', quantity: 100, calories: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3 },
          { id: 3, food_name: 'Whey Protein', quantity: 30, calories: 120, protein_g: 24, carbs_g: 3, fat_g: 1 },
        ],
        total_calories: 345,
        total_protein: 29.9,
        total_carbs: 50,
        total_fat: 4.1,
      },
      {
        id: 2,
        meal_type: 'lunch',
        name: 'Lunch',
        items: [
          { id: 1, food_name: 'Chicken Breast', quantity: 150, calories: 247, protein_g: 46.5, carbs_g: 0, fat_g: 5.4 },
          { id: 2, food_name: 'White Rice (cooked)', quantity: 200, calories: 260, protein_g: 5.4, carbs_g: 56, fat_g: 0.6 },
          { id: 3, food_name: 'Broccoli (steamed)', quantity: 100, calories: 35, protein_g: 2.4, carbs_g: 7, fat_g: 0.4 },
          { id: 4, food_name: 'Olive Oil', quantity: 15, calories: 120, protein_g: 0, carbs_g: 0, fat_g: 14 },
        ],
        total_calories: 662,
        total_protein: 54.3,
        total_carbs: 63,
        total_fat: 20.4,
      },
      {
        id: 3,
        meal_type: 'dinner',
        name: 'Dinner',
        items: [
          { id: 1, food_name: 'Salmon (grilled)', quantity: 150, calories: 312, protein_g: 30, carbs_g: 0, fat_g: 19.5 },
          { id: 2, food_name: 'Sweet Potato (baked)', quantity: 150, calories: 135, protein_g: 3, carbs_g: 31.5, fat_g: 0.15 },
          { id: 3, food_name: 'Spinach (raw)', quantity: 50, calories: 11, protein_g: 1.45, carbs_g: 1.8, fat_g: 0.2 },
        ],
        total_calories: 458,
        total_protein: 34.45,
        total_carbs: 33.3,
        total_fat: 19.85,
      },
      {
        id: 4,
        meal_type: 'snack',
        name: 'Snacks',
        items: [
          { id: 1, food_name: 'Greek Yogurt (plain)', quantity: 100, calories: 59, protein_g: 10, carbs_g: 3.6, fat_g: 0.7 },
          { id: 2, food_name: 'Almonds', quantity: 28, calories: 164, protein_g: 6, carbs_g: 6, fat_g: 14 },
        ],
        total_calories: 223,
        total_protein: 16,
        total_carbs: 9.6,
        total_fat: 14.7,
      },
    ]);

    setTodaysNutrition({
      calories: 1688,
      protein: 134.65,
      carbs: 155.9,
      fat: 59.05,
    });
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍿';
      default: return '🍽️';
    }
  };

  const renderMeal = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <Text style={styles.mealIcon}>{getMealIcon(item.meal_type)}</Text>
        <Text style={styles.mealName}>{item.name}</Text>
        <View style={styles.mealCalories}>
          <Text style={styles.mealCaloriesText}>{item.total_calories} kcal</Text>
        </View>
      </View>

      <View style={styles.mealItems}>
        {item.items.map((itemFood: any) => (
          <View key={itemFood.id} style={styles.foodItem}>
            <View style={styles.foodItemLeft}>
              <Text style={styles.foodName}>{itemFood.food_name}</Text>
              <Text style={styles.foodQuantity}>{itemFood.quantity}g</Text>
            </View>
            <View style={styles.foodItemRight}>
              <Text style={styles.foodCaloriesSmall}>{itemFood.calories} kcal</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.mealTotals}>
        <View style={styles.mealTotalItem}>
          <Icon name="fitness-center" size={14} color="#6B7280" />
          <Text style={styles.mealTotalText}>P: {item.total_protein.toFixed(0)}g</Text>
          <Text style={styles.mealTotalTextSmall}>C: {item.total_carbs.toFixed(0)}g</Text>
          <Text style={styles.mealTotalTextSmall}>F: {item.total_fat.toFixed(0)}g</Text>
        </View>
        <View style={styles.mealAddButton}>
          <Icon name="add" size={16} color="#2563EB" />
          <Text style={styles.mealAddText}>Add</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('FoodSearch')}>
          <Icon name="search" size={24} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <TouchableOpacity onPress={() => Alert.alert('Add Food', 'Search for foods to add')}>
          <Icon name="add-circle" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Daily Summary */}
      <View style={styles.dailySummary}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryLabel}>Today's Nutrition</Text>
          <Text style={styles.summaryDate}>{new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryEmoji}>🍎</Text>
              <Text style={styles.summaryValue}>
                {todaysNutrition.calories} <Text style={styles.summaryUnit}>/ {targets.calories} kcal</Text>
              </Text>
              <Text style={styles.summaryLabelSmall}>Calories</Text>
              <View style={styles.progressBarSmall}>
                <View style={[styles.progressFillSmall, { width: `${Math.min(100, (todaysNutrition.calories / targets.calories) * 100)}%` }]} />
              </View>
            </View>

            <View style={styles.summaryMetric}>
              <Text style={styles.summaryEmoji}>🥩</Text>
              <Text style={styles.summaryValue}>
                {Math.round(todaysNutrition.protein)} <Text style={styles.summaryUnit}>/ {targets.protein} g</Text>
              </Text>
              <Text style={styles.summaryLabelSmall}>Protein</Text>
              <View style={styles.progressBarSmall}>
                <View style={[styles.progressFillSmall, { width: `${Math.min(100, (todaysNutrition.protein / targets.protein) * 100)}%` }]} />
              </View>
            </View>

            <View style={styles.summaryMetric}>
              <Text style={styles.summaryEmoji}>🍚</Text>
              <Text style={styles.summaryValue}>
                {Math.round(todaysNutrition.carbs)} <Text style={styles.summaryUnit}>/ {targets.carbs} g</Text>
              </Text>
              <Text style={styles.summaryLabelSmall}>Carbs</Text>
              <View style={styles.progressBarSmall}>
                <View style={[styles.progressFillSmall, { width: `${Math.min(100, (todaysNutrition.carbs / targets.carbs) * 100)}%` }]} />
              </View>
            </View>

            <View style={styles.summaryMetric}>
              <Text style={styles.summaryEmoji}>🧈</Text>
              <Text style={styles.summaryValue}>
                {Math.round(todaysNutrition.fat)} <Text style={styles.summaryUnit}>/ {targets.fat} g</Text>
              </Text>
              <Text style={styles.summaryLabelSmall}>Fat</Text>
              <View style={styles.progressBarSmall}>
                <View style={[styles.progressFillSmall, { width: `${Math.min(100, (todaysNutrition.fat / targets.fat) * 100)}%` }]} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Meals */}
      <View style={styles.mealsSection}>
        <Text style={styles.mealsSectionTitle}>MEALS</Text>
        <FlatList
          data={meals}
          renderItem={renderMeal}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.mealsList}
        />
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
    fontWeight: '700',
    color: '#1F2937',
  },
  dailySummary: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryMetric: {
    flex: 1,
    alignItems: 'center',
  },
  summaryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryUnit: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  summaryLabelSmall: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  progressBarSmall: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  mealsSection: {
    paddingHorizontal: 16,
  },
  mealsSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  mealsList: {
    paddingBottom: 16,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  mealCalories: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mealCaloriesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  mealItems: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  foodItemLeft: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  foodQuantity: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  foodItemRight: {
    marginLeft: 8,
  },
  foodCaloriesSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  mealTotals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  mealTotalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealTotalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  mealTotalTextSmall: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  mealAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealAddText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  spacer: {
    height: 20,
  },
});

export { NutritionScreen };
