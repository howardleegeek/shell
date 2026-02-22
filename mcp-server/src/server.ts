#!/usr/bin/env node
import { McpServer, StdioServerTransport, SSEServerTransport } from "@modelcontextprotocol/sdk/server";
import { ForgeTestResult, BuildResult, DeployResult, ReportData } from "./types";

// Very small, minimal MCP server skeleton.
// Command line: --transport stdio|sse --port 3001

function parseArgs() {
  const args = process.argv.slice(2);
  const cfg: { transport: "stdio" | "sse"; port?: number } = { transport: "stdio" };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--transport" && i + 1 < args.length) {
      const t = (args[i + 1] as string).toLowerCase();
      cfg.transport = t === "stdio" ? "stdio" : "sse";
      i++;
    } else if (a === "--port" && i + 1 < args.length) {
      const p = parseInt(args[i + 1], 10);
      if (!Number.isNaN(p)) cfg.port = p;
      i++;
    }
  }
  return cfg;
}

function main() {
  const cfg = parseArgs();
  let transport: any;
  if (cfg.transport === "stdio") {
    transport = new StdioServerTransport();
  } else {
    const port = cfg.port ?? 3001;
    transport = new SSEServerTransport({ port });
  }

  // Instantiate MCP Server
  const server: any = new McpServer({ transport });

  // Register a simple health ping tool
  const pingTool = {
    name: "ping",
    run: async (_input?: any) => {
      return { ok: true, message: "pong" };
    }
  };

  // Some MCP servers expose a `register` method; guard against variations.
  if (typeof server.register === "function") {
    server.register(pingTool);
  } else if (typeof server.registerTool === "function") {
    server.registerTool(pingTool);
  } else if (typeof server.addTool === "function") {
    server.addTool(pingTool);
  } else {
    // Fallback: attach to a known property if available
    (server as any).tools = [(server as any).tools?.[0] ?? pingTool];
  }

  // Start listening/serving (depending on transport, the MCP server might auto-start)
  if (typeof server.start === "function") {
    server.start();
  } else {
    // Best-effort: if transport is stdio, nothing else to do
    console.log("MCP server initialized with transport:", cfg.transport);
  }
}

main();
