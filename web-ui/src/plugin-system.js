// Lightweight Plugin System for web UI
// This module provides a minimal plugin mechanism to load, register,
// activate and manage plugins for the shell-vibe-ide UI.
// It is designed to be simple and test-friendly.

class PluginManager {
  constructor(ui) {
    this.ui = ui;
    this.plugins = new Map(); // id -> plugin object
    this.active = new Set();
  }

  // Load plugins described in a manifest.json inside the provided directory
  // Manifest structure:
  // { "plugins": [ { "id": "plugin-id", "name": "Plugin", "entry": "plugin-file.js" } ] }
  loadFromDirectory(dir) {
    const fs = require('fs');
    const path = require('path');
    const manifestPath = path.resolve(dir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      return Promise.resolve([]);
    }
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      return Promise.reject(e);
    }
    const loaded = [];
    const plugins = manifest.plugins || [];
    for (const item of plugins) {
      try {
        const modPath = path.resolve(dir, item.entry);
        const mod = require(modPath);
        const plugin = (mod && (mod.default || mod));
        if (plugin && plugin.id) {
          this.register(plugin);
          loaded.push(plugin.id);
        }
      } catch (e) {
        // Swallow per-plugin load errors to continue loading others
        console.error('[PluginManager] failed to load', item?.entry, e);
      }
    }
    return Promise.resolve(loaded);
  }

  register(plugin) {
    if (!plugin || !plugin.id) {
      throw new Error('Invalid plugin');
    }
    this.plugins.set(plugin.id, plugin);
  }

  activate(id, context) {
    const p = this.plugins.get(id);
    if (!p) throw new Error('Plugin not found: ' + id);
    if (typeof p.activate === 'function') {
      p.activate(context);
      this.active.add(id);
    }
  }

  deactivate(id) {
    const p = this.plugins.get(id);
    if (p && typeof p.deactivate === 'function') p.deactivate();
    this.active.delete(id);
  }

  list() {
    return Array.from(this.plugins.values()).map(p => p.id);
  }
}

// Convenience: mock context for quick plugin activation/testing
function createMockContext() {
  return {
    editor: {
      getValue: () => '',
      setValue: (k, v) => {}
    },
    terminal: {
      writes: [],
      write: function (txt) { this.writes.push(txt); }
    },
    reports: {
      addReport: (id, content) => {}
    },
    chain: {
      sendTransaction: () => {}
    },
    ui: {
      registerPanel: (id, cfg) => {}
    }
  };
}

// Lightweight demo plugin for in-repo testing
function demoRunDemoActivation() {
  const ctx = createMockContext();
  const manager = new PluginManager();
  const demo = {
    id: 'demo-plugin',
    name: 'Demo Plugin',
    version: '0.1.0',
    description: 'A demo built-in plugin',
    activate(ctx) {
      ctx.terminal && ctx.terminal.write('[DemoPlugin] Activated\n');
    },
    deactivate() {}
  };
  manager.register(demo);
  manager.activate('demo-plugin', ctx);
  return ctx.terminal.writes;
}

module.exports = {
  PluginManager,
  createMockContext,
  demoRunDemoActivation
};
