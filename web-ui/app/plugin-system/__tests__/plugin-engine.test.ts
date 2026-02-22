import { PluginEngine } from '../engine'
import dummy from '../dummy-plugin'

describe('PluginEngine (app)', () => {
  test('loads, registers, and activates a plugin', async () => {
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

    const engine = new PluginEngine(ctx)
    // Load the dummy plugin module using a relative path
    await engine.loadAndRegister('../dummy-plugin')
    engine.activateAll()

    // Verify that activation produced some observable side effects
    expect(events.length).toBeGreaterThan(0)
    // Panel should be registered by the dummy plugin during activation
    expect(events).toContain('panel:dummyPanel')
  })
})
