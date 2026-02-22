import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import express from "express";
import { analyzeRepair } from "./tools/auto-repair.js";

const server = new McpServer({
  name: "shell-mcp-server",
  version: "1.0.0",
});

// Register health check ping tool
server.tool("ping", "Health check for the MCP server", async () => {
  return {
    content: [{ type: "text", text: "pong" }],
  };
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

async function main() {
  const args = process.argv.slice(2);
  const isSSE =
    args.includes("--transport") &&
    args[args.indexOf("--transport") + 1] === "sse";
  const portIndex = args.indexOf("--port");
  const port = portIndex !== -1 ? parseInt(args[portIndex + 1]) : 3001;

  if (isSSE) {
    const app = express();

    // 1. 安全修复：允许前端混合端点通信 (CORS) 并拦截恶意溯源
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*"); // 这里如果在生产环境需要换成前端明确域名
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      if (req.method === "OPTIONS") {
        return res.sendStatus(200);
      }
      next();
    });

    // 2. 状态机修复：Session 隔离，防止多客户端互相覆盖数据通信
    const transports = new Map<string, SSEServerTransport>();

    app.get("/sse", async (req, res) => {
      // 3. 网络层修复：防止连接由于太久没有链上动作被悄悄掐断 (Idle Timeout)
      req.socket.setTimeout(0);
      res.socket?.setTimeout(0);

      // 为每个链接端分配单例 Token
      const sessionId = Math.random().toString(36).substring(2, 15);

      // 生成独占的 POST 地址告诉它往这发
      const transport = new SSEServerTransport(
        `/messages?sessionId=${sessionId}`,
        res,
      );
      transports.set(sessionId, transport);

      // 4. 内存泄漏修复：当刷新网页、断网、关闭时，释放该连接内存池
      req.on("close", () => {
        transports.delete(sessionId);
      });

      await server.connect(transport);
    });

    app.post("/messages", async (req, res) => {
      const sessionId = req.query.sessionId as string;
      const transport = transports.get(sessionId);

      if (transport) {
        // 交由 transport 原生处理 body 流，避开 body-parser 全局污染限制
        await transport.handlePostMessage(req, res);
      } else {
        res.status(400).send("Session Expired or Connection Not Established");
      }
    });

    // 5. 权限逃逸修复：强制将端口监听封死在 `127.0.0.1` 杜绝 0.0.0.0 局域网 RCE 入侵
    app.listen(port, "127.0.0.1", () => {
      console.log(`MCP Server running on SSE at http://127.0.0.1:${port}/sse`);
    });
  } else {
    // Default to StdIO transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

// 6. 后台暴毙修复：捕获顶级异常防止整个 Node 进程在 Agent 并发执行时直接坠毁
process.on("uncaughtException", (err) => {
  console.error("CRITICAL: Uncaught Exception caught at outer scope:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("CRITICAL: Unhandled Promise Rejection:", reason);
});

main().catch((error) => {
  console.error("Shell MCP Server Error:", error);
  process.exit(1);
});
