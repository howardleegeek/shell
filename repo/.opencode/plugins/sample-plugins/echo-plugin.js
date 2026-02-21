module.exports = {
  id: 'echo-plugin',
  name: 'Echo Plugin',
  version: '0.1.0',
  description: 'A sample plugin that echoes activation to the UI context.',
  activate(context) {
    // register a sample panel if UI API exists
    if (context?.ui?.registerPanel) {
      context.ui.registerPanel('Echo Panel', { id: 'echo-panel' });
    }
    // write a sample message to editor if available
    if (context?.editor?.write) {
      context.editor.write('Echo Plugin Activated');
    }
    this.active = true;
  },
  deactivate() {
    this.active = false;
  }
};
