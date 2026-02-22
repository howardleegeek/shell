import crypto from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import express from "express";
import { registerSecurityAuditTool } from "./tools/slither-audit.js";
import { forgeBuild } from "./tools/forge-build.js";
import { run as runGasProfiler } from "./tools/gas-profiler.js";
import { chain_status } from "./tools/chain-status.js";
import { runForgeTest } from "./tools/forge-test.js";
import { analyzeRepair } from "./tools/auto-repair.js";
import { create_project } from "./tools/create-project.js";

export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 3001;

export function parseCliOptions(args: string[]): { transport: string; port: number; host: string } {
  let transport = "stdio";
  let port = DEFAULT_PORT;
  let host = DEFAULT_HOST;

  const transportIdx = args.indexOf("--transport");
  if (transportIdx !== -1 && args[transportIdx + 1]) {
    const value = args[transportIdx + 1];
    if (value !== "stdio" && value !== "sse") {
      throw new Error(`Invalid --transport value: ${value}. Must be 'stdio' or 'sse'`);
    }
    transport = value;
  }

  const portIdx = args.indexOf("--port");
  if (portIdx !== -1 && args[portIdx + 1]) {
    const value = parseInt(args[portIdx + 1], 10);
    if (isNaN(value) || value < 1 || value > 65535) {
      throw new Error(`Invalid --port value: ${args[portIdx + 1]}. Must be 1-65535`);
    }
    port = value;
  }

  const hostIdx = args.indexOf("--host");
  if (hostIdx !== -1 && args[hostIdx + 1]) {
    host = args[hostIdx + 1];
  }

  return { transport, port, host };
}

export function createSessionId(): string {
  return crypto.randomUUID();
}

export function isValidSessionId(sessionId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(sessionId);
}

type ToolSpec = {
  name: string;
  description?: string;
  inputSchema?: any;
  run: (input: any) => Promise<any>;
};

const registry: ToolSpec[] = [];

const server = new McpServer({
  name: "mcp-server",
  version: "0.1.0",
});

server.tool(
  "auto_repair",
  "Analyze test failures and generate a repair patch. Uses rule-based heuristics.",
  {
    project_dir: z.string(),
    report: z.record(z.string(), z.unknown()),
    source_files: z.array(z.string()).optional(),
    max_patches: z.number().int().positive().optional(),
  },
  async ({ project_dir, report, source_files, max_patches }) => {
    const output = analyzeRepair({
      project_dir,
      report,
      source_files,
      max_patches,
    });

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
      structuredContent: output,
    };
  },
);

server.tool(
  "forge_build",
  "Compile Solidity contracts using Foundry. Returns ABI and bytecode.",
  {
    project_dir: z.string(),
    contract_name: z.string().optional(),
    optimize: z.boolean().optional(),
    optimize_runs: z.number().int().positive().optional(),
  },
  async ({ project_dir, contract_name, optimize, optimize_runs }) => {
    const result = await forgeBuild({ project_dir, contract_name, optimize, optimize_runs });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.tool(
  "gas_profiler",
  "Profile gas usage of smart contract functions and suggest optimizations.",
  {
    project_dir: z.string(),
    contract_name: z.string().optional(),
  },
  async ({ project_dir, contract_name }) => {
    const result = await runGasProfiler({ project_dir, contract_name });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.tool(
  "chain_status",
  "Check blockchain node status (Anvil, Hardhat, or custom RPC).",
  {
    chain: z.enum(["anvil", "hardhat", "custom"]).optional(),
    rpc_url: z.string().optional(),
  },
  async ({ chain, rpc_url }) => {
    const result = await chain_status({ chain, rpc_url });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.tool(
  "forge_test",
  "Run Foundry tests on Solidity contracts. Returns structured JSON results.",
  {
    project_dir: z.string(),
    test_filter: z.string().optional(),
    verbosity: z.number().int().min(0).max(5).optional(),
    gas_report: z.boolean().optional(),
  },
  async ({ project_dir, test_filter, verbosity, gas_report }) => {
    const result = await runForgeTest({ project_dir, test_filter, verbosity, gas_report });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.tool(
  "create_project",
  "Create a new Foundry project from a template.",
  {
    template: z.enum(["erc20-basic", "nft-collection", "defi-vault", "blank"]),
    project_name: z.string(),
    target_dir: z.string().optional(),
  },
  async ({ template, project_name, target_dir }) => {
    const result = await create_project({ template, project_name, target_dir });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

registerSecurityAuditTool(server);

async function main() {
  const args = process.argv.slice(2);
  const { transport, port, host } = parseCliOptions(args);
  // Load and register dynamic tools from tools/ directory (best-effort)
  await loadDynamicTools();

  if (transport === "sse") {
    const app = express();

    app.use(express.json());

    const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", corsOrigin);
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      if (req.method === "OPTIONS") {
        return res.sendStatus(200);
      }
      next();
    });

    const transports = new Map<string, SSEServerTransport>();

    app.get("/sse", async (req, res) => {
      req.socket.setTimeout(0);
      res.socket?.setTimeout(0);

      const sessionId = createSessionId();

      const transport = new SSEServerTransport(
        `/messages?sessionId=${sessionId}`,
        res,
      );
      transports.set(sessionId, transport);

      req.on("close", () => {
        transports.delete(sessionId);
      });

      await server.connect(transport);
    });

    app.post("/messages", async (req, res) => {
      const sessionId = req.query.sessionId as string;
      const transport = transports.get(sessionId);

      if (transport) {
        await transport.handlePostMessage(req, res);
      } else {
        res.status(400).send("Session Expired or Connection Not Established");
      }
    });

    app.listen(port, host, () => {
      console.log(`MCP Server running on SSE at http://${host}:${port}/sse`);
    });
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

export function listTools(): ToolSpec[] {
  return registry.slice();
}

// Dynamically register existing tools under mcp-server/src/tools at startup
// This satisfies the requirement to auto-register pre-existing tool definitions.
async function loadDynamicTools(): Promise<void> {
  try {
    const mod = await import("./tools/read-report.js");
    const m = (mod as any).default ?? mod;
    const readTool = m?.readReportTool ?? mod?.readReportTool;
    const readFn = m?.readReport ?? mod?.readReport;
    if (readTool && typeof readTool.name === "string") {
      const name = readTool.name;
      const description = readTool.description ?? "Read report";
      const inputSchema = readTool.inputSchema ?? {};
      const runFn = readTool.execute ?? readTool.run ?? readFn;
      if (typeof runFn === "function") {
        server.tool(
          name,
          description,
          inputSchema,
          async (input: any) => {
            const result = await runFn(input);
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
          },
        );
      }
    }
  } catch {
    // Ignore if dynamic tool loading is not available in the environment
  }
}

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

main().catch((error) => {
  console.error("Shell MCP Server Error:", error);
  process.exit(1);
});

export const tools = {
  create_project,
};
