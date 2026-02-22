export interface ForgeTestResult {
  test_name: string;
  status: "success" | "failure";
  gas_used: number;
  logs: string[];
}

export interface BuildResult {
  success: boolean;
  abi?: unknown[];
  bytecode?: string;
  errors?: string[];
}

export interface DeployResult {
  address: string;
  tx_hash: string;
  chain: string;
}

export interface ReportData {
  timestamp: string;
  results: ForgeTestResult[];
  summary: string;
}
