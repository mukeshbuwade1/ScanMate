import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type PageItem = { uri: string; id: string };

export default function PageReorderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ pages?: string }>();
  const initialPages = params.pages ? (JSON.parse(params.pages) as string[]) : [];
  const [pages, setPages] = useState<PageItem[]>(initialPages.map((uri, idx) => ({ uri, id: `${idx}` })));

  const move = useCallback((from: number, to: number) => {
    setPages((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const saveOrder = useCallback(() => {
    router.back();
    // Caller can read order via callback/params; kept simple for now.
  }, [router]);

  const renderItem = ({ item, index }: { item: PageItem; index: number }) => (
    <View style={styles.row}>
      <Text style={styles.label}>Page {index + 1}</Text>
      <View style={styles.actions}>
        <TouchableOpacity disabled={index === 0} onPress={() => move(index, index - 1)} style={styles.btn}>
          <Text style={styles.btnText}>Up</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={index === pages.length - 1} onPress={() => move(index, index + 1)} style={styles.btn}>
          <Text style={styles.btnText}>Down</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reorder Pages</Text>
      <FlatList data={pages} renderItem={renderItem} keyExtractor={(item) => item.id} />
      <TouchableOpacity style={styles.save} onPress={saveOrder}>
        <Text style={styles.saveText}>Save Order</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0b1015' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: {
    backgroundColor: '#141b23',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { color: '#fff', fontSize: 16 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: '600' },
  save: {
    marginTop: 12,
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: { color: '#0b1015', fontWeight: '800', fontSize: 16 },
});

