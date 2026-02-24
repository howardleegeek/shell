// Test setup for MCPServer E2E pipeline
// - Start MCP Server in stdio mode (best-effort)
// - Verify Forge and Anvil availability
// - Create a temporary test directory
import { spawnSync, spawn } from "child_process";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import path from "path";

export type SetupResult = {
  projectDir: string;
  serverProc?: any;
  forgeOk: boolean;
  anvilOk: boolean;
  cleanup: () => void;
};

function checkTool(cmd: string, args: string[]) {
  try {
    const res = spawnSync(cmd, args, { encoding: "utf8", shell: true });
    return res.status === 0;
  } catch {
    return false;
  }
}

function startMcpServer() {
  // Try multiple common entrypoints for the MCP server in this repo
  const candidates: Array<{ cmd: string; args: string[]; cwd?: string }> = [
    { cmd: "bash", args: ["-lc", "npm run start-mcp --silent"], cwd: process.cwd() },
    { cmd: "node", args: ["mcp-server/index.js"], cwd: process.cwd() },
  ];
  for (const c of candidates) {
    try {
      const p = spawn(c.cmd, c.args, {
        cwd: c.cwd,
        stdio: ["ignore", "ignore", "ignore"],
        detached: true,
      });
      // Detach to avoid blocking the test process
      p.unref();
      return p;
    } catch {
      // try next candidate
    }
  }
  return undefined;
}

export async function setupTestEnvironment(): Promise<SetupResult> {
  // Create a temporary test directory for artifacts
  const tmpRoot = mkdtempSync(path.join(tmpdir(), "mcp-e2e-"));
  const projectDir = path.join(tmpRoot, "test-project");

  // Check external tools availability (Forge + Anvil)
  const forgeOk = checkTool("forge", ["--version"]);
  const anvilOk = checkTool("anvil", ["--version"]);

  // Start MCP server if possible
  const serverProc = startMcpServer();

  // Return result with a small cleanup function
  const cleanup = () => {
    try {
      if (serverProc && serverProc.kill) serverProc.kill();
    } catch {
      // ignore
    }
  };

  return {
    projectDir,
    serverProc,
    forgeOk,
    anvilOk,
    cleanup,
  };
}
