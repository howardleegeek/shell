#!/usr/bin/env node
/**
 * Lightweight test for the OpenCode Shell Plugin System
 * - Creates a PluginManager
 * - Loads plugins from ./plugins/sample-plugins
 * - Activates them with a fake context
 * - Verifies activation side-effects
 */
const path = require('path');
const { PluginManager } = require('./plugins/manager');

function fakeContext() {
  const state = { panels: [], content: '' };
  return {
    editor: {
      write: (txt) => { state.content += txt + '\n'; }
    },
    ui: {
      registerPanel: (name, opts) => { state.panels.push({ name, opts }); }
    },
    reports: {},
    chain: {},
    uiState: state
  };
}

async function run() {
  const mgr = new PluginManager();
  const pluginsDir = path.resolve(__dirname, 'plugins/sample-plugins');
  // Ensure platform-native path in test environment
  if (!require('fs').existsSync(pluginsDir)) {
    console.error('Plugins dir not found for test:', pluginsDir);
    process.exit(1);
  }
  mgr.loadPlugins(pluginsDir);
  const ctx = fakeContext();
  mgr.activateAll(ctx);
  // Simple assertions
  const hasEcho = mgr.getInstalled().some(p => p.id === 'echo-plugin');
  const hasPanel = ctx.uiState.panels.find(p => p.name === 'Echo Panel');
  const hasContent = typeof ctx.editor.write === 'function';
  if (hasEcho && hasPanel && hasContent) {
    console.log('PLUGIN SYSTEM TEST: PASSED');
    process.exit(0);
  } else {
    console.error('PLUGIN SYSTEM TEST: FAILED', { hasEcho, hasPanel, hasContent });
    process.exit(2);
  }
}

run().catch((e) => { console.error('TEST ERROR', e); process.exit(3); });
