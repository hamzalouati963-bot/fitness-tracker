import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { hydrationRepo, settingsRepo } from '../database/repositories';
import { todayISO, timeNow } from '../services';
import type { MoreScreenProps } from '../navigation/types';
import { validateWaterMl } from '../utils/validation';

export default function HydrationScreen({ navigation }: MoreScreenProps<'Hydration'>) {
  const [currentLiters, setCurrentLiters] = useState(0);
  const [targetLiters, setTargetLiters] = useState(2.5);
  const [entries, setEntries] = useState<{ time: string; amount: number; id: number }[]>([]);
  const [customAmount, setCustomAmount] = useState('');

  const loadData = useCallback(async () => {
    try {
      const today = todayISO();
      const [total, todayEntries, targets] = await Promise.all([
        hydrationRepo.getTodaysHydration(today),
        hydrationRepo.getEntriesByDate(today),
        settingsRepo.getNutritionTargets(),
      ]);
      setCurrentLiters(total);
      setTargetLiters(targets.hydration_liters || 2.5);
      setEntries(todayEntries.map(e => ({ time: e.time, amount: e.amount_liters, id: e.id! })));
    } catch (e) {
      console.error('Failed to load hydration:', e);
      Alert.alert('Error', 'Failed to load hydration data.');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addWater = async (amount: number) => {
    try {
      await hydrationRepo.addEntry({
        date: todayISO(),
        time: timeNow(),
        amount_liters: amount / 1000,
        source: 'manual',
      });
      await loadData();
    } catch (e) {
      console.error('Failed to add water:', e);
      Alert.alert('Error', 'Failed to add water entry. Please try again.');
    }
  };

  const removeEntry = async (id: number) => {
    try {
      await hydrationRepo.deleteEntry(id);
      await loadData();
    } catch (e) {
      console.error('Failed to remove entry:', e);
      Alert.alert('Error', 'Failed to remove entry. Please try again.');
    }
  };

  const [editingEntry, setEditingEntry] = useState<{ id: number; amount: number } | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const handleEditEntry = (entry: { id: number; amount: number }) => {
    setEditingEntry(entry);
    setEditAmount(String(Math.round(entry.amount * 1000)));
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    const error = validateWaterMl(editAmount);
    if (error) { Alert.alert('Invalid Input', error); return; }
    const ml = parseFloat(editAmount);
    try {
      await hydrationRepo.updateEntry(editingEntry.id, ml);
      setEditingEntry(null);
      await loadData();
    } catch (e) {
      console.error('Failed to update entry:', e);
      Alert.alert('Error', 'Failed to update entry.');
    }
  };

  const addCustom = () => {
    const error = validateWaterMl(customAmount);
    if (error) { Alert.alert('Invalid Input', error); return; }
    const ml = parseFloat(customAmount);
    addWater(ml);
    setCustomAmount('');
  };

  const progress = Math.min(100, (currentLiters / targetLiters) * 100);

  return (
    <>
    <ScrollView style={styles.container} keyboardDismissMode="on-drag">
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hydration</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressCard}>
        <View style={styles.waterIconContainer}>
          <Text style={styles.waterIcon}>💧</Text>
        </View>

        <Text style={styles.bigNumber}>{currentLiters.toFixed(1)}</Text>
        <Text style={styles.bigUnit}>/ {targetLiters.toFixed(1)} L</Text>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
      </View>

      <View style={styles.quickAddSection}>
        <Text style={styles.sectionTitle}>QUICK ADD</Text>
        <View style={styles.quickButtons}>
          {[
            { amount: 250, label: '250ml' },
            { amount: 500, label: '500ml' },
            { amount: 750, label: '750ml' },
            { amount: 1000, label: '1L' },
          ].map((btn) => (
            <TouchableOpacity
              key={btn.amount}
              accessibilityRole="button"
              accessibilityLabel={`Add ${btn.label} of water`}
              style={styles.quickButton}
              onPress={() => addWater(btn.amount)}
            >
              <Text style={styles.quickButtonText}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.customSection}>
        <Text style={styles.sectionTitle}>CUSTOM AMOUNT</Text>
        <View style={styles.customInputRow}>
          <TextInput
            accessibilityLabel="Custom water amount in milliliters"
            style={styles.customInput}
            value={customAmount}
            onChangeText={setCustomAmount}
            keyboardType="decimal-pad"
            placeholder="0"
          />
          <Text style={styles.customUnit}>ml</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Add custom amount" style={styles.addCustomButton} onPress={addCustom}>
            <Text style={styles.addCustomText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.logSection}>
        <Text style={styles.sectionTitle}>TODAY'S LOG</Text>
        {entries.length === 0 ? (
          <View style={styles.emptyLog}>
            <Icon name="water" size={32} color="#D1D5DB" />
            <Text style={styles.emptyLogText}>No water logged today</Text>
          </View>
        ) : (
          <View style={styles.logEntries}>
            {entries.map((entry) => (
              <View key={entry.id} style={styles.logEntry}>
                <View style={styles.logEntryInfo}>
                  <Text style={styles.logEntryTime}>{entry.time}</Text>
                  <Text style={styles.logEntryAmount}>{entry.amount >= 1 ? `${entry.amount.toFixed(1)} L` : `${(entry.amount * 1000).toFixed(0)} ml`}</Text>
                </View>
                <View style={styles.logEntryActions}>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel="Edit water entry" onPress={() => handleEditEntry(entry)} style={styles.logEntryEdit}>
                    <Icon name="edit" size={14} color="#2563EB" />
                  </TouchableOpacity>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel="Remove water entry" onPress={() => {
                    Alert.alert('Remove Entry', 'Remove this water entry?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => removeEntry(entry.id) },
                    ]);
                  }} style={styles.logEntryRemove}>
                    <Icon name="close" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.spacer} />
    </ScrollView>

    <Modal visible={!!editingEntry} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Amount</Text>
          <TextInput
            style={styles.modalInput}
            value={editAmount}
            onChangeText={setEditAmount}
            keyboardType="number-pad"
            placeholder="Amount in ml"
            placeholderTextColor="#9CA3AF"
            autoFocus
          />
          <Text style={styles.modalHint}>Enter amount in milliliters</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditingEntry(null)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveEdit}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
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
  progressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  waterIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  waterIcon: {
    fontSize: 40,
  },
  bigNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1F2937',
  },
  bigUnit: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: -4,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  progressPercent: {
    fontSize: 14,
    color: '#6B7280',
  },
  quickAddSection: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
    marginLeft: 4,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  customSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  customInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    padding: 0,
  },
  customUnit: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  addCustomButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 12,
  },
  addCustomText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  logSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  emptyLog: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    gap: 8,
  },
  emptyLogText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  logEntries: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  logEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logEntryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logEntryTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  logEntryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  logEntryRemove: {
    padding: 8,
  },
  logEntryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logEntryEdit: {
    padding: 8,
  },
  spacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalSaveBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});