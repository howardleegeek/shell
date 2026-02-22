import { promises as fs } from "node:fs";
import path from "node:path";

const IGNORE_DIRS = new Set([".git", "node_modules", "dist"]);
const MAX_FILE_SIZE_BYTES = 512 * 1024;

export type DiscoveryRule = {
  id: string;
  risk: string;
  why: string;
  pathHints: string[];
  patterns: string[];
};

export type RuleFinding = {
  ruleId: string;
  file: string;
  matchedPatterns: string[];
  missingPatterns: string[];
};

export type DiscoveryReport = {
  rootPath: string;
  scannedFileCount: number;
  rules: DiscoveryRule[];
  findings: RuleFinding[];
};

export const AUTONOMOUS_DISCOVERY_RULES: DiscoveryRule[] = [
  {
    id: "temporal-edge-cases",
    risk: "Temporal migration may have lost edge-case handling.",
    why: "Locate workflow/worker logic and verify retries, idempotency, and timeout guards still exist.",
    pathHints: ["worker", "workflow", "temporal", "activity", "task"],
    patterns: [
      "retry",
      "idempot",
      "timeout",
      "catch",
      "compensat|rollback",
    ],
  },
  {
    id: "metrics-pipeline",
    risk: "Metrics collection might silently fail.",
    why: "Check DB connection, insert/update calls, and swallowed error handlers around metrics code paths.",
    pathHints: ["metric", "telemetry", "observability", "report", "db", "database"],
    patterns: [
      "metric|telemetry|counter|histogram",
      "insert|upsert|create table|migration",
      "connect|pool|client",
      "catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}",
    ],
  },
  {
    id: "queue-namespace-routing",
    risk: "Worker may run but not receive tasks due to queue/namespace mismatch.",
    why: "Compare queue and namespace values across dispatcher, worker, and runtime config files.",
    pathHints: ["worker", "queue", "namespace", "dispatch", "scheduler", "config"],
    patterns: [
      "taskQueue|queue|queueName",
      "namespace",
      "process\\.env|ENV|config",
    ],
  },
];

async function listFiles(rootPath: string, maxFiles: number): Promise<string[]> {
  const files: string[] = [];
  const queue: string[] = [rootPath];

  while (queue.length > 0 && files.length < maxFiles) {
    const current = queue.shift();
    if (!current) continue;
    const entries = await fs.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name)) {
          queue.push(path.join(current, entry.name));
        }
        continue;
      }

      if (entry.isFile()) {
        files.push(path.join(current, entry.name));
        if (files.length >= maxFiles) break;
      }
    }
  }

  return files;
}

function isRelevant(filePath: string, hints: string[]): boolean {
  const haystack = filePath.toLowerCase();
  return hints.some((hint) => haystack.includes(hint.toLowerCase()));
}

async function readFileSafe(filePath: string): Promise<string | null> {
  const stats = await fs.stat(filePath);
  if (stats.size > MAX_FILE_SIZE_BYTES) return null;
  return fs.readFile(filePath, "utf8");
}

function findPatterns(content: string, patterns: string[]): string[] {
  return patterns.filter((pattern) => new RegExp(pattern, "i").test(content));
}

function normalizePath(basePath: string, filePath: string): string {
  const relative = path.relative(basePath, filePath);
  return relative.split(path.sep).join("/");
}

export async function runAutonomousDiscovery(
  rootPath: string,
  maxFiles = 500,
): Promise<DiscoveryReport> {
  const allFiles = await listFiles(rootPath, maxFiles);
  const findings: RuleFinding[] = [];

  for (const rule of AUTONOMOUS_DISCOVERY_RULES) {
    const candidates = allFiles.filter((file) => isRelevant(file, rule.pathHints));

    for (const candidate of candidates) {
      const content = await readFileSafe(candidate);
      if (!content) continue;

      const matchedPatterns = findPatterns(content, rule.patterns);
      if (matchedPatterns.length === 0) continue;

      const missingPatterns = rule.patterns.filter(
        (pattern) => !matchedPatterns.includes(pattern),
      );
      findings.push({
        ruleId: rule.id,
        file: normalizePath(rootPath, candidate),
        matchedPatterns,
        missingPatterns,
      });
    }
  }

  return {
    rootPath,
    scannedFileCount: allFiles.length,
    rules: AUTONOMOUS_DISCOVERY_RULES,
    findings,
  };
}
