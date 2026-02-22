// Minimal MCP server bootstrap to register tools.
// This file is a lightweight facade to expose tools to the MCP runner.

type ToolDescriptor = {
  name: string
  description?: string
  inputSchema?: any
  run: (input: any) => Promise<any>
}

// Registry for tools discovered by the MCP runtime
export const toolRegistry: ToolDescriptor[] = []

// Lazy import to avoid circular dependencies during bootstrap in some environments
try {
  // V1: try to register the Forge test tool if available
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const forgeTestModule = require('./tools/forge-test')
  if (forgeTestModule && forgeTestModule.default) {
    toolRegistry.push(forgeTestModule.default)
  } else if (forgeTestModule && forgeTestModule.forge_test) {
    toolRegistry.push(forgeTestModule.forge_test)
  }
} catch {
  // ignore if not present during lightweight bootstrap
}

export default toolRegistry
