import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface FoodSearchScreenProps {
  navigation: any;
}

export default function FoodSearchScreen({ navigation }: FoodSearchScreenProps) {
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);

  const foods = [
    { id: 'chicken_breast', name: 'Chicken Breast', serving: 100, unit: 'g', cals: 165, p: 31, c: 0, f: 3.6 },
    { id: 'rice_white', name: 'White Rice (cooked)', serving: 100, unit: 'g', cals: 130, p: 2.7, c: 28, f: 0.3 },
    { id: 'rice_brown', name: 'Brown Rice (cooked)', serving: 100, unit: 'g', cals: 112, p: 2.6, c: 23, f: 0.9 },
    { id: 'salmon', name: 'Salmon (grilled)', serving: 100, unit: 'g', cals: 208, p: 20, c: 0, f: 13 },
    { id: 'egg', name: 'Egg (whole)', serving: 50, unit: 'g', cals: 155, p: 13, c: 1.1, f: 11 },
    { id: 'banana', name: 'Banana', serving: 100, unit: 'g', cals: 89, p: 1.1, c: 23, f: 0.3 },
    { id: 'apple', name: 'Apple', serving: 100, unit: 'g', cals: 52, p: 0.3, c: 14, f: 0.2 },
    { id: 'broccoli', name: 'Broccoli (steamed)', serving: 100, unit: 'g', cals: 35, p: 2.4, c: 7, f: 0.4 },
    { id: 'greek_yogurt', name: 'Greek Yogurt (plain)', serving: 100, unit: 'g', cals: 59, p: 10, c: 3.6, f: 0.7 },
    { id: 'almonds', name: 'Almonds', serving: 28, unit: 'g', cals: 164, p: 6, c: 6, f: 14 },
    { id: 'potato', name: 'Potato (boiled)', serving: 100, unit: 'g', cals: 87, p: 1.9, c: 20, f: 0.1 },
    { id: 'beef_lean', name: 'Lean Beef (cooked)', serving: 100, unit: 'g', cals: 250, p: 26, c: 0, f: 15 },
    { id: 'tuna_canned', name: 'Tuna (canned in water)', serving: 100, unit: 'g', cals: 116, p: 26, c: 0, f: 0.8 },
    { id: 'whole_wheat_bread', name: 'Whole Wheat Bread', serving: 30, unit: 'g', cals: 75, p: 3, c: 14, f: 1 },
    { id: 'oatmeal', name: 'Oatmeal (cooked)', serving: 100, unit: 'g', cals: 68, p: 2.4, c: 12, f: 1.4 },
    { id: 'avocado', name: 'Avocado', serving: 100, unit: 'g', cals: 160, p: 2, c: 9, f: 15 },
    { id: 'tofu', name: 'Tofu (firm)', serving: 100, unit: 'g', cals: 76, p: 8, c: 1.9, f: 4.8 },
    { id: 'beans_black', name: 'Black Beans (cooked)', serving: 100, unit: 'g', cals: 132, p: 8.9, c: 24, f: 0.5 },
  ];

  React.useEffect(() => {
    if (search.length > 0) {
      const filtered = foods.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [search]);

  const addFoodToMeal = (food: typeof foods[0]) => {
    Alert.alert('Add Food', `Add ${food.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Add', onPress: () => {} },
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

      {search.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.foodCard} onPress={() => addFoodToMeal(item)}>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodServing}>Per {item.serving}{item.unit}</Text>
              </View>
              <View style={styles.foodCalories}>
                <Text style={styles.foodCalsText}>{item.cals}</Text>
                <Text style={styles.foodCalsUnit}>kcal</Text>
              </View>
              <View style={styles.foodMacros}>
                <Text style={styles.macroText}>P:{item.p}g</Text>
                <Text style={styles.macroText}>C:{item.c}g</Text>
                <Text style={styles.macroText}>F:{item.f}g</Text>
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

      {search.length === 0 && (
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

export { FoodSearchScreen };
