import { PostHog } from 'posthog-js';

const ANALYTICS_KEY = 'analytics_opt_out';
const POSTHOG_KEY = 'posthog_analytics_enabled';

const isBrowser = typeof window !== 'undefined';

let posthog: PostHog | null = null;

const getPostHogKey = (): string | undefined => {
  if (!isBrowser) return undefined;
  return import.meta.env.VITE_POSTHOG_KEY;
};

export const initAnalytics = async (): Promise<void> => {
  if (!isBrowser) return;

  const isOptedOut = localStorage.getItem(ANALYTICS_KEY) === 'true';
  if (isOptedOut) return;

  const apiKey = getPostHogKey();
  if (!apiKey) {
    console.warn('[Analytics] PostHog API key not configured');
    return;
  }

  try {
    posthog = new PostHog(apiKey, {
      host: 'https://app.posthog.com',
      enable: true,
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: true,
    });

    localStorage.setItem(POSTHOG_KEY, 'true');
    console.log('[Analytics] PostHog initialized');
  } catch (error) {
    console.error('[Analytics] Failed to initialize:', error);
  }
};

export const isAnalyticsEnabled = (): boolean => {
  if (!isBrowser) return false;
  const isOptedOut = localStorage.getItem(ANALYTICS_KEY) === 'true';
  return !isOptedOut && posthog !== null;
};

export const getAnalytics = (): PostHog | null => posthog;

export const optInAnalytics = async (): Promise<void> => {
  if (!isBrowser) return;
  localStorage.setItem(ANALYTICS_KEY, 'false');
  localStorage.setItem(POSTHOG_KEY, 'true');
  await initAnalytics();
};

export const optOutAnalytics = (): void => {
  if (!isBrowser) return;
  localStorage.setItem(ANALYTICS_KEY, 'true');
  localStorage.setItem(POSTHOG_KEY, 'false');
  if (posthog) {
    posthog.optOutCapturing();
    posthog = null;
  }
};

export type EventProperties = Record<string, string | number | boolean | undefined>;

const safeCapture = (event: string, properties?: EventProperties): void => {
  if (!isAnalyticsEnabled() || !posthog) return;
  
  try {
    posthog.capture(event, properties);
  } catch (error) {
    console.error('[Analytics] Failed to capture event:', error);
  }
};

export const analytics = {
  track: safeCapture,

  projectCreated: (chain: string, template: string) => {
    safeCapture('project_created', { chain, template });
  },

  buildTriggered: (chain: string, success: boolean) => {
    safeCapture('build_triggered', { chain, success });
  },

  testTriggered: (chain: string, success: boolean) => {
    safeCapture('test_triggered', { chain, success });
  },

  auditTriggered: (chain: string, issuesFound: number) => {
    safeCapture('audit_triggered', { chain, issues_found: issuesFound });
  },

  deployTriggered: (chain: string, network: string, success: boolean) => {
    safeCapture('deploy_triggered', { chain, network, success });
  },

  autoRepairUsed: (success: boolean) => {
    safeCapture('auto_repair_used', { success });
  },

  templateUsed: (templateId: string, category: string) => {
    safeCapture('template_used', { template_id: templateId, category });
  },

  panelOpened: (panelName: string) => {
    safeCapture('panel_opened', { panel_name: panelName });
  },

  featureUsed: (featureName: string, details?: EventProperties) => {
    safeCapture('feature_used', { feature_name: featureName, ...details });
  },
};
