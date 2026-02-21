import type { ShellPlugin, PluginModule, PluginContext } from './plugin-context'

export class PluginEngine {
  private plugins: Map<string, ShellPlugin> = new Map()

  constructor(private context: PluginContext) {}

  register(plugin: ShellPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with id ${plugin.id} is already registered`)
    }
    this.plugins.set(plugin.id, plugin)
  }

  async loadAndRegister(modulePath: string): Promise<void> {
    const mod = await import(modulePath)
    const plugin: ShellPlugin = ((mod.default ?? mod) as PluginModule) as ShellPlugin
    this.register(plugin)
  }

  activateAll(): void {
    this.plugins.forEach((p) => {
      try {
        p.activate(this.context)
      } catch (e) {
        // best effort logging
        if (this.context?.terminal?.log) {
          this.context.terminal.log?.(`plugin ${p.id} activation error: ${String(e)}`)
        }
      }
    })
  }

  deactivateAll(): void {
    this.plugins.forEach((p) => {
      if (typeof p.deactivate === 'function') {
        p.deactivate!()
      }
    })
  }

  getRegistered(): ShellPlugin[] {
    return Array.from(this.plugins.values())
  }
}

export type { PluginModule as PluginModuleType }
