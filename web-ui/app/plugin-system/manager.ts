import type { ShellPlugin, PluginContext } from './plugin-api'

export class PluginManager {
  private plugins: Map<string, ShellPlugin> = new Map()

  register(plugin: ShellPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with id ${plugin.id} is already registered`)
    }
    this.plugins.set(plugin.id, plugin)
  }

  async loadAndRegister(modulePath: string): Promise<void> {
    // Dynamic import of a plugin module. Expects a default export implementing ShellPlugin
    const mod = await import(modulePath)
    const plugin: ShellPlugin = (mod.default ?? mod) as ShellPlugin
    this.register(plugin)
  }

  activateAll(context: PluginContext): void {
    this.plugins.forEach((p) => {
      try {
        p.activate(context)
      } catch (e) {
        context.terminal?.log?.(`plugin ${p.id} activation error: ${e}`)
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

export { PluginManager }
