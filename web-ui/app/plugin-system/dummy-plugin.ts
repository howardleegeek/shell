// Local plugin types for the test plugin
type EditorAPI = { getContent(): string; setContent(content: string): void }
type TerminalAPI = { log(message: string): void }
type ReportsAPI = { writeReport(name: string, payload: any): void; readReport(name: string): any }
type ChainAPI = { call(method: string, payload?: any): Promise<any> }
type UIAPI = { registerPanel(id: string, config: any): void; unregisterPanel(id: string): void }
type PluginContext = { editor: EditorAPI; terminal: TerminalAPI; reports: ReportsAPI; chain: ChainAPI; ui: UIAPI }
type ShellPluginLocal = { id: string; name: string; version: string; description: string; chain?: 'svm'|'evm'|'move'|'all'; activate(context: PluginContext): void; deactivate?(): void }

const PLUGIN_ID = 'dummy-plugin'

const plugin: ShellPluginLocal = {
  id: PLUGIN_ID,
  name: 'Dummy Plugin',
  version: '0.1.0',
  description: 'A test plugin',
  chain: 'all',
  activate(context) {
    context.ui.registerPanel('dummyPanel', { title: 'Dummy', content: 'Active' })
  },
  deactivate() {}
}

export default (plugin as unknown) as any
