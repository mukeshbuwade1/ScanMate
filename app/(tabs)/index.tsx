import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, PhotoFile, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

import { useDocumentStore } from '@/context/DocumentStoreProvider';
import { EdgeBox, normalizeBox, useEdgeFrameProcessor } from '@/lib/cv/edgeDetection';

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
  const { addDocument, setStatus } = useDocumentStore();
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
      setStatus(doc.id, 'processing');
    } catch (error) {
      console.warn('Capture failed', error);
    }
  }, [addDocument, device, setStatus]);

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
      <View style={styles.bottomBar}>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{edgeBox?.source === 'fp' ? 'Edge detector: Frame Processor' : 'Edge detector: Fallback'}</Text>
          {lastPhoto && <Text style={styles.statusText}>Saved: {lastPhoto.path.split('/').pop()}</Text>}
        </View>
        <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
          <View style={styles.captureInner} />
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
  bottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statusRow: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
});
