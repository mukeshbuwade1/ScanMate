import React from 'react';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import { AdIds } from '@/lib/ads/config';
import { useAds } from '@/context/AdsProvider';

type Props = {
  placement?: 'home_banner' | 'list_native';
};

export const BannerAdView: React.FC<Props> = ({ placement = 'home_banner' }) => {
  const { shouldShow } = useAds();
  if (!shouldShow(placement)) return null;

  return <BannerAd unitId={AdIds.banner || TestIds.BANNER} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />;
};

