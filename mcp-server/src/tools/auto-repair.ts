import fs from "node:fs";
import path from "node:path";

type FailureRecord = {
  failure: string;
  source_location?: string;
  category?: string;
};

type SourceContext = {
  file: string;
  line: number;
  lines: string[];
};

export type AutoRepairInput = {
  project_dir: string;
  report: any;
  source_files?: string[];
  max_patches?: number;
};

export type AnalysisItem = {
  failure: string;
  root_cause: string;
  category: string;
  affected_file: string;
  affected_lines: [number, number];
  suggested_fix: string;
  patch: string;
};

export interface AutoRepairOutput {
  analysis: AnalysisItem[];
  confidence: "high" | "medium" | "low";
  total_failures_analyzed: number;
}

export function analyzeRepair(input: AutoRepairInput): AutoRepairOutput {
  const failures = normalizeFailures(input.report);
  const maxPatches = Math.max(1, input.max_patches ?? 3);
  const selected = failures.slice(0, maxPatches);
  const analysis: AnalysisItem[] = [];
  let knownCategoryCount = 0;
  let contextCount = 0;

  for (const failure of selected) {
    const category = detectCategory(failure);
    const source = findSourceContext(input.project_dir, failure, input.source_files);
    const details = analyzeByCategory(category, failure.failure, source);
    if (category !== "unknown") {
      knownCategoryCount++;
    }
    if (source) {
      contextCount++;
    }

    analysis.push({
      failure: failure.failure,
      root_cause: details.rootCause,
      category,
      affected_file: source?.file ?? (input.source_files?.[0] ?? "unknown"),
      affected_lines: details.affectedLines,
      suggested_fix: details.suggestedFix,
      patch: source
        ? buildPatch(source.file, source.lines.length, details.affectedLines[0], details.suggestedFix)
        : "",
    });
  }

  return {
    analysis,
    confidence: pickConfidence(analysis.length, knownCategoryCount, contextCount),
    total_failures_analyzed: analysis.length,
  };
}

function normalizeFailures(report: any): FailureRecord[] {
  if (Array.isArray(report?.failures)) {
    return report.failures.map((failure: any) => ({
      failure: String(failure.failure ?? failure.message ?? "Unknown failure"),
      source_location: toSourceLocation(failure),
      category: failure.category,
    }));
  }

  if (Array.isArray(report?.results)) {
    return report.results
      .filter((result: any) => result.status === "failure")
      .map((result: any) => ({
        failure: String(result.message ?? (Array.isArray(result.logs) ? result.logs.join(" | ") : "Unknown failure")),
        source_location: toSourceLocation(result),
        category: result.category,
      }));
  }

  return [];
}

function toSourceLocation(record: any): string | undefined {
  if (typeof record?.source_location === "string") {
    return record.source_location;
  }
  if (typeof record?.location === "string") {
    return record.location;
  }
  if (typeof record?.file === "string" && Number.isFinite(record?.line)) {
    return `${record.file}:${record.line}`;
  }
  return undefined;
}

function detectCategory(failure: FailureRecord): AnalysisItem["category"] {
  const explicit = String(failure.category ?? "").toLowerCase();
  if (explicit === "assertion" || explicit === "revert" || explicit === "overflow" || explicit === "access_control" || explicit === "gas") {
    return explicit;
  }

  const text = failure.failure.toLowerCase();
  if (/assert|expected|actual|assertion failed/.test(text)) {
    return "assertion";
  }
  if (/revert|reverted|require failed|panic/.test(text)) {
    return "revert";
  }
  if (/overflow|underflow|panic code 0x11/.test(text)) {
    return "overflow";
  }
  if (/onlyowner|owner|access control|unauthorized|not authorized|msg\.sender/.test(text)) {
    return "access_control";
  }
  if (/out of gas|gas/.test(text)) {
    return "gas";
  }
  return "unknown";
}

function parseLocation(sourceLocation: string | undefined): { file: string; line: number } | null {
  if (!sourceLocation) {
    return null;
  }
  const match = sourceLocation.match(/(.+):(\d+)(?::\d+)?$/);
  if (!match) {
    return null;
  }
  return {
    file: match[1],
    line: Math.max(1, parseInt(match[2], 10)),
  };
}

function findSourceContext(
  projectDir: string,
  failure: FailureRecord,
  sourceFiles: string[] | undefined
): SourceContext | null {
  const parsed = parseLocation(failure.source_location);
  const fileCandidates: string[] = [];

  if (parsed?.file) {
    fileCandidates.push(parsed.file);
  }
  if (Array.isArray(sourceFiles)) {
    fileCandidates.push(...sourceFiles);
  }

  for (const candidate of fileCandidates) {
    const resolved = path.isAbsolute(candidate)
      ? candidate
      : path.join(projectDir, candidate);
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
      continue;
    }
    const content = fs.readFileSync(resolved, "utf8");
    const lines = content.split(/\r?\n/);
    return {
      file: path.relative(projectDir, resolved).replaceAll("\\", "/"),
      line: Math.min(parsed?.line ?? 1, Math.max(1, lines.length)),
      lines,
    };
  }
  return null;
}

function analyzeByCategory(category: string, failureText: string, source: SourceContext | null): {
  rootCause: string;
  suggestedFix: string;
  affectedLines: [number, number];
} {
  const defaultLine = source?.line ?? 1;
  const context = source ? getContextLines(source.lines, defaultLine, 20) : [];

  if (category === "assertion") {
    const match = failureText.match(/expected[: ]+([^\s,]+)[, ]+(?:got|actual)[: ]+([^\s,]+)/i);
    const expected = match?.[1];
    const actual = match?.[2];
    const assertionLine = findLine(context, /\bassert\w*\s*\(/i) ?? defaultLine;
    const rootCause = expected && actual
      ? `Assertion mismatch: expected ${expected} but got ${actual}.`
      : "Assertion mismatch between expected and actual values.";
    return {
      rootCause,
      suggestedFix: "Align assertion expectation with actual contract behavior, or fix contract return value.",
      affectedLines: [assertionLine, assertionLine],
    };
  }

  if (category === "revert") {
    const reason = extractRevertReason(failureText);
    const revertLine = findLine(context, /(require\s*\(|revert\s*\()/i) ?? defaultLine;
    return {
      rootCause: reason
        ? `Transaction reverted with reason "${reason}".`
        : "Transaction reverted due to failed guard condition.",
      suggestedFix: "Inspect the matched require/revert guard and update preconditions, caller, or test setup.",
      affectedLines: [revertLine, revertLine],
    };
  }

  if (category === "overflow") {
    return {
      rootCause: "Arithmetic overflow/underflow detected by checked math.",
      suggestedFix: "Use checked math bounds, SafeMath-style helpers, or targeted unchecked blocks with guards.",
      affectedLines: [defaultLine, defaultLine],
    };
  }

  if (category === "access_control") {
    const aclLine = findLine(context, /(onlyOwner|msg\.sender|owner)/i) ?? defaultLine;
    return {
      rootCause: "Access control restriction failed for the calling account.",
      suggestedFix: "Validate msg.sender/onlyOwner assumptions and ensure the expected caller is used in setup.",
      affectedLines: [aclLine, aclLine],
    };
  }

  if (category === "gas") {
    return {
      rootCause: "Gas usage exceeded expected thresholds.",
      suggestedFix: "Optimize loops, reduce storage writes, and cache repeated reads.",
      affectedLines: [defaultLine, defaultLine],
    };
  }

  return {
    rootCause: "Unable to classify failure with current heuristic rules.",
    suggestedFix: "Review stack trace and source context to add a focused fix.",
    affectedLines: [defaultLine, defaultLine],
  };
}

function getContextLines(lines: string[], centerLine: number, window: number): Array<{ line: number; content: string }> {
  const start = Math.max(1, centerLine - window);
  const end = Math.min(lines.length, centerLine + window);
  const context: Array<{ line: number; content: string }> = [];
  for (let line = start; line <= end; line++) {
    context.push({ line, content: lines[line - 1] ?? "" });
  }
  return context;
}

function findLine(
  context: Array<{ line: number; content: string }>,
  pattern: RegExp
): number | null {
  const found = context.find((entry) => pattern.test(entry.content));
  return found ? found.line : null;
}

function extractRevertReason(text: string): string | null {
  const revertMatch = text.match(/revert(?:ed)?(?::|\s+with reason string\s+)?\s*['"]?([^'"]+)['"]?/i);
  if (revertMatch?.[1]) {
    return revertMatch[1].trim();
  }
  return null;
}

function buildPatch(file: string, lineCount: number, targetLine: number, suggestion: string): string {
  const insertionLine = Math.min(Math.max(1, targetLine), lineCount + 1);
  const comment = `// AUTO_REPAIR: ${suggestion}`;
  return [
    `diff --git a/${file} b/${file}`,
    `--- a/${file}`,
    `+++ b/${file}`,
    `@@ -${insertionLine},0 +${insertionLine},1 @@`,
    `+${comment}`,
  ].join("\n");
}

function pickConfidence(
  totalAnalyzed: number,
  knownCategoryCount: number,
  contextCount: number
): "high" | "medium" | "low" {
  if (totalAnalyzed === 0) {
    return "low";
  }
  if (knownCategoryCount === totalAnalyzed && contextCount === totalAnalyzed) {
    return "high";
  }
  if (knownCategoryCount > 0) {
    return "medium";
  }
  return "low";
}
