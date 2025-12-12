import React, { useEffect, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { AdEventType, InterstitialAd, TestIds } from 'react-native-google-mobile-ads';

import { useAds } from '@/context/AdsProvider';
import { AdIds } from '@/lib/ads/config';

type Props = {
  placement?: 'interstitial_scan';
  onUnlocked: () => void;
  label?: string;
};

const interstitial = InterstitialAd.createForAdRequest(AdIds.interstitial || TestIds.INTERSTITIAL, {
  requestNonPersonalizedAdsOnly: true,
});

export const InterstitialGate: React.FC<Props> = ({ onUnlocked, label = 'Continue', placement = 'interstitial_scan' }) => {
  const { shouldShow } = useAds();
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsub = interstitial.addAdEventListener(AdEventType.LOADED, () => setLoaded(true));
    const unsubClose = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      onUnlocked();
      interstitial.load();
    });
    interstitial.load();
    return () => {
      unsub();
      unsubClose();
    };
  }, [onUnlocked]);

  const handlePress = () => {
    if (!shouldShow(placement)) {
      onUnlocked();
      return;
    }
    if (loaded) {
      interstitial.show();
    } else {
      setLoading(true);
      interstitial.load();
      setTimeout(() => setLoading(false), 1000);
    }
  };

  return (
    <TouchableOpacity style={styles.btn} onPress={handlePress} disabled={loading}>
      <Text style={styles.text}>{loading ? 'Loading ad…' : label}</Text>
      {loading && <ActivityIndicator color="#fff" />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
  },
});

