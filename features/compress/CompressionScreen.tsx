import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { compressPdf } from '@/lib/pdf/compress';
import { RewardedGate } from '@/components/ads/RewardedGate';
import { useAds } from '@/context/AdsProvider';

type Option = {
  id: 'small' | 'medium' | 'large';
  label: string;
  hint: string;
};

const OPTIONS: Option[] = [
  { id: 'small', label: 'Small', hint: 'Max compression, smallest size' },
  { id: 'medium', label: 'Medium', hint: 'Balanced size/quality' },
  { id: 'large', label: 'Large', hint: 'Best quality, minimal compression' },
];

export default function CompressionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ path?: string }>();
  const inputPath = params.path;
  const [selected, setSelected] = useState<Option['id']>('medium');
  const [isRunning, setIsRunning] = useState(false);
  const [resultPath, setResultPath] = useState<string | null>(null);
  const { isAdFree } = useAds();

  const handleRun = useCallback(async () => {
    if (!inputPath) return;
    setIsRunning(true);
    try {
      const res = await compressPdf(inputPath, selected);
      setResultPath(res.outputPath);
    } finally {
      setIsRunning(false);
    }
  }, [inputPath, selected]);

  const close = useCallback(() => router.back(), [router]);

  const runWithGate = useCallback(() => {
    if (selected === 'large' && !isAdFree) {
      // require rewarded ad for HQ compression
      return;
    }
    void handleRun();
  }, [handleRun, isAdFree, selected]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compress PDF</Text>
      {OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.option, selected === opt.id && styles.optionSelected]}
          onPress={() => setSelected(opt.id)}>
          <Text style={styles.optionLabel}>{opt.label}</Text>
          <Text style={styles.optionHint}>{opt.hint}</Text>
        </TouchableOpacity>
      ))}
      {selected === 'large' && !isAdFree ? (
        <RewardedGate onReward={handleRun} label={isRunning ? 'Compressing...' : 'Watch ad to unlock HQ'} />
      ) : (
        <TouchableOpacity style={[styles.runBtn, isRunning && { opacity: 0.7 }]} onPress={runWithGate} disabled={isRunning || !inputPath}>
          <Text style={styles.runText}>{isRunning ? 'Compressing...' : 'Run compression'}</Text>
        </TouchableOpacity>
      )}
      {resultPath && (
        <View style={styles.result}>
          <Text style={styles.resultText}>Compressed file:</Text>
          <Text style={styles.resultText}>{resultPath}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.closeBtn} onPress={close}>
        <Text style={styles.closeText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0b1015', gap: 12 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  option: {
    backgroundColor: '#141b23',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionSelected: { borderColor: '#22c55e' },
  optionLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  optionHint: { color: '#9ca3af', marginTop: 4 },
  runBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  runText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  result: { backgroundColor: '#111827', padding: 10, borderRadius: 8 },
  resultText: { color: '#fff' },
  closeBtn: {
    marginTop: 'auto',
    backgroundColor: '#374151',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeText: { color: '#fff', fontWeight: '700' },
});

