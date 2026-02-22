export interface ForgeTestResult {
  test_name: string;
  status: string;
  gas_used?: number;
  logs?: string[];
}

export interface BuildResult {
  success: boolean;
  abi?: string;
  bytecode?: string;
  errors?: string[];
}

export interface DeployResult {
  address?: string;
  tx_hash?: string;
  chain?: string;
}

export interface ReportData {
  timestamp: string;
  results: Array<ForgeTestResult | BuildResult | DeployResult>;
  summary?: string;
}
