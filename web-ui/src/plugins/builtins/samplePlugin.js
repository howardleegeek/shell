// Built-in sample plugin to demonstrate the plugin system
module.exports = {
  id: 'shell-plugin-sample',
  name: 'Sample Shell Plugin',
  version: '0.1.0',
  description: 'A sample plugin used for demonstrating the plugin system',
  activate(context) {
    if (context && context.terminal && typeof context.terminal.write === 'function') {
      context.terminal.write('[shell-plugin-sample] activated');
    }
    // Optional: register a dummy panel via UI API if present
    if (context && context.ui && typeof context.ui.registerPanel === 'function') {
      try {
        context.ui.registerPanel({ id: 'samplePanel', title: 'Sample Panel' });
      } catch (e) {
        // ignore
      }
    }
  },
  deactivate() {
    // no-op for sample plugin
  }
};
