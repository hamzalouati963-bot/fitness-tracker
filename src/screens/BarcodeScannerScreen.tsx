import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, FlatList } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { MoreScreenProps } from '../navigation/types';
import { foods as builtInFoods } from '../services';
import { nutritionRepo } from '../database/repositories';
import type { CustomFood } from '../models';

interface FoundFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: number;
  unit: string;
  isCustom: boolean;
}

export default function BarcodeScannerScreen({ navigation }: MoreScreenProps<'BarcodeScanner'>) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [foundFoods, setFoundFoods] = useState<FoundFood[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const lookupBarcode = async (barcode: string) => {
    setScanned(true);
    setNotFound(false);
    setFoundFoods([]);

    const customFoods = await nutritionRepo.getCustomFoods();

    const barcodeFoods: Record<string, string> = {
      '5000112546415': 'Coca-Cola',
      '5449000000996': 'Coca-Cola Zero',
      '7622210449283': 'Oreo',
      '3017620422003': 'Nutella',
      '8000500310427': 'Ferrero Rocher',
      '3228857000166': 'Evian Water',
      '3175680011534': 'Kiri',
      '3560070472550': 'LU Petit Beurre',
      '5010029111681': 'Cadbury Dairy Milk',
      '8410076472786': 'Calvo',
    };

    const matchedBuiltIn = barcodeFoods[barcode];
    if (matchedBuiltIn) {
      const matched = builtInFoods.find(f => f.name.toLowerCase().includes(matchedBuiltIn.toLowerCase()));
      if (matched) {
        setFoundFoods([{
          id: matched.id,
          name: matched.name,
          calories: matched.calories,
          protein: matched.protein_g,
          carbs: matched.carbs_g,
          fat: matched.fat_g,
          serving_size: matched.serving_size,
          unit: matched.unit,
          isCustom: false,
        }]);
        return;
      }
    }

    const matchedCustom = customFoods.find(f => f.name.toLowerCase().includes(barcode.toLowerCase()));
    if (matchedCustom) {
      setFoundFoods([{
        id: `custom_${matchedCustom.id}`,
        name: matchedCustom.name,
        calories: matchedCustom.calories,
        protein: matchedCustom.protein_g,
        carbs: matchedCustom.carbs_g,
        fat: matchedCustom.fat_g,
        serving_size: matchedCustom.serving_size,
        unit: matchedCustom.unit,
        isCustom: true,
      }]);
      return;
    }

    setNotFound(true);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      lookupBarcode(manualCode.trim());
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Icon name="camera-alt" size={64} color="#9CA3AF" />
        <Text style={styles.infoText}>Camera permission is required for barcode scanning</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.permissionButton, { backgroundColor: '#6B7280', marginTop: 12 }]} onPress={() => setShowManualInput(true)}>
          <Text style={styles.permissionButtonText}>Enter Code Manually</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Barcode</Text>
        <TouchableOpacity onPress={() => setShowManualInput(!showManualInput)}>
          <Icon name="keyboard" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {showManualInput && (
        <View style={styles.manualInputContainer}>
          <TextInput
            style={styles.manualInput}
            placeholder="Enter barcode manually"
            value={manualCode}
            onChangeText={setManualCode}
            keyboardType="number-pad"
            autoFocus
          />
          <TouchableOpacity style={styles.manualSubmitButton} onPress={handleManualSubmit}>
            <Icon name="search" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {!showManualInput && !foundFoods.length && !notFound && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
            onBarcodeScanned={scanned ? undefined : ({ data }) => lookupBarcode(data)}
          />
          <View style={styles.scanOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanText}>Align barcode within the frame</Text>
          </View>
        </View>
      )}

      {scanned && (
        <View style={styles.resultContainer}>
          {foundFoods.length > 0 ? (
            <>
              <View style={styles.successBanner}>
                <Icon name="check-circle" size={24} color="#059669" />
                <Text style={styles.successText}>Product Found!</Text>
              </View>
              {foundFoods.map((food) => (
                <View key={food.id} style={styles.foodCard}>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.foodMacros}>
                      {food.calories} kcal | P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                    </Text>
                    <Text style={styles.foodServing}>Per {food.serving_size} {food.unit}</Text>
                  </View>
                </View>
              ))}
            </>
          ) : notFound ? (
            <View style={styles.notFoundContainer}>
              <Icon name="search-off" size={48} color="#9CA3AF" />
              <Text style={styles.notFoundText}>No product found for this barcode</Text>
              <Text style={styles.notFoundSubtext}>You can add this food manually later</Text>
            </View>
          ) : null}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.retryButton} onPress={() => { setScanned(false); setFoundFoods([]); setNotFound(false); }}>
              <Icon name="qr-code-scanner" size={20} color="#FFF" />
              <Text style={styles.retryButtonText}>Scan Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  cameraContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center',
  },
  scanFrame: {
    width: 250, height: 150, borderWidth: 2, borderColor: '#2563EB', borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanText: { color: '#FFF', fontSize: 14, marginTop: 16, textShadowColor: '#000', textShadowRadius: 4 },
  manualInputContainer: {
    flexDirection: 'row', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  manualInput: {
    flex: 1, height: 44, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    paddingHorizontal: 12, fontSize: 16, backgroundColor: '#F9FAFB',
  },
  manualSubmitButton: {
    width: 44, height: 44, backgroundColor: '#2563EB', borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  resultContainer: { flex: 1, padding: 16 },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 12,
    backgroundColor: '#ECFDF5', borderRadius: 8,
  },
  successText: { fontSize: 16, fontWeight: '600', color: '#059669', marginLeft: 8 },
  foodCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  foodMacros: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  foodServing: { fontSize: 12, color: '#9CA3AF' },
  notFoundContainer: { alignItems: 'center', padding: 32 },
  notFoundText: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  notFoundSubtext: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  retryButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2563EB', borderRadius: 12, padding: 14, gap: 8,
  },
  retryButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  cancelButton: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14,
  },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  infoText: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginTop: 16 },
  permissionButton: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 16,
  },
  permissionButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF', textAlign: 'center' },
});
