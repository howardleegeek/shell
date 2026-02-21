/* Plugin Manager for Shell OpenCode plugins (CommonJS based for Node runtime) */
const fs = require('fs');
const path = require('path');

class PluginManager {
  constructor() {
    this.plugins = new Map();
  }
  // Load plugins from a directory. Each plugin can be a .js file or a directory with index.js
  loadPlugins(baseDir) {
    const dir = path.resolve(baseDir);
    if (!fs.existsSync(dir)) {
      console.warn(`Plugin dir not found: ${dir}`);
      return [];
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const loaded = [];
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      let mod = null;
      try {
        if (entry.isDirectory()) {
          const idx = path.join(full, 'index.js');
          if (fs.existsSync(idx)) mod = require(idx);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          mod = require(full);
        }
      } catch (e) {
        console.error(`Failed to load plugin ${full}:`, e);
        continue;
      }
      if (!mod) continue;
      let plugin = mod.default ?? mod;
      if (typeof plugin === 'function') {
        try {
          plugin = plugin();
        } catch (e) {
          console.error(`Plugin factory error in ${full}:`, e);
          continue;
        }
      }
      if (!plugin || typeof plugin.id !== 'string' || typeof plugin.name !== 'string') {
        console.warn(`Invalid plugin structure in ${full}`);
        continue;
      }
      this.plugins.set(plugin.id, plugin);
      loaded.push(plugin);
    }
    return loaded;
  }
  getInstalled() {
    return Array.from(this.plugins.values());
  }
  activateAll(context) {
    for (const p of this.plugins.values()) {
      try { p.activate?.(context); } catch (e) { console.error(`Plugin activate error ${p.id}:`, e); }
    }
  }
  deactivateAll() {
    for (const p of this.plugins.values()) {
      try { p.deactivate?.(); } catch (e) { /* ignore */ }
    }
  }
}

module.exports = { PluginManager };
