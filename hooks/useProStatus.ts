import { useEffect, useState, useCallback } from 'react';
import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';

import { ENTITLEMENT_ID, REVENUECAT_API_KEY } from '@/lib/billing/config';

type ProState = {
  isPro: boolean;
  offerings: PurchasesOffering | null;
  currentPackage: PurchasesPackage | null;
  customerInfo: CustomerInfo | null;
  restore: () => Promise<void>;
  purchase: (pack: PurchasesPackage) => Promise<void>;
  loading: boolean;
};

export const useProStatus = (): ProState => {
  const [isPro, setIsPro] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [currentPackage, setCurrentPackage] = useState<PurchasesPackage | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!REVENUECAT_API_KEY) return;
    Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    Purchases.getOfferings().then(({ current }) => {
      setOfferings(current ?? null);
      const pkg = current?.availablePackages?.[0] ?? null;
      setCurrentPackage(pkg);
    });
    Purchases.getCustomerInfo().then((info) => {
      setCustomerInfo(info);
      setIsPro(info.entitlements.active[ENTITLEMENT_ID] !== undefined);
    });
    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
      setIsPro(info.entitlements.active[ENTITLEMENT_ID] !== undefined);
    });
    return () => {
      listener.remove();
    };
  }, []);

  const restore = useCallback(async () => {
    setLoading(true);
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      setIsPro(info.entitlements.active[ENTITLEMENT_ID] !== undefined);
    } finally {
      setLoading(false);
    }
  }, []);

  const purchase = useCallback(async (pack: PurchasesPackage) => {
    setLoading(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);
      setCustomerInfo(customerInfo);
      setIsPro(customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isPro,
    offerings,
    currentPackage,
    customerInfo,
    restore,
    purchase,
    loading,
  };
};

