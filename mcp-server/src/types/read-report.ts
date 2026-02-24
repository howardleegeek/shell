export interface ReadReportInput {
  project_dir: string;
  report_path?: string;
  format?: 'forge' | 'hardhat' | 'anchor';
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface SourceLocation {
  file: string;
  line: number;
}

export interface FailureAnalysis {
  test_name: string;
  contract: string;
  error_type: 'assertion' | 'revert' | 'overflow' | 'gas' | 'other';
  error_message: string;
  source_location: SourceLocation;
  suggested_fix_category: 'logic' | 'access_control' | 'arithmetic' | 'state';
}

export interface GasReport {
  contract: string;
  function: string;
  avg_gas: number;
  median_gas: number;
}

export interface ReadReportSuccess {
  summary: TestSummary;
  failures: FailureAnalysis[];
  gas_report?: GasReport[];
  timestamp: string;
}

export interface ReadReportError {
  error: 'no_report_found';
  hint: 'Run forge_test first to generate a report';
}

export type ReadReportResult = ReadReportSuccess | ReadReportError;
