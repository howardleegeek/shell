import { atom } from 'nanostores';

const isBrowser = typeof window !== 'undefined';

const ANALYTICS_KEY = 'analytics_opt_out';

const getInitialAnalyticsPreference = (): boolean => {
  if (!isBrowser) return true;
  const stored = localStorage.getItem(ANALYTICS_KEY);
  return stored !== 'true';
};

export const analyticsEnabledStore = atom<boolean>(getInitialAnalyticsPreference());

export const setAnalyticsEnabled = (enabled: boolean): void => {
  analyticsEnabledStore.set(enabled);
  if (isBrowser) {
    localStorage.setItem(ANALYTICS_KEY, String(!enabled));
  }
};
