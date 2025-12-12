import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BannerAdView } from '@/components/ads/BannerAdView';
import { useAds } from '@/context/AdsProvider';
import { useAuth } from '@/context/AuthProvider';
import { useProStatus } from '@/hooks/useProStatus';

export default function SettingsScreen() {
  const { isAdFree, consent, setConsent } = useAds();
  const { isPro } = useProStatus();
  const { isAnonymous } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.desc}>{isAnonymous ? 'Offline mode' : 'Signed in'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Pro status</Text>
        <Text style={styles.desc}>{isPro ? 'Pro active' : 'Free'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Ads & consent</Text>
        <Text style={styles.desc}>Ad-free: {isAdFree ? 'Yes' : 'No'} | Consent: {consent}</Text>
        <View style={styles.row}>
          <Text style={styles.link} onPress={() => setConsent('granted')}>
            Accept
          </Text>
          <Text style={styles.link} onPress={() => setConsent('denied')}>
            Deny
          </Text>
        </View>
      </View>

      <BannerAdView placement="home_banner" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1015' },
  header: { color: '#fff', fontSize: 22, fontWeight: '800' },
  card: {
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  desc: { color: '#9ca3af', marginTop: 4 },
  row: { flexDirection: 'row', gap: 14, marginTop: 8 },
  link: { color: '#60a5fa', fontWeight: '700' },
});

