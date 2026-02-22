import { PluginEngine } from '../lib/plugins/plugin-engine'
import type { ShellPlugin } from '../lib/plugins/plugin-context'

// Minimal context mock
const mockContext = {
  editor: {
    getContent: () => '',
    setContent: (c: string) => {}
  },
  terminal: {
    log: (m: string) => {}
  },
  reports: {
    writeReport: (_name: string, _payload: any) => {},
    readReport: (_name: string) => undefined
  },
  chain: {
    call: async (_method: string, _payload?: any) => undefined
  },
  ui: {
    registerPanel: (_id: string, _config: any) => {},
    unregisterPanel: (_id: string) => {}
  }
}

describe('PluginEngine', () => {
  test('registers and activates a plugin instance', () => {
    const engine = new PluginEngine(mockContext as any)
    const plugin: ShellPlugin = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '0.0.1',
      description: 'A plugin for unit tests',
      activate(ctx: any) {
        // store a flag on the plugin instance
        ;(this as any).activated = true
        ;(this as any).ctx = ctx
      },
      deactivate() {
        ;(this as any).deactivated = true
      }
    }

    engine.register(plugin)
    engine.activateAll()
    expect((plugin as any).activated).toBe(true)
  })

  // Dynamic module loading is environment-specific and may rely on Vite's
  // module resolution. The core behavior is covered by the registration/activation tests.
})
