/**
 * Shell Web3 Tools Plugin for OpenCode
 * 
 * Provides Web3-specific tools:
 * - solana_anchor_test: Run Solana Anchor tests
 * - evm_forge_test: Run Foundry (forge) tests
 * - evm_hardhat_test: Run Hardhat tests
 * - evm_deploy: Deploy EVM contracts
 * - solana_deploy: Deploy Solana programs
 * - web3_audit: Run security scans
 * 
 * Based on OpenCode plugin API: https://opencode.ai/docs/plugins/
 */

import { type Plugin, tool } from "@opencode-ai/plugin";
import fs from "node:fs";
import path from "node:path";


type TestReport = {
  ok: boolean;
  chain: "solana" | "evm";
  runner: "anchor" | "forge" | "hardhat";
  startedAt: string;
  finishedAt: string;
  cwd: string;
  command: string;
  exitCode: number;
  summary: string;
  rawLogPath: string;
  details?: {
    passed?: number;
    failed?: number;
    errors?: string[];
  };
};


function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}


function writeJson(p: string, obj: unknown) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf-8");
}


function nowIso() {
  return new Date().toISOString();
}


export const Web3ToolsPlugin: Plugin = async ({ $, directory }) => {
  const reportsDir = path.join(directory, "reports");
  ensureDir(reportsDir);


  async function runCmdAndReport(params: {
    chain: "solana" | "evm";
    runner: "anchor" | "forge" | "hardhat";
    cwdRel?: string;
    cmd: string;
    args?: string[];
    reportName: string;
  }): Promise<TestReport> {
    const startedAt = nowIso();
    const cwd = params.cwdRel ? path.join(directory, params.cwdRel) : directory;
    ensureDir(reportsDir);

    const rawLogPath = path.join(reportsDir, `${params.reportName}.log`);
    const command = [params.cmd, ...(params.args ?? [])].join(" ");

    let exitCode = 0;
    let stdout = "";
    let stderr = "";

    try {
      const out = await $({ cwd, reject: false })`${command}`;
      // @ts-ignore - OpenCode plugin runtime types
      exitCode = typeof out?.exitCode === "number" ? out.exitCode : 0;
      // @ts-ignore
      stdout = typeof out?.stdout === "string" ? out.stdout : String(out ?? "");
      // @ts-ignore
      stderr = typeof out?.stderr === "string" ? out.stderr : "";
    } catch (e: any) {
      exitCode = 1;
      stderr = (e && (e.stack || e.message)) ? String(e.stack || e.message) : String(e);
    }

    const finishedAt = nowIso();
    const raw = [stdout, stderr].filter(Boolean).join("\n\n---\n\n");
    fs.writeFileSync(rawLogPath, raw, "utf-8");

    // Parse test results
    let ok = exitCode === 0;
    const lower = raw.toLowerCase();
    const details: TestReport["details"] = { errors: [] };

    if (params.runner === "anchor") {
      ok = ok && !lower.includes("failed") && (lower.includes("pass") || lower.includes("passed"));
      // Extract test counts
      const passMatch = raw.match(/(\d+) passing/);
      const failMatch = raw.match(/(\d+) failing/);
      if (passMatch) details.passed = parseInt(passMatch[1]);
      if (failMatch) details.failed = parseInt(failMatch[1]);
    } else if (params.runner === "forge") {
      ok = ok && (lower.includes("test result: ok") || lower.includes("passed"));
      const passMatch = raw.match(/(\d+) tests/);
      const failMatch = raw.match(/(\d+) failures?/);
      if (passMatch) details.passed = parseInt(passMatch[1]);
      if (failMatch) details.failed = parseInt(failMatch[1]);
    } else if (params.runner === "hardhat") {
      ok = ok && !lower.includes("error");
    }

    const summary = ok
      ? `✅ ${params.chain}/${params.runner} tests passed`
      : `❌ ${params.chain}/${params.runner} tests failed (exitCode=${exitCode})`;

    const report: TestReport = {
      ok,
      chain: params.chain,
      runner: params.runner,
      startedAt,
      finishedAt,
      cwd,
      command,
      exitCode,
      summary,
      rawLogPath,
      details,
    };

    const jsonPath = path.join(reportsDir, `${params.reportName}.json`);
    writeJson(jsonPath, report);
    return report;
  }


  return {
    tool: {
      // =====================
      // Solana Tools
      // =====================
      solana_anchor_test: tool({
        description: "Run Solana Anchor tests and write a structured report to reports/.",
        args: {
          cwdRel: tool.schema.optional(tool.schema.string()),
        },
        async execute(args) {
          const r = await runCmdAndReport({
            chain: "solana",
            runner: "anchor",
            cwdRel: args.cwdRel,
            cmd: "anchor",
            args: ["test"],
            reportName: "test.solana.anchor",
          });
          return r.summary + `\nReport: ${path.relative(directory, r.rawLogPath)}`;
        },
      }),

      solana_deploy: tool({
        description: "Deploy Solana program to devnet and save address to reports/",
        args: {
          programName: tool.schema.string(),
          cwdRel: tool.schema.optional(tool.schema.string()),
        },
        async execute(args) {
          const startedAt = nowIso();
          const cwd = args.cwdRel ? path.join(directory, args.cwdRel) : directory;
          
          const out = await $({ cwd, reject: false })`anchor deploy --provider.cluster devnet`;
          
          // Extract program ID from output
          const output = String(out);
          const programIdMatch = output.match(/ProgramId:\s*([\w]{32,44})/);
          const programId = programIdMatch ? programIdMatch[1] : "unknown";
          
          const report = {
            ok: out?.exitCode === 0,
            chain: "solana",
            action: "deploy",
            programName: args.programName,
            cluster: "devnet",
            programId,
            output: output.slice(0, 1000),
            startedAt,
            finishedAt: nowIso(),
          };
          
          const reportPath = path.join(reportsDir, `deploy.${args.programName}.solana.json`);
          writeJson(reportPath, report);
          
          return report.ok 
            ? `✅ Deployed ${args.programName} to devnet: ${programId}`
            : `❌ Deploy failed`;
        },
      }),

      // =====================
      // EVM Tools - Foundry
      // =====================
      evm_forge_test: tool({
        description: "Run Foundry (forge) tests and write a structured report to reports/.",
        args: {
          cwdRel: tool.schema.optional(tool.schema.string()),
          extra: tool.schema.optional(tool.schema.array(tool.schema.string())),
        },
        async execute(args) {
          const r = await runCmdAndReport({
            chain: "evm",
            runner: "forge",
            cwdRel: args.cwdRel,
            cmd: "forge",
            args: ["test", ...(args.extra ?? [])],
            reportName: "test.evm.forge",
          });
          return r.summary + `\nReport: ${path.relative(directory, r.rawLogPath)}`;
        },
      }),

      evm_forge_build: tool({
        description: "Build EVM contracts with Foundry (forge build)",
        args: {
          cwdRel: tool.schema.optional(tool.schema.string()),
        },
        async execute(args) {
          const r = await runCmdAndReport({
            chain: "evm",
            runner: "forge",
            cwdRel: args.cwdRel,
            cmd: "forge",
            args: ["build"],
            reportName: "build.evm.forge",
          });
          return r.summary + `\nReport: ${path.relative(directory, r.rawLogPath)}`;
        },
      }),

      evm_forge_deploy: tool({
        description: "Deploy EVM contract with Foundry",
        args: {
          contract: tool.schema.string(),
          constructorArgs: tool.schema.optional(tool.schema.string()),
          network: tool.schema.string(),
          cwdRel: tool.schema.optional(tool.schema.string()),
        },
        async execute(args) {
          const cwd = args.cwdRel ? path.join(directory, args.cwdRel) : directory;
          
          const cmd = `forge create ${args.contract} --network ${args.network}`;
          const out = await $({ cwd, reject: false })`${cmd}`;
          
          const output = String(out);
          const addrMatch = output.match(/Deployed to:\s*(0x[\w]{40})/);
          const txMatch = output.match(/Transaction hash:\s*(0x[\w]{64})/);
          
          const report = {
            ok: out?.exitCode === 0,
            chain: "evm",
            action: "deploy",
            contract: args.contract,
            network: args.network,
            deployedTo: addrMatch ? addrMatch[1] : "unknown",
            txHash: txMatch ? txMatch[1] : "unknown",
            output: output.slice(0, 1000),
          };
          
          const reportPath = path.join(reportsDir, `deploy.${args.contract}.evm.json`);
          writeJson(reportPath, report);
          
          return report.ok
            ? `✅ Deployed ${args.contract} to ${args.network}: ${report.deployedTo}`
            : `❌ Deploy failed`;
        },
      }),

      // =====================
      // EVM Tools - Hardhat
      // =====================
      evm_hardhat_test: tool({
        description: "Run Hardhat tests and write a structured report to reports/.",
        args: {
          cwdRel: tool.schema.optional(tool.schema.string()),
          network: tool.schema.optional(tool.schema.string()),
        },
        async execute(args) {
          const hhArgs = ["test"];
          if (args.network) hhArgs.push("--network", args.network);

          const r = await runCmdAndReport({
            chain: "evm",
            runner: "hardhat",
            cwdRel: args.cwdRel,
            cmd: "npx",
            args: ["hardhat", ...hhArgs],
            reportName: "test.evm.hardhat",
          });
          return r.summary + `\nReport: ${path.relative(directory, r.rawLogPath)}`;
        },
      }),

      evm_hardhat_build: tool({
        description: "Build EVM contracts with Hardhat",
        args: {
          cwdRel: tool.schema.optional(tool.schema.string()),
        },
        async execute(args) {
          const r = await runCmdAndReport({
            chain: "evm",
            runner: "hardhat",
            cwdRel: args.cwdRel,
            cmd: "npx",
            args: ["hardhat", "compile"],
            reportName: "build.evm.hardhat",
          });
          return r.summary + `\nReport: ${path.relative(directory, r.rawLogPath)}`;
        },
      }),

      // =====================
      // Security Tools
      // =====================
      web3_audit: tool({
        description: "Run security audit on smart contracts (Slither)",
        args: {
          cwdRel: tool.schema.optional(tool.schema.string()),
          contractPath: tool.schema.optional(tool.schema.string()),
        },
        async execute(args) {
          const cwd = args.cwdRel ? path.join(directory, args.cwdRel) : directory;
          const target = args.contractPath || ".";
          
          const startedAt = nowIso();
          const out = await $({ cwd, reject: false })`slither ${target} --json ${path.join(reportsDir, "audit.slither.json")}`;
          
          const raw = String(out);
          const rawPath = path.join(reportsDir, "audit.slither.log");
          fs.writeFileSync(rawPath, raw, "utf-8");
          
          // Parse Slither output for issues
          const issues: string[] = [];
          const lines = raw.split("\n");
          let currentIssue = "";
          
          for (const line of lines) {
            if (line.includes("INFO:") || line.includes("WARNING:") || line.includes("HIGH:")) {
              if (currentIssue) issues.push(currentIssue);
              currentIssue = line.trim();
            } else if (currentIssue) {
              currentIssue += " " + line.trim();
            }
          }
          if (currentIssue) issues.push(currentIssue);
          
          const report = {
            ok: out?.exitCode === 0,
            tool: "slither",
            target,
            issueCount: issues.length,
            issues: issues.slice(0, 20), // Top 20
            startedAt,
            finishedAt: nowIso(),
          };
          
          const reportPath = path.join(reportsDir, "audit.summary.json");
          writeJson(reportPath, report);
          
          return `🔍 Audit complete: ${issues.length} issues found\nReport: ${path.relative(directory, reportPath)}`;
        },
      }),
    },
  };
};
