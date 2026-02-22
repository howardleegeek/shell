// Demo built-in plugin for the plugin system
module.exports = {
  id: 'demo-plugin',
  name: 'Demo Plugin',
  version: '0.1.0',
  description: 'A demo built-in plugin',
  activate(ctx) {
    if (ctx && ctx.terminal) ctx.terminal.write('[DemoPlugin] Activated\\n');
  },
  deactivate() {}
};
