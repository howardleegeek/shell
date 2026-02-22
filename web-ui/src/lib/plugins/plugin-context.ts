// Shared plugin context interfaces for the web UI plugin system
export interface EditorAPI {
  getContent(): string
  setContent(content: string): void
}

export interface TerminalAPI {
  log(message: string): void
}

export interface ReportsAPI {
  writeReport(name: string, payload: any): void
  readReport(name: string): any
}

export interface ChainAPI {
  call(method: string, payload?: any): Promise<any>
}

export interface UIAPI {
  registerPanel(id: string, config: any): void
  unregisterPanel(id: string): void
}

export interface PluginContext {
  editor: EditorAPI
  terminal: TerminalAPI
  reports: ReportsAPI
  chain: ChainAPI
  ui: UIAPI
}

export interface ShellPlugin {
  id: string
  name: string
  version: string
  description: string
  chain?: 'svm' | 'evm' | 'move' | 'all'
  activate(context: PluginContext): void
  deactivate?(): void
}

export type PluginModule = { default: ShellPlugin } | ShellPlugin

export { ShellPlugin as OpenCodeShellPlugin }
