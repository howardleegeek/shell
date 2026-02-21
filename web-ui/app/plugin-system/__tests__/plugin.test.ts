import { PluginManager } from '../manager'
import Slither from '../shell-plugin-slither'
import type { ShellPlugin } from '../plugin-api'

describe('PluginManager', () => {
  test('registers and activates a plugin', () => {
    const events: string[] = []
    const ctx: any = {
      editor: {
        getContent: () => 'contract C {}',
        setContent: (c: string) => events.push(`set:${c}`),
      },
      terminal: {
        log: (m: string) => events.push(`term:${m}`),
      },
      reports: {
        writeReport: (name: string, payload: any) => events.push(`report:${name}:${JSON.stringify(payload)}`),
        readReport: (name: string) => null,
      },
      chain: {
        call: async (m: string, payload?: any) => ({ m, payload }),
      },
      ui: {
        registerPanel: (id: string, cfg: any) => events.push(`panel:${id}`),
        unregisterPanel: (id: string) => events.push(`unpanel:${id}`),
      },
    }

    const manager = new PluginManager()
    // Slither is a valid plugin module
    manager.register(Slither as unknown as ShellPlugin)
    manager.activateAll(ctx)

    // Verify some activity occurred
    expect(events.length).toBeGreaterThan(0)
    // Panel should be registered
    expect(events).toContain('panel:slitherPanel')
  })
})
