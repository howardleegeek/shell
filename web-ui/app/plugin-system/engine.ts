// Lightweight plugin engine for tests in the App plugin-system
export interface EditorAPI { getContent(): string; setContent(content: string): void }
export interface TerminalAPI { log(message: string): void }
export interface ReportsAPI { writeReport(name: string, payload: any): void; readReport(name: string): any }
export interface ChainAPI { call(method: string, payload?: any): Promise<any> }
export interface UIAPI { registerPanel(id: string, config: any): void; unregisterPanel(id: string): void }

export interface PluginContext { editor: EditorAPI; terminal: TerminalAPI; reports: ReportsAPI; chain: ChainAPI; ui: UIAPI }

export interface ShellPlugin { id: string; name: string; version: string; description: string; chain?: 'svm'|'evm'|'move'|'all'; activate(context: PluginContext): void; deactivate?(): void }

export class PluginEngine {
  private plugins: Map<string, ShellPlugin> = new Map()
  constructor(private context: PluginContext) {}

  register(plugin: ShellPlugin): void {
    if (this.plugins.has(plugin.id)) throw new Error(`Plugin with id ${plugin.id} is already registered`)
    this.plugins.set(plugin.id, plugin)
  }

  async loadAndRegister(modulePath: string): Promise<void> {
    const mod = await import(modulePath)
    const plugin = ((mod.default ?? mod) as any) as ShellPlugin
    this.register(plugin)
  }

  activateAll(): void {
    this.plugins.forEach((p) => {
      try { p.activate(this.context) } catch (e) {
        this.context?.terminal?.log?.(`plugin ${p.id} activation error: ${String(e)}`)
      }
    })
  }

  deactivateAll(): void {
    this.plugins.forEach((p) => { if (typeof p.deactivate === 'function') p.deactivate!() })
  }

  getRegistered(): ShellPlugin[] { return Array.from(this.plugins.values()) }
}
