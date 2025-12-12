import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, PhotoFile, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

import { BannerAdView } from '@/components/ads/BannerAdView';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentStore } from '@/context/DocumentStoreProvider';
import { EdgeBox, normalizeBox, useEdgeFrameProcessor } from '@/lib/cv/edgeDetection';
import { saveRawImage } from '@/lib/storage/pages';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EdgeOverlay: React.FC<{ box: EdgeBox | null }> = ({ box }) => {
  if (!box) return null;
  const color = box.source === 'fp' ? '#22c55e' : '#f59e0b';
  return (
    <View
      pointerEvents="none"
      style={[
        styles.edgeBox,
        {
          top: box.top,
          left: box.left,
          width: box.width,
          height: box.height,
          borderColor: color,
        },
      ]}
    />
  );
};

export default function CameraScreen() {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const { addDocument, setStatus, documents, hydrated } = useDocumentStore();
  const [edgeBox, setEdgeBox] = useState<EdgeBox | null>(null);
  const [lastPhoto, setLastPhoto] = useState<PhotoFile | null>(null);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const onEdges = useCallback((box: EdgeBox | null) => {
    setEdgeBox((prev) => box ?? prev);
  }, []);

  const frameProcessor = useEdgeFrameProcessor(onEdges);

  const overlayBox = useMemo(() => {
    if (!edgeBox || !device) return null;
    return normalizeBox(edgeBox, SCREEN_WIDTH, SCREEN_HEIGHT, device.previewWidth ?? SCREEN_WIDTH, device.previewHeight ?? SCREEN_HEIGHT);
  }, [device, edgeBox]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || !device) return;
    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'off',
      });
      setLastPhoto(photo);
      const doc = addDocument({
        title: `Scan ${new Date().toLocaleTimeString()}`,
        localPath: photo.path,
        pages: 1,
      });
      const savedRaw = await saveRawImage(doc.id, 1, photo.path);
      // Update document main path to the stored raw copy
      setStatus(doc.id, 'processing');
      // Optionally update localPath to raw copy
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      setTimeout(() => {
        // slight defer to avoid blocking capture UI
        setStatus(doc.id, 'idle');
      }, 200);
    } catch (error) {
      console.warn('Capture failed', error);
    }
  }, [addDocument, device, setStatus]);

  const renderDoc = ({ item }: { item: typeof documents[number] }) => (
    <View style={styles.docRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.docTitle}>{item.title}</Text>
        <Text style={styles.docMeta}>
          {item.pages} pages • {item.status}
        </Text>
      </View>
      <TouchableOpacity style={styles.docBtn}>
        <Text style={styles.docBtnText}>Open</Text>
      </TouchableOpacity>
    </View>
  );

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>Loading camera...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>Camera permission needed</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          photo
          frameProcessor={frameProcessor}
          frameProcessorFps={8}
        />
        <EdgeOverlay box={overlayBox} />
        <View style={styles.captureBar}>
          <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>{edgeBox?.source === 'fp' ? 'Edge detector: Frame Processor' : 'Edge detector: Fallback'}</Text>
            {lastPhoto && <Text style={styles.statusText}>Saved: {lastPhoto.path.split('/').pop()}</Text>}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent scans</Text>
        {!hydrated ? (
          <View style={styles.skeletonWrap}>
            <Skeleton height={60} />
            <Skeleton height={60} style={{ marginTop: 10 }} />
          </View>
        ) : documents.length === 0 ? (
          <EmptyState title="No documents yet" description="Capture a scan to get started." />
        ) : (
          <FlatList data={documents.slice(0, 5)} renderItem={renderDoc} keyExtractor={(item) => item.id} />
        )}
      </View>

      <BannerAdView placement="home_banner" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  hero: {
    height: SCREEN_HEIGHT * 0.45,
    backgroundColor: '#111',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  captureBar: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  statusRow: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    alignSelf: 'stretch',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  edgeBox: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2563eb',
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  section: {
    padding: 16,
    gap: 12,
    flex: 1,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  skeletonWrap: {
    gap: 10,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  docTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  docMeta: {
    color: '#9ca3af',
    marginTop: 4,
  },
  docBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2563eb',
    borderRadius: 10,
  },
  docBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
