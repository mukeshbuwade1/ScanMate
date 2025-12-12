import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { AdEventType, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

import { useAds } from '@/context/AdsProvider';
import { AdIds } from '@/lib/ads/config';

type Props = {
  onReward: () => void;
  label?: string;
  placement?: 'interstitial_scan';
};

const rewarded = RewardedAd.createForAdRequest(AdIds.rewarded || TestIds.REWARDED, {
  requestNonPersonalizedAdsOnly: true,
});

export const RewardedGate: React.FC<Props> = ({ onReward, label = 'Watch ad to unlock', placement = 'interstitial_scan' }) => {
  const { shouldShow } = useAds();
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const subLoad = rewarded.addAdEventListener(AdEventType.LOADED, () => setLoaded(true));
    const subReward = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      onReward();
      setLoaded(false);
      rewarded.load();
    });
    rewarded.load();
    return () => {
      subLoad();
      subReward();
    };
  }, [onReward]);

  const handlePress = () => {
    if (!shouldShow(placement)) {
      onReward();
      return;
    }
    if (loaded) {
      rewarded.show();
    } else {
      setLoading(true);
      rewarded.load();
      setTimeout(() => setLoading(false), 1000);
    }
  };

  return (
    <TouchableOpacity style={styles.btn} onPress={handlePress} disabled={loading}>
      <Text style={styles.text}>{loading ? 'Loading...' : label}</Text>
      {loading && <ActivityIndicator color="#fff" />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    color: '#0b1015',
    fontWeight: '700',
  },
});

