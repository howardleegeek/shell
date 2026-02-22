// Forge Build Tool
// Compile Solidity contracts using Foundry (forge) and return ABI + bytecode
// Exposed as: forge_build

import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

type ForgeBuildInputBase = {
  project_dir: string; // path to Foundry project
  contract_name?: string; // optional: filter to a specific contract name
  optimize?: boolean; // optional: enable optimizer (default: true)
  optimize_runs?: number; // optional: optimizer runs (default: 200)
};

export type ForgeBuildInput = ForgeBuildInputBase;

type FoundryContractInfo = {
  abi?: any;
  bin?: string;
  deployedBin?: string;
  // Some outputs may use other keys; keep flexible
  [k: string]: any;
};

type ForgeBuildSuccessContract = {
  name: string;
  abi: any;
  bytecode: string; // hex string (0x...)
  deployedBytecode?: string;
};

export type ForgeBuildSuccess = {
  success: true;
  contracts: ForgeBuildSuccessContract[];
};

type ForgeBuildError = {
  file?: string;
  line?: number;
  message: string;
  severity?: string;
};

export type ForgeBuildFailure = {
  success: false;
  errors: ForgeBuildError[];
};

type ForgeBuildResult = ForgeBuildSuccess | ForgeBuildFailure;

const exec = promisify(execFile);

function ensureHexPrefix(v: string): string {
  if (!v) return v;
  return v.startsWith("0x") ? v : `0x${v}`;
}

export async function forge_build(input: ForgeBuildInput): Promise<ForgeBuildResult> {
  // Fast-path: allow injecting a fake forge output for tests/environments without forge installed
  const fakeOutput = process.env.FORGE_BUILD_FAKE_JSON;
  if (fakeOutput) {
    try {
      const json = JSON.parse(fakeOutput);
      const contracts: ForgeBuildSuccessContract[] = [];
      if (json?.contracts && typeof json.contracts === "object") {
        for (const [name, data] of Object.entries(json.contracts)) {
          const abi = (data as FoundryContractInfo).abi ?? [];
          const bin = (data as FoundryContractInfo).bin ?? "";
          const deployedBin = (data as FoundryContractInfo).deployedBin ?? (data as FoundryContractInfo).deployedBin ?? "";
          contracts.push({
            name,
            abi,
            bytecode: ensureHexPrefix(bin),
            deployedBytecode: ensureHexPrefix(deployedBin),
          });
        }
      }
      // Optional filtering by contract_name
      const filtered = input.contract_name
        ? contracts.filter((c) => c.name === input.contract_name)
        : contracts;
      return { success: true, contracts: filtered };
    } catch (e: any) {
      return { success: false, errors: [{ file: "FORGE_BUILD_FAKE_JSON", line: 0, message: String(e?.message ?? e) }] };
    }
  }

  // Real execution path: run `forge build --json` in the provided project directory
  // Note: We keep this minimal and robust; errors are surfaced with file/line when available
  try {
    const projectDir = input.project_dir;
    // Create a sensible working directory
    const workdir = path.resolve(projectDir);

    // Optional: Emit a minimal Foundry config for optimizer if requested
    // We avoid mutating the user's repo too aggressively; only write a temp file inside workdir if needed.
    // For safety, we skip config modifications here and rely on existing foundry.toml.

    const { stdout } = await exec("forge", ["build", "--json"], {
      cwd: workdir,
      windowsHide: true,
    } as any);

    // forge outputs JSON about contracts
    // Depending on forge version, stdout may contain extra text; try to locate JSON object
    let jsonOut: any;
    try {
      jsonOut = JSON.parse(stdout);
    } catch {
      // Attempt to extract JSON fragment from stdout
      const firstBrace = stdout.indexOf("{\n");
      const jsonFragment = firstBrace >= 0 ? stdout.slice(firstBrace) : stdout;
      jsonOut = JSON.parse(jsonFragment);
    }

    const contracts: ForgeBuildSuccessContract[] = [];
    const rootContracts = jsonOut?.contracts ?? jsonOut?.packages ?? jsonOut?.sources ?? {};
    for (const [name, data] of Object.entries(rootContracts as any)) {
      // Each contract entry may be shaped differently depending on forge version
      const abi = (data as FoundryContractInfo).abi ?? [];
      const bin = (data as FoundryContractInfo).bin ?? (data as FoundryContractInfo).bytecode ?? "";
      const deployedBin = (data as FoundryContractInfo).deployedBin ?? (data as FoundryContractInfo).deployedBytecode ?? "";

      // Normalize to hex strings
      contracts.push({
        name,
        abi,
        bytecode: ensureHexPrefix(bin as string),
        deployedBytecode: ensureHexPrefix(deployedBin as string),
      });
    }

    const filtered = input.contract_name
      ? contracts.filter((c) => c.name === input.contract_name)
      : contracts;
    return { success: true, contracts: filtered };
  } catch (e: any) {
    const err = {
      file: (e?.fileName as string) ?? (e?.file as string) ?? "forge-build.ts",
      line: (e?.lineNumber as number) ?? 0,
      message: String(e?.message ?? e ?? "Unknown error"),
      severity: "error",
    } as ForgeBuildError;
    return { success: false, errors: [err] };
  }
}

// Simple wrapper for the internal API so other modules can import
export default forge_build;

// Lightweight self-test hook (no dependencies)
if (process.env.FORGE_BUILD_SELF_TEST === "1") {
  (async () => {
    // A tiny in-process fake test using the fake json path
    process.env.FORGE_BUILD_FAKE_JSON = JSON.stringify({
      contracts: {
        MyContract: {
          abi: [{ type: "function", name: "foo", inputs: [] }],
          bin: "0x6000600055",
          deployedBin: "0x60006000a1",
        },
      },
    });
    const res = await forge_build({ project_dir: "." });
    console.log("SELF-TEST FORGE_BUILD:", JSON.stringify(res, null, 2));
  })();
}
