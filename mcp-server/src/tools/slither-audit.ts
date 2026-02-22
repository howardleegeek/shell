import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  buildAuditResult,
  parseDetectors,
  type SecurityAuditResult,
  type SeverityFilter,
} from "./slither-audit-core.js";

const TOOL_NAME = "security_audit";
const DEFAULT_TIMEOUT_MS = 120_000;

const inputSchema = {
  project_dir: z.string().min(1),
  severity_filter: z.enum(["high", "medium", "low", "all"]).optional(),
};

async function executeSlither(projectDir: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("slither", [projectDir, "--json", "-"], {
      cwd: projectDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Slither timed out after ${timeoutMs / 1000} seconds.`));
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0 && !stdout.trim()) {
        reject(
          new Error(
            `Slither exited with code ${code ?? "unknown"}: ${stderr.trim() || "no stderr"}`,
          ),
        );
        return;
      }
      resolve(stdout);
    });
  });
}

export async function runSecurityAudit(input: {
  project_dir: string;
  severity_filter?: SeverityFilter;
}): Promise<SecurityAuditResult> {
  const start = Date.now();
  const severityFilter = input.severity_filter ?? "all";
  const projectDir = path.resolve(input.project_dir);
  if (!existsSync(projectDir)) {
    throw new Error(`project_dir does not exist: ${projectDir}`);
  }

  const raw = await executeSlither(projectDir, DEFAULT_TIMEOUT_MS);
  const detectors = parseDetectors(raw);
  const elapsed = (Date.now() - start) / 1000;
  return buildAuditResult(detectors, severityFilter, Number(elapsed.toFixed(3)));
}

export function registerSecurityAuditTool(server: McpServer): void {
  server.tool(
    TOOL_NAME,
    "Run Slither static analysis on Solidity contracts to detect vulnerabilities.",
    inputSchema,
    async ({ project_dir, severity_filter }) => {
      const result = await runSecurityAudit({ project_dir, severity_filter });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );
}
