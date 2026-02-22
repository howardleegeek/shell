export type PluginCategory = 'Tools' | 'Analysis' | 'Deploy' | 'UI' | 'Chain-specific';

export interface PluginRating {
  average: number;
  count: number;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  npmPackage: string;
  downloads: number;
  chainSupport: string[];
  category: PluginCategory;
  rating: PluginRating;
  icon?: string;
}

export interface InstalledPlugin {
  pluginId: string;
  installedAt: string;
  version: string;
  enabled: boolean;
}

export interface PluginState {
  availablePlugins: Plugin[];
  installedPlugins: InstalledPlugin[];
  userRatings: Record<string, number>;
}
