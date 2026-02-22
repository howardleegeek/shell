// Minimal MCP server registry for Forge Build tool integration
// This file registers MCP tools for the shell's MCP server.

import forge_build from "./tools/forge-build";

type ToolSpec = {
  name: string;
  description: string;
  inputSchema?: any;
  run: (...args: any[]) => any;
};

// Simple registry that can be expanded by the hosting environment
export const tools: ToolSpec[] = [
  {
    name: "forge_build",
    description: "Compile Solidity contracts using Foundry. Returns ABI and bytecode.",
    inputSchema: {
      project_dir: "string",
      contract_name: "string?",
      optimize: "boolean?",
      optimize_runs: "number?",
    },
    run: forge_build as any,
  },
];

export default tools;
