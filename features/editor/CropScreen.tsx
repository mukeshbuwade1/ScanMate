import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useDocumentStore } from '@/context/DocumentStoreProvider';
import { processImage } from '@/lib/image/processImage';
import { saveProcessedImage } from '@/lib/storage/pages';
import type { Corner, CropState, FilterPreset } from './types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const defaultCorners: [Corner, Corner, Corner, Corner] = [
  { x: 0.1, y: 0.1 },
  { x: 0.9, y: 0.1 },
  { x: 0.9, y: 0.9 },
  { x: 0.1, y: 0.9 },
];

export default function CropScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string; width?: string; height?: string }>();
  const sourceUri = params.uri;
  const imageWidth = Number(params.width) || SCREEN_W;
  const imageHeight = Number(params.height) || SCREEN_H;
  const { addDocument, setStatus } = useDocumentStore();

  const [state, setState] = useState<CropState>({
    corners: defaultCorners,
    rotation: 0,
    scale: 1,
    filter: 'original',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const warm = async () => {
      if (sourceUri) {
        await ImageManipulator.manipulateAsync(sourceUri, [], { compress: 1, format: ImageManipulator.SaveFormat.JPEG });
      }
    };
    warm();
  }, [sourceUri]);

  const panResponders = useMemo(
    () =>
      state.corners.map((corner, idx) =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onPanResponderMove: (_, gesture) => {
            const dx = gesture.dx / SCREEN_W;
            const dy = gesture.dy / SCREEN_H;
            setState((prev) => {
              const next = [...prev.corners] as [Corner, Corner, Corner, Corner];
              next[idx] = {
                x: clamp(corner.x + dx, 0, 1),
                y: clamp(corner.y + dy, 0, 1),
              };
              return { ...prev, corners: next };
            });
          },
        }),
      ),
    [state.corners],
  );

  const handleFilter = useCallback((filter: FilterPreset) => {
    setState((prev) => ({ ...prev, filter }));
  }, []);

  const handleRotate = useCallback(() => {
    setState((prev) => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!sourceUri) return;
    setIsSaving(true);
    try {
      const result = await processImage({
        uri: sourceUri,
        originalWidth: imageWidth,
        originalHeight: imageHeight,
        crop: state,
      });
      const doc = addDocument({
        title: `Scan ${new Date().toLocaleTimeString()}`,
        localPath: result.uri,
        pages: 1,
      });
      await saveProcessedImage(doc.id, 1, result.uri);
      setStatus(doc.id, 'processing');
      router.back();
    } catch (error) {
      console.warn('Failed to save', error);
    } finally {
      setIsSaving(false);
    }
  }, [addDocument, imageHeight, imageWidth, router, setStatus, sourceUri, state]);

  if (!sourceUri) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>No image to crop</Text>
      </View>
    );
  }

  const [tl, tr, br, bl] = state.corners;

  return (
    <View style={styles.container}>
      <Image source={{ uri: sourceUri }} style={styles.image} contentFit="contain" />
      {[tl, tr, br, bl].map((c, idx) => (
        <View
          key={idx}
          style={[
            styles.handle,
            {
              left: c.x * SCREEN_W - 12,
              top: c.y * SCREEN_H - 12,
            },
          ]}
          {...panResponders[idx].panHandlers}
        />
      ))}
      <View
        pointerEvents="none"
        style={[
          styles.polygon,
          {
            left: Math.min(tl.x, bl.x) * SCREEN_W,
            top: Math.min(tl.y, tr.y) * SCREEN_H,
            width: (Math.max(tr.x, br.x) - Math.min(tl.x, bl.x)) * SCREEN_W,
            height: (Math.max(bl.y, br.y) - Math.min(tl.y, tr.y)) * SCREEN_H,
          },
        ]}
      />
      <View style={styles.bottomBar}>
        <View style={styles.filterRow}>
          {(['original', 'bw', 'enhance'] as FilterPreset[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, state.filter === f && styles.filterButtonActive]}
              onPress={() => handleFilter(f)}>
              <Text style={styles.filterText}>{f.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.filterButton} onPress={handleRotate}>
            <Text style={styles.filterText}>ROTATE</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.saveButton, isSaving && { opacity: 0.7 }]} onPress={handleSave} disabled={isSaving}>
          <Text style={styles.saveText}>{isSaving ? 'Processing...' : 'Save as new file'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  handle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  polygon: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
  },
  filterButtonActive: {
    backgroundColor: '#22c55e',
  },
  filterText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    color: '#fff',
  },
});

