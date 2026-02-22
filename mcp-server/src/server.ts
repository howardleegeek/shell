#!/usr/bin/env node
import { McpServer, StdioServerTransport, SSEServerTransport } from "@modelcontextprotocol/sdk/server";

async function main() {
  // Read transport and port from CLI
  const argv = process.argv;
  const tIdx = argv.indexOf("--transport");
  const transport = tIdx !== -1 && tIdx + 1 < argv.length ? String(argv[tIdx + 1]) : "stdio";
  const pIdx = argv.indexOf("--port");
  const port = pIdx !== -1 && pIdx + 1 < argv.length ? Number(argv[pIdx + 1]) : 3001;

  let transportInstance: any;
  if (transport === "stdio") {
    transportInstance = new StdioServerTransport();
  } else if (transport === "sse") {
    transportInstance = new SSEServerTransport({ port });
  } else {
    console.error(`Unknown transport: ${transport}`);
    process.exit(1);
  }

  // Instantiate MCP server with the chosen transport
  const MCPServer: any = McpServer;
  const server: any = new MCPServer({ transport: transportInstance });

  // Register a simple health check tool 'ping' for MCP protocol
  if (typeof server.registerTool === "function") {
    server.registerTool("ping", async (params: any) => {
      return { ok: true, result: "pong" };
    });
  } else if (typeof server.addTool === "function") {
    server.addTool("ping", async (params: any) => {
      return { ok: true, result: "pong" };
    });
  } else {
    // Fallback: expose a no-op to avoid crashing if API differs
    console.warn("MCP server has no registerTool/addTool method; no ping tool registered.");
  }

  // Attempt to start the server if a start() API exists
  if (typeof server.start === "function") {
    await server.start();
  } else {
    // If start is not explicit, assume construction with transport is enough
    console.log("MCP Server initialized with transport; no explicit start() method.");
  }

  // Keep process alive
  process.stdin.resume();
}

main().catch((err) => {
  console.error("MCP server failed", err);
  process.exit(1);
});
