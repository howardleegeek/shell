export type Severity = "high" | "medium" | "low" | "informational";
export type SeverityFilter = "high" | "medium" | "low" | "all";

export interface SlitherSourceMapping {
  lines?: number[];
}

export interface SlitherElement {
  type?: string;
  name?: string;
  source_mapping?: SlitherSourceMapping;
}

export interface SlitherDetector {
  check?: string;
  impact?: string;
  description?: string;
  recommendation?: string;
  elements?: SlitherElement[];
}

export interface SlitherJsonOutput {
  success?: boolean;
  results?: {
    detectors?: SlitherDetector[];
  };
}

export interface SecurityAuditIssue {
  severity: Severity;
  title: string;
  description: string;
  contract: string;
  function: string;
  lines: number[];
  recommendation: string;
  reference_url: string;
}

export interface SecurityAuditResult {
  total_issues: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
  issues: SecurityAuditIssue[];
  audit_time_seconds: number;
}

const CHECK_TO_SWC: Record<string, string> = {
  reentrancy: "SWC-107",
  "reentrancy-eth": "SWC-107",
  "reentrancy-no-eth": "SWC-107",
  "unchecked-transfer": "SWC-104",
  "unchecked-lowlevel": "SWC-104",
  "tx-origin": "SWC-115",
  timestamp: "SWC-116",
  suicidal: "SWC-106",
  "uninitialized-state": "SWC-109",
};

const RECOMMENDATION_BY_CHECK: Record<string, string> = {
  reentrancy:
    "Use checks-effects-interactions and/or ReentrancyGuard for external calls.",
  "reentrancy-eth":
    "Move state updates before external calls and protect with ReentrancyGuard.",
  "reentrancy-no-eth":
    "Avoid external interactions before state updates; apply pull-over-push patterns.",
  "unchecked-lowlevel":
    "Always validate return values for low-level calls and bubble up failure.",
  "unchecked-transfer":
    "Check transfer call results and handle failure paths explicitly.",
  "tx-origin":
    "Do not use tx.origin for authorization; use msg.sender with proper access control.",
  timestamp:
    "Do not rely on block.timestamp for critical randomness or strict sequencing.",
};

export function normalizeSeverity(impact: string | undefined): Severity {
  const value = (impact ?? "").toLowerCase();
  if (value === "high") {
    return "high";
  }
  if (value === "medium") {
    return "medium";
  }
  if (value === "low") {
    return "low";
  }
  return "informational";
}

export function resolveSwcUrl(check: string): string {
  const swc = CHECK_TO_SWC[check.toLowerCase()] ?? "SWC-000";
  return `https://swcregistry.io/docs/${swc}`;
}

export function resolveRecommendation(detector: SlitherDetector): string {
  const fromSlither = detector.recommendation?.trim();
  if (fromSlither) {
    return fromSlither;
  }

  const check = detector.check?.toLowerCase() ?? "";
  return (
    RECOMMENDATION_BY_CHECK[check] ??
    "Review detector output and apply secure patterns (input validation, access control, CEI)."
  );
}

function resolveContractAndFunction(elements: SlitherElement[] | undefined): {
  contract: string;
  func: string;
} {
  if (!elements || elements.length === 0) {
    return { contract: "unknown", func: "unknown" };
  }

  let contract = "unknown";
  let func = "unknown";
  for (const element of elements) {
    const type = (element.type ?? "").toLowerCase();
    if (type.includes("contract") && element.name) {
      contract = element.name;
    }
    if (type.includes("function") && element.name) {
      func = element.name;
    }
  }

  return { contract, func };
}

function resolveLines(elements: SlitherElement[] | undefined): number[] {
  if (!elements) {
    return [];
  }

  for (const element of elements) {
    const lines = element.source_mapping?.lines;
    if (Array.isArray(lines) && lines.length > 0) {
      return lines.filter((line) => Number.isInteger(line));
    }
  }

  return [];
}

export function buildAuditResult(
  detectors: SlitherDetector[],
  severityFilter: SeverityFilter,
  auditTimeSeconds: number,
): SecurityAuditResult {
  const issues = detectors
    .map((detector): SecurityAuditIssue => {
      const severity = normalizeSeverity(detector.impact);
      const check = detector.check?.trim() || "unknown-check";
      const names = resolveContractAndFunction(detector.elements);
      return {
        severity,
        title: check,
        description: detector.description?.trim() || "No description provided by Slither.",
        contract: names.contract,
        function: names.func,
        lines: resolveLines(detector.elements),
        recommendation: resolveRecommendation(detector),
        reference_url: resolveSwcUrl(check),
      };
    })
    .filter((issue) => severityFilter === "all" || issue.severity === severityFilter);

  return {
    total_issues: issues.length,
    high: issues.filter((issue) => issue.severity === "high").length,
    medium: issues.filter((issue) => issue.severity === "medium").length,
    low: issues.filter((issue) => issue.severity === "low").length,
    informational: issues.filter((issue) => issue.severity === "informational").length,
    issues,
    audit_time_seconds: auditTimeSeconds,
  };
}

export function parseDetectors(rawStdout: string): SlitherDetector[] {
  const parsed = JSON.parse(rawStdout) as SlitherJsonOutput;
  return parsed.results?.detectors ?? [];
}
