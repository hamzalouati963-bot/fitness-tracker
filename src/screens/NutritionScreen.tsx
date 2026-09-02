import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NutritionRepository, SettingsRepository } from '../database/repositories';
import { todayISO } from '../services';
import type { Meal, MealItem } from '../models';
import {
  DEFAULT_CALORIE_GOAL,
  DEFAULT_PROTEIN_GOAL_G,
  DEFAULT_CARBS_GOAL_G,
  DEFAULT_FAT_GOAL_G,
} from '../constants';

interface NutritionScreenProps {
  navigation: any;
}

interface MealWithTotals extends Meal {
  items: MealItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}

export default function NutritionScreen({ navigation }: NutritionScreenProps) {
  const [meals, setMeals] = useState<MealWithTotals[]>([]);
  const [todaysNutrition, setTodaysNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [targets, setTargets] = useState({
    calories: DEFAULT_CALORIE_GOAL,
    protein: DEFAULT_PROTEIN_GOAL_G,
    carbs: DEFAULT_CARBS_GOAL_G,
    fat: DEFAULT_FAT_GOAL_G,
  });

  const loadNutritionData = useCallback(async () => {
    try {
      const nutritionRepo = new NutritionRepository();
      const settingsRepo = new SettingsRepository();
      const today = todayISO();

      const [mealRows, totals, targetRows] = await Promise.all([
        nutritionRepo.getMealsByDate(today),
        nutritionRepo.getDailyNutrition(today),
        settingsRepo.getNutritionTargets(),
      ]);

      const mealsWithItems: MealWithTotals[] = [];
      if (mealRows.length > 0) {
        const mealIds = mealRows.map(m => m.id!);
        const itemsByMealId = await nutritionRepo.getMealItemsByMealIds(mealIds);

        for (const meal of mealRows) {
          const items = itemsByMealId.get(meal.id!) || [];
          const mealTotals = items.reduce(
            (acc, item) => ({
              calories: acc.calories + item.calories,
              protein: acc.protein + item.protein_g,
              carbs: acc.carbs + item.carbs_g,
              fat: acc.fat + item.fat_g,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          );
          mealsWithItems.push({
            ...meal,
            items,
            total_calories: mealTotals.calories,
            total_protein: mealTotals.protein,
            total_carbs: mealTotals.carbs,
            total_fat: mealTotals.fat,
          });
        }
      }

      setMeals(mealsWithItems);
      setTodaysNutrition({
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
      });
      setTargets({
        calories: targetRows.calories_kcal || DEFAULT_CALORIE_GOAL,
        protein: targetRows.protein_g || DEFAULT_PROTEIN_GOAL_G,
        carbs: targetRows.carbohydrates_g || DEFAULT_CARBS_GOAL_G,
        fat: targetRows.fat_g || DEFAULT_FAT_GOAL_G,
      });
    } catch (e) {
      console.error('Failed to load nutrition:', e);
    }
  }, []);

  useEffect(() => {
    loadNutritionData();
    const unsubscribe = navigation.addListener('focus', loadNutritionData);
    return unsubscribe;
  }, [navigation, loadNutritionData]);

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍿';
      default: return '🍽️';
    }
  };

  const renderMeal = ({ item }: { item: MealWithTotals }) => (
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <Text style={styles.mealIcon}>{getMealIcon(item.meal_type)}</Text>
        <Text style={styles.mealName}>{item.name}</Text>
        <View style={styles.mealCalories}>
          <Text style={styles.mealCaloriesText}>{Math.round(item.total_calories)} kcal</Text>
        </View>
      </View>

      <View style={styles.mealItems}>
        {item.items.length === 0 ? (
          <Text style={styles.noItemsText}>No items logged</Text>
        ) : (
          item.items.map((itemFood: MealItem) => (
            <View key={itemFood.id} style={styles.foodItem}>
              <View style={styles.foodItemLeft}>
                <Text style={styles.foodName}>{itemFood.food_name}</Text>
                <Text style={styles.foodQuantity}>{itemFood.quantity}{itemFood.unit || 'g'}</Text>
              </View>
              <View style={styles.foodItemRight}>
                <Text style={styles.foodCaloriesSmall}>{Math.round(itemFood.calories)} kcal</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.mealTotals}>
        <View style={styles.mealTotalItem}>
          <Icon name="fitness-center" size={14} color="#6B7280" />
          <Text style={styles.mealTotalText}>P: {Number(item.total_protein).toFixed(0)}g</Text>
          <Text style={styles.mealTotalTextSmall}>C: {Number(item.total_carbs).toFixed(0)}g</Text>
          <Text style={styles.mealTotalTextSmall}>F: {Number(item.total_fat).toFixed(0)}g</Text>
        </View>
        <TouchableOpacity
          style={styles.mealAddButton}
          onPress={() => navigation.navigate('More', { screen: 'FoodSearch' })}
        >
          <Icon name="add" size={16} color="#2563EB" />
          <Text style={styles.mealAddText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('More', { screen: 'FoodSearch' })}>
          <Icon name="search" size={24} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <TouchableOpacity onPress={() => navigation.navigate('More', { screen: 'FoodSearch' })}>
          <Icon name="add-circle" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

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
                <View style={[styles.progressFillSmall, { width: `${targets.calories > 0 ? Math.min(100, (todaysNutrition.calories / targets.calories) * 100) : 0}%` }]} />
              </View>
            </View>

            <View style={styles.summaryMetric}>
              <Text style={styles.summaryEmoji}>🥩</Text>
              <Text style={styles.summaryValue}>
                {todaysNutrition.protein} <Text style={styles.summaryUnit}>/ {targets.protein} g</Text>
              </Text>
              <Text style={styles.summaryLabelSmall}>Protein</Text>
              <View style={styles.progressBarSmall}>
                <View style={[styles.progressFillSmall, { width: `${targets.protein > 0 ? Math.min(100, (todaysNutrition.protein / targets.protein) * 100) : 0}%` }]} />
              </View>
            </View>

            <View style={styles.summaryMetric}>
              <Text style={styles.summaryEmoji}>🍚</Text>
              <Text style={styles.summaryValue}>
                {todaysNutrition.carbs} <Text style={styles.summaryUnit}>/ {targets.carbs} g</Text>
              </Text>
              <Text style={styles.summaryLabelSmall}>Carbs</Text>
              <View style={styles.progressBarSmall}>
                <View style={[styles.progressFillSmall, { width: `${targets.carbs > 0 ? Math.min(100, (todaysNutrition.carbs / targets.carbs) * 100) : 0}%` }]} />
              </View>
            </View>

            <View style={styles.summaryMetric}>
              <Text style={styles.summaryEmoji}>🧈</Text>
              <Text style={styles.summaryValue}>
                {todaysNutrition.fat} <Text style={styles.summaryUnit}>/ {targets.fat} g</Text>
              </Text>
              <Text style={styles.summaryLabelSmall}>Fat</Text>
              <View style={styles.progressBarSmall}>
                <View style={[styles.progressFillSmall, { width: `${targets.fat > 0 ? Math.min(100, (todaysNutrition.fat / targets.fat) * 100) : 0}%` }]} />
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.mealsSection}>
        <Text style={styles.mealsSectionTitle}>MEALS</Text>
        {meals.length === 0 ? (
          <View style={styles.emptyMeals}>
            <Text style={styles.emptyMealsTitle}>No meals logged today</Text>
            <Text style={styles.emptyMealsSubtitle}>Tap the search icon to add foods</Text>
          </View>
        ) : (
          meals.map((meal) => (
            <React.Fragment key={meal.id}>
              {renderMeal({ item: meal })}
            </React.Fragment>
          ))
        )}
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
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryUnit: {
    fontSize: 11,
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
  emptyMeals: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyMealsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyMealsSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
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
  noItemsText: {
    fontSize: 13,
    color: '#9CA3AF',
    padding: 4,
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