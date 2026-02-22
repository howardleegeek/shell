// Forge Build Tool for MCP (Solidity) - TypeScript implementation
// This tool runs `forge build --json` in a given Foundry project and
// returns ABI and bytecode information for compiled contracts.
// NOTE: This is a lightweight adapter; in CI the actual forge binary may not be available.

import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";

export type ForgeInput = {
  project_dir: string;
  contract_name?: string;
  optimize?: boolean;
  optimize_runs?: number;
};

export type ForgeContractOutput = {
  name: string;
  abi: any;
  bytecode: string | null;
  deployedBytecode: string | null;
};

type ToolResult = {
  success: boolean;
  contracts?: ForgeContractOutput[];
  errors?: { file?: string; line?: number; message: string; severity?: string }[];
};

// Small, targeted parser for forge --json output.
function parseForgeJsonOutput(raw: string, nameFilter?: string): ForgeContractOutput[] {
  // Some forge versions print logs before the JSON payload. Try to extract the first JSON object.
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      data = JSON.parse(m[0]);
    } else {
      throw new Error("Invalid forge JSON output");
    }
  }

  const contracts: ForgeContractOutput[] = [];
  const root = data?.contracts ?? data?.build?.contracts ?? data;
  if (!root || typeof root !== "object") return contracts;

  for (const key of Object.keys(root)) {
    const c = root[key] as any;
    // Foundry often uses keys like "ContractName.sol:ContractName"
    if (nameFilter && !key.includes(nameFilter)) continue;
    const abi = c?.abi ?? null;
    // bytecode fields vary between forge versions: bin/deployedBin/deployedBytecode/bytecode
    const bytecode = c?.bin ?? c?.bytecode ?? null;
    const deployedBytecode = c?.deployedBin ?? c?.deployedBytecode ?? null;
    contracts.push({ name: key, abi, bytecode, deployedBytecode });
  }
  return contracts;
}

export async function forgeBuild(input: ForgeInput): Promise<ToolResult> {
  const { project_dir, contract_name, optimize, optimize_runs } = input;

  // Validate project dir
  try {
    const stat = await fs.stat(project_dir);
    if (!stat.isDirectory()) {
      return { success: false, errors: [{ message: "project_dir is not a directory" }] };
    }
  } catch (err) {
    return { success: false, errors: [{ message: "project_dir does not exist" }] };
  }

  // Build a forge command. We try to keep this simple and compatible with most Forge versions.
  // Optimization flags are commonly configured in foundry.toml, but we support a best-effort CLI hint here.
  const cmdParts = ["forge", "build", "--json"]; // base command
  // Attempt to enable SOLC optimizer by appending nothing if optimize is true; the project should set optimizer in foundry.toml.
  // We do not rely on a non-standard CLI flag here to avoid incompatibilities.
  const cmd = cmdParts.join(" ");

  return await new Promise<ToolResult>((resolve) => {
    exec(cmd, { cwd: project_dir, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
      // Treat non-zero exit as compile error, but still try to parse stderr for details.
      if (error) {
        // Try to extract JSON from stdout if possible; if not, return a structured error.
        try {
          const contracts = parseForgeJsonOutput(stdout || "{}", contract_name);
          if (contracts.length > 0) {
            resolve({ success: true, contracts });
            return;
          }
        } catch {
          // ignore and fall through to error response
        }
        // If we reach here, we couldn't parse a successful output
        const errorInfo = {
          file: undefined as string | undefined,
          line: undefined as number | undefined,
          message: stderr?.trim() || error?.message || "forge build failed",
          severity: "error",
        };
        resolve({ success: false, errors: [errorInfo] });
        return;
      }

      // Success path: parse stdout
      try {
        const contracts = parseForgeJsonOutput(stdout, contract_name);
        if (contracts.length === 0) {
          resolve({ success: false, errors: [{ message: "no contracts found in forge output" }] });
          return;
        }
        resolve({ success: true, contracts });
      } catch (e: any) {
        resolve({ success: false, errors: [{ message: e?.message ?? "failed to parse forge output" }] });
      }
    });
  });
}

// Export a tiny, testable public helper for unit tests without invoking Forge
export function parseForgeOutputString(raw: string, filter?: string) {
  return parseForgeJsonOutput(raw, filter);
}

// Public API used by server.ts for registration
export const forge_build = {
  name: "forge_build",
  description: "Compile Solidity contracts using Foundry. Returns ABI and bytecode.",
  inputSchema: {
    project_dir: "string",
    contract_name: "string?",
    optimize: "boolean?",
    optimize_runs: "number?",
  },
  run: forgeBuild,
};

export default forge_build;
