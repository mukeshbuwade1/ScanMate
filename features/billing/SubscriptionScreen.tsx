import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAds } from '@/context/AdsProvider';
import { useProStatus } from '@/hooks/useProStatus';

export default function SubscriptionScreen() {
  const { isPro, offerings, restore, purchase, loading } = useProStatus();
  const router = useRouter();
  const { enableAdFree } = useAds();

  React.useEffect(() => {
    enableAdFree(isPro);
  }, [enableAdFree, isPro]);

  const onPurchase = useCallback(
    async (pkgId: string) => {
      const pack = offerings?.availablePackages.find((p) => p.identifier === pkgId);
      if (!pack) return;
      await purchase(pack);
    },
    [offerings?.availablePackages, purchase],
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => onPurchase(item.identifier)} disabled={loading || isPro}>
      <Text style={styles.title}>{item.packageType.toUpperCase()}</Text>
      <Text style={styles.price}>{item.product.priceString}</Text>
      <Text style={styles.desc}>{item.product.description}</Text>
      {isPro && <Text style={styles.badge}>Active</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{isPro ? 'You are Pro' : 'Go Pro'}</Text>
      {offerings?.availablePackages?.length ? (
        <FlatList data={offerings.availablePackages} renderItem={renderItem} keyExtractor={(item) => item.identifier} />
      ) : (
        <Text style={styles.desc}>No products available yet.</Text>
      )}
      <TouchableOpacity style={styles.restore} onPress={restore} disabled={loading}>
        <Text style={styles.restoreText}>{loading ? 'Restoring...' : 'Restore purchases'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1015', padding: 16 },
  header: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  card: {
    backgroundColor: '#141b23',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  price: { color: '#22c55e', fontSize: 16, marginTop: 4 },
  desc: { color: '#9ca3af', marginTop: 6 },
  badge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#22c55e',
    color: '#0b1015',
    borderRadius: 8,
    overflow: 'hidden',
  },
  restore: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  restoreText: { color: '#fff', fontWeight: '700' },
  close: {
    marginTop: 10,
    backgroundColor: '#374151',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeText: { color: '#fff', fontWeight: '700' },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});

