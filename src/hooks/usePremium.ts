import { useCallback, useEffect, useState } from 'react';
import { securityRepo } from '../database/repositories';

/**
 * Flag premium local (stocke dans app_settings, 100% offline).
 * Etape 1 : architecture prete, aucun paywall.
 * Etape 2 (plus tard) : les ecrans de facturation (Google Play Billing /
 * App Store) appelleront setPremium(true) apres validation de l'achat,
 * et les features premium gatees via isPremium.
 */
export function usePremium() {
  const [isPremiumState, setIsPremiumState] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsPremiumState(await securityRepo.isPremium());
    } catch (e) {
      console.error('Failed to load premium status:', e);
      setIsPremiumState(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setPremium = useCallback(async (value: boolean) => {
    await securityRepo.setPremium(value);
    setIsPremiumState(value);
  }, []);

  return {
    isPremium: isPremiumState === true,
    isLoading: isPremiumState === null,
    setPremium,
    refresh,
  };
}
