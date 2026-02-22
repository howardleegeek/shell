// Lightweight JavaScript Plugin Manager for web-ui
// Simple plugin interface contract:
// {
//   id, name, version, description,
//   activate(context: PluginContext): void,
//   deactivate?(): void
// }
class PluginManager {
  constructor(logger) {
    this.logger = logger || console;
    this.plugins = new Map();
  }

  // Register a plugin object implementing the minimal interface
  registerPlugin(plugin) {
    if (!plugin || !plugin.id) {
      throw new Error('Invalid plugin: missing id');
    }
    this.plugins.set(plugin.id, Object.assign({ active: false }, plugin));
    this.logger.log(`Registered plugin: ${plugin.id}`);
  }

  // Dynamically load plugins from filesystem paths (CommonJS modules)
  loadPluginsFromPaths(paths) {
    const loaded = [];
    if (!Array.isArray(paths)) return loaded;
    for (const p of paths) {
      try {
        // eslint-disable-next-line global-require
        const mod = require(p);
        if (mod && mod.id) {
          this.registerPlugin(mod);
          loaded.push(p);
        }
      } catch (e) {
        this.logger.error(`Failed to load plugin ${p}: ${e.message}`);
      }
    }
    return loaded;
  }

  enablePlugin(id) {
    const pl = this.plugins.get(id);
    if (pl) pl.enabled = true;
  }

  disablePlugin(id) {
    const pl = this.plugins.get(id);
    if (pl) pl.enabled = false;
  }

  activateAll(context) {
    for (const pl of this.plugins.values()) {
      try {
        if (typeof pl.activate === 'function') {
          pl.activate(context);
          pl.active = true;
        }
      } catch (e) {
        this.logger.error(`Plugin ${pl.id} activate failed: ${e.message}`);
      }
    }
  }

  getPlugin(id) {
    return this.plugins.get(id);
  }

  _iterPlugins() {
    return Array.from(this.plugins.values());
  }
}

module.exports = PluginManager;
