import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type AdPlacement = 'home_banner' | 'list_native' | 'interstitial_scan';
type ConsentStatus = 'unknown' | 'granted' | 'denied';

type AdsContextValue = {
  consent: ConsentStatus;
  isAdFree: boolean;
  placements: Record<AdPlacement, boolean>;
  setConsent: (value: ConsentStatus) => void;
  enableAdFree: (value: boolean) => void;
  shouldShow: (placement: AdPlacement) => boolean;
  recordImpression: (placement: AdPlacement) => void;
};

const defaultPlacements: Record<AdPlacement, boolean> = {
  home_banner: true,
  list_native: true,
  interstitial_scan: true,
};

const AdsContext = createContext<AdsContextValue | undefined>(undefined);

export const AdsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [consent, setConsent] = useState<ConsentStatus>('unknown');
  const [isAdFree, setIsAdFree] = useState(false);
  const [placements, setPlacements] = useState<Record<AdPlacement, boolean>>(defaultPlacements);

  const enableAdFree = useCallback((value: boolean) => {
    setIsAdFree(value);
  }, []);

  const shouldShow = useCallback(
    (placement: AdPlacement) => !isAdFree && placements[placement] && consent !== 'denied',
    [consent, isAdFree, placements],
  );

  const recordImpression = useCallback((placement: AdPlacement) => {
    setPlacements((prev) => ({ ...prev, [placement]: prev[placement] ?? true }));
    // TODO: hook into AdMob analytics impression tracking.
  }, []);

  const value = useMemo<AdsContextValue>(
    () => ({
      consent,
      isAdFree,
      placements,
      setConsent,
      enableAdFree,
      shouldShow,
      recordImpression,
    }),
    [consent, enableAdFree, isAdFree, placements, recordImpression, shouldShow],
  );

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
};

export const useAds = () => {
  const ctx = useContext(AdsContext);
  if (!ctx) throw new Error('useAds must be used within AdsProvider');
  return ctx;
};

