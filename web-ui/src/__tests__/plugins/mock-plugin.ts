// Simple mock plugin module for testing PluginEngine.dynamic import
export default {
  id: 'mock-plugin',
  name: 'Mock Plugin',
  version: '0.1.0',
  description: 'A mock plugin used for unit tests',
  activate(ctx: any) {
    // Persist the context and mark as activated
    // @ts-ignore
    this.ctx = ctx
    // @ts-ignore
    this.activated = true
  },
  deactivate() {
    // @ts-ignore
    this.deactivated = true
  }
} as any
