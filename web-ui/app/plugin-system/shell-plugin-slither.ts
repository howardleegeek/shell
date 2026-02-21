import type { ShellPlugin } from './plugin-api'

const PLUGIN_ID = 'shell-plugin-slither'

const plugin: ShellPlugin = {
  id: PLUGIN_ID,
  name: 'Slither Auditor',
  version: '0.1.0',
  description: 'Static analysis for Solidity-like contracts',
  chain: 'evm',
  activate(context) {
    // Minimal example: read editor content and report simple analysis result
    const content = context.editor.getContent()
    context.terminal.log(`[${PLUGIN_ID}] analyzing content of length ${content.length}`)
    context.reports.writeReport(PLUGIN_ID, { analyzed: true, length: content.length, timestamp: Date.now() })
    context.ui.registerPanel('slitherPanel', { title: 'Slither Analysis', content: 'Analysis ready' })
  },
  deactivate() {
    // Cleanup would be implemented in a full system
  }
}

export default plugin
