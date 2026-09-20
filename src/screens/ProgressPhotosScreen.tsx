import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { progressPhotoRepo } from '../database/repositories';
import type { ProgressPhoto } from '../models';
import type { MoreScreenProps } from '../navigation/types';

export default function ProgressPhotosScreen({ navigation }: MoreScreenProps<'ProgressPhotos'>) {
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // @ts-ignore - expo-image-picker is optional
        const ImagePicker = await import('expo-image-picker');
        if (ImagePicker) setHasCamera(true);
      } catch {
        setHasCamera(false);
      }
    })();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const all = await progressPhotoRepo.getAll();
      setPhotos(all);
    } catch (e) {
      console.error('Failed to load progress photos:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const typeColors: Record<string, string> = {
    front: '#2563EB',
    side: '#059669',
    back: '#7C3AED',
    other: '#6B7280',
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Photos</Text>
        <View style={{ width: 24 }} />
      </View>

      {!hasCamera && (
        <View style={styles.infoCard}>
          <Icon name="info-outline" size={20} color="#2563EB" />
          <Text style={styles.infoText}>
            Camera access requires expo-image-picker. Install it to take progress photos directly from this screen.
          </Text>
        </View>
      )}

      {photos.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="photo-camera" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Progress Photos</Text>
          <Text style={styles.emptySubtitle}>Take photos to visually track your body transformation</Text>
        </View>
      ) : (
        <View style={styles.photoGrid}>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoCard}>
              <View style={[styles.photoPlaceholder, { backgroundColor: typeColors[photo.photo_type] + '15' }]}>
                <Icon name="photo" size={32} color={typeColors[photo.photo_type]} />
              </View>
              <View style={styles.photoInfo}>
                <View style={[styles.typeBadge, { backgroundColor: typeColors[photo.photo_type] }]}>
                  <Text style={styles.typeText}>{photo.photo_type.toUpperCase()}</Text>
                </View>
                <Text style={styles.photoDate}>{formatDate(photo.date)}</Text>
                {photo.weight_kg !== null && (
                  <Text style={styles.photoWeight}>{photo.weight_kg.toFixed(1)} kg</Text>
                )}
                {photo.notes ? <Text style={styles.photoNotes}>{photo.notes}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EFF6FF', marginHorizontal: 16, marginBottom: 16,
    borderRadius: 12, padding: 14, gap: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 8, paddingHorizontal: 32 },
  photoGrid: { paddingHorizontal: 16 },
  photoCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  photoPlaceholder: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center' },
  photoInfo: { flex: 1, padding: 12 },
  typeBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 },
  typeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  photoDate: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  photoWeight: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  photoNotes: { fontSize: 12, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic' },
  spacer: { height: 20 },
});
