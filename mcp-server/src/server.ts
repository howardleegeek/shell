// Lightweight MCP Server bootstrap for discovering tools
// This file provides a tiny registry so tests can import and verify tool wiring.

type ToolSpec = {
  name: string;
  description?: string;
  inputSchema?: any;
  run: (input: any) => Promise<any>;
};

const registry: ToolSpec[] = [];

export function registerTool(tool: ToolSpec) {
  // Idempotent registration
  if (!tool || !tool.name) return;
  const exists = registry.find((t) => t.name === tool.name);
  if (!exists) {
    registry.push(tool);
  }
}

export function listTools(): ToolSpec[] {
  return registry.slice();
}

// Auto-register the forge_build tool when the module is loaded, if available.
try {
  // Dynamic import-safe: avoid hard dependency during tests
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const forgeBuild = require("./tools/forge-build.ts");
  // forge-build.ts exports by default; guard against missing export
  if (forgeBuild?.forge_build) {
    registerTool((forgeBuild as any).forge_build);
  } else if (forgeBuild?.default) {
    registerTool((forgeBuild as any).default);
  }
} catch {
  // No-op if forge-build.ts is not yet compiled by TS module resolution in test env
}

export { registry as toolsRegistry };
