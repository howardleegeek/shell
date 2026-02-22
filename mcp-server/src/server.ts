import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { createSessionId, parseCliOptions, type CliOptions } from "./types.js";

const server = new McpServer({
  name: "shell-mcp-server",
  version: "1.0.0",
});
const taskId = process.env.TASK_ID ?? "S01-priority-1-action-com";

server.tool("ping", "Health check for the MCP server", async () => {
  return {
    content: [{ type: "text", text: "pong" }],
  };
});

function installCors(app: ReturnType<typeof express>) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}

async function startSSEServer(options: CliOptions) {
  const app = express();
  const transports = new Map<string, SSEServerTransport>();

  installCors(app);

  app.get("/sse", async (req, res) => {
    req.socket.setTimeout(0);
    res.socket?.setTimeout(0);

    const sessionId = createSessionId();
    const transport = new SSEServerTransport(`/messages?sessionId=${sessionId}`, res);
    transports.set(sessionId, transport);

    req.on("close", () => {
      transports.delete(sessionId);
    });

    await server.connect(transport);
  });

  app.post("/messages", async (req, res) => {
    const sessionId = String(req.query.sessionId ?? "");
    const transport = transports.get(sessionId);
    if (!transport) {
      res.status(400).send("Session expired or connection not established");
      return;
    }

    await transport.handlePostMessage(req, res);
  });

  app.listen(options.port, options.host, () => {
    console.log(
      `[${taskId}] MCP server running on SSE at http://${options.host}:${options.port}/sse`,
    );
  });
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  if (options.transport === "sse") {
    await startSSEServer(options);
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

process.on("uncaughtException", (err) => {
  console.error(`[${taskId}] CRITICAL uncaught exception:`, err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error(`[${taskId}] CRITICAL unhandled rejection:`, reason, promise);
});

main().catch((error) => {
  console.error(`[${taskId}] Shell MCP Server Error:`, error);
  process.exit(1);
});
