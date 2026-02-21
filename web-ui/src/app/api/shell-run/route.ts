import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const SHELL_RUN_PATH = "/Users/howardli/.local/bin/shell-run";
const PROJECTS_BASE = "/Users/howardli/Downloads/oyster/shell/demo";

function runShellRun(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn(SHELL_RUN_PATH, args, { cwd, shell: true });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (data) => (stdout += data.toString()));
    proc.stderr.on("data", (data) => (stderr += data.toString()));
    proc.on("close", (code) => resolve({ stdout, stderr, code: code || 0 }));
  });
}

function getReports(projectPath: string) {
  const reportsDir = join(projectPath, "reports");
  if (!existsSync(reportsDir)) return [];
  
  const files = readdirSync(reportsDir).filter((f) => f.endsWith(".json"));
  return files.map((file) => {
    const content = JSON.parse(readFileSync(join(reportsDir, file), "utf-8"));
    const type = file.includes("test") ? "test" : file.includes("deploy") ? "deploy" : "audit";
    const chain = file.includes("evm") ? "EVM" : file.includes("solana") ? "Solana" : "Unknown";
    return {
      name: file,
      type,
      chain,
      status: content.ok ? "success" : "failed",
      date: new Date(content.finishedAt || content.startedAt || Date.now()).toLocaleString(),
      content,
    };
  });
}

// GET /api/reports - List reports
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const project = searchParams.get("project") || "evm-vault";
  const projectPath = join(PROJECTS_BASE, project);
  
  const reports = getReports(projectPath);
  return NextResponse.json({ reports });
}

// POST /api/test - Run test
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  
  const body = await request.json();
  const project = body.project || "evm-vault";
  const projectPath = join(PROJECTS_BASE, project);
  const chain = body.chain || "evm";
  
  let result;
  
  switch (action) {
    case "test": {
      result = await runShellRun(["test", "--chain", chain], projectPath);
      break;
    }
    case "deploy": {
      const network = body.network || "anvil";
      result = await runShellRun(["deploy", "--network", network, "--chain", chain], projectPath);
      break;
    }
    case "repair": {
      // For now, just run test - repair needs OpenCrabs integration
      result = await runShellRun(["test", "--chain", chain], projectPath);
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  
  const reports = getReports(projectPath);
  return NextResponse.json({
    success: result.code === 0,
    stdout: result.stdout,
    stderr: result.stderr,
    reports,
  });
}
