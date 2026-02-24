const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

function normalizeSeverity(value) {
  const input = String(value || '').toLowerCase();
  if (input.includes('critical')) return 'critical';
  if (input.includes('high') || input === 'error') return 'high';
  if (input.includes('medium') || input === 'warning' || input === 'warn') return 'medium';
  if (input.includes('low')) return 'low';
  return 'info';
}

function normalizePath(filePath) {
  if (!filePath) return '';
  return String(filePath).replace(/\\/g, '/');
}

function extractFixHint(text) {
  const lines = String(text || '').split('\n').map((line) => line.trim());
  const hintLine = lines.find((line) => /^recommendation\s*:|^remediation\s*:|^fix\s*:/i.test(line));
  if (!hintLine) return 'Review the affected code path and apply secure coding checks for this pattern.';
  return hintLine.split(':').slice(1).join(':').trim() || 'Apply the recommended remediation.';
}

function makeFinding(source, partial) {
  return {
    id: `${source}-${partial.file}:${partial.line}:${partial.ruleId || partial.severity}`,
    source,
    severity: normalizeSeverity(partial.severity),
    title: partial.title || 'Security finding',
    description: partial.description || '',
    recommendation: partial.recommendation || 'Review and patch the vulnerable code path.',
    file: normalizePath(partial.file),
    line: Number(partial.line || 1),
    column: Number(partial.column || 1),
    ruleId: partial.ruleId || '',
    raw: partial.raw || null,
  };
}

function parseJsonSafely(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {}

  const firstObject = trimmed.indexOf('{');
  const firstArray = trimmed.indexOf('[');
  let start = -1;
  if (firstObject >= 0 && firstArray >= 0) {
    start = Math.min(firstObject, firstArray);
  } else {
    start = Math.max(firstObject, firstArray);
  }
  if (start < 0) return null;

  const objectEnd = trimmed.lastIndexOf('}');
  const arrayEnd = trimmed.lastIndexOf(']');
  const end = Math.max(objectEnd, arrayEnd);
  if (end <= start) return null;

  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

function parseSlitherOutput(output) {
  const report = parseJsonSafely(output);
  const findings = [];
  const detectors = report?.results?.detectors || [];

  for (const detector of detectors) {
    const elements = Array.isArray(detector.elements) ? detector.elements : [];
    if (elements.length === 0) {
      findings.push(
        makeFinding('slither', {
          severity: detector.impact || detector.severity || 'info',
          title: detector.check || 'Slither detector',
          description: detector.description || '',
          recommendation: extractFixHint(detector.description || ''),
          file: 'unknown',
          line: 1,
          column: 1,
          ruleId: detector.check,
          raw: detector,
        }),
      );
      continue;
    }

    for (const element of elements) {
      const mapping = element.source_mapping || {};
      const lines = Array.isArray(mapping.lines) ? mapping.lines : [];
      findings.push(
        makeFinding('slither', {
          severity: detector.impact || detector.severity || 'info',
          title: detector.check || 'Slither detector',
          description: detector.description || '',
          recommendation: extractFixHint(detector.description || ''),
          file: mapping.filename_relative || mapping.filename_absolute || element.name || 'unknown',
          line: lines[0] || 1,
          column: mapping.starting_column || 1,
          ruleId: detector.check,
          raw: detector,
        }),
      );
    }
  }

  return findings;
}

function parseSemgrepOutput(output) {
  const report = parseJsonSafely(output);
  const findings = [];
  const results = report?.results || [];

  for (const result of results) {
    findings.push(
      makeFinding('semgrep', {
        severity: result?.extra?.severity || 'info',
        title: result?.check_id || 'Semgrep finding',
        description: result?.extra?.message || '',
        recommendation: extractFixHint(result?.extra?.message || ''),
        file: result?.path || 'unknown',
        line: result?.start?.line || 1,
        column: result?.start?.col || 1,
        ruleId: result?.check_id || '',
        raw: result,
      }),
    );
  }

  return findings;
}

function parseClippyOutput(output) {
  const findings = [];
  const lines = String(output || '').split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) continue;

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }

    if (parsed.reason !== 'compiler-message') continue;

    const message = parsed.message || {};
    const level = message.level || 'warning';
    const spans = Array.isArray(message.spans) ? message.spans : [];
    const primarySpan = spans.find((span) => span?.is_primary) || spans[0] || {};
    const code = message.code?.code || '';

    if (level === 'note' || level === 'help') continue;

    findings.push(
      makeFinding('clippy', {
        severity: level,
        title: code || 'clippy',
        description: message.message || '',
        recommendation: 'Apply the clippy suggestion and rerun cargo clippy until warnings are cleared.',
        file: primarySpan.file_name || 'unknown',
        line: primarySpan.line_start || 1,
        column: primarySpan.column_start || 1,
        ruleId: code,
        raw: parsed,
      }),
    );
  }

  return findings;
}

function runAnchorSecurityLints(fileEntries) {
  const findings = [];

  for (const [filePath, content] of fileEntries) {
    if (!filePath.endsWith('.rs') || typeof content !== 'string') continue;

    const isAnchorProgram = /anchor_lang::prelude|#\s*\[\s*program\s*\]/.test(content);
    if (!isAnchorProgram) continue;

    const lines = content.split('\n');
    const hasSignerType = /Signer\s*<\s*'info\s*>/.test(content);
    const hasSignerCheck = /\.is_signer\b|require!\s*\([^)]*is_signer/.test(content);
    const hasOwnerCheck = /\.owner\b|has_one\s*=|constraint\s*=/.test(content);
    const hasAccountMutations = /token::|system_program::|invoke_signed|invoke\(/.test(content);

    if (!hasSignerType && !hasSignerCheck) {
      const line = lines.findIndex((entry) => /pub\s+fn\s+\w+\s*\(/.test(entry));
      findings.push(
        makeFinding('anchor-lints', {
          severity: 'high',
          title: 'Missing signer check',
          description: 'Instruction handler appears to lack signer validation.',
          recommendation: "Use `Signer<'info>` in accounts and/or add explicit signer guard before state mutation.",
          file: filePath,
          line: line >= 0 ? line + 1 : 1,
          column: 1,
          ruleId: 'anchor.missing-signer-check',
          raw: null,
        }),
      );
    }

    if (hasAccountMutations && !hasOwnerCheck) {
      const line = lines.findIndex((entry) => /pub\s+fn\s+\w+\s*\(/.test(entry));
      findings.push(
        makeFinding('anchor-lints', {
          severity: 'medium',
          title: 'Missing owner/constraint check',
          description: 'Program performs account operations without explicit owner/constraint checks.',
          recommendation: 'Add `has_one` / `constraint` guards or explicit owner assertions for all writable accounts.',
          file: filePath,
          line: line >= 0 ? line + 1 : 1,
          column: 1,
          ruleId: 'anchor.missing-owner-check',
          raw: null,
        }),
      );
    }
  }

  return findings;
}

function sortFindings(findings) {
  return [...findings].sort((a, b) => {
    const severityDiff = SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
    if (severityDiff !== 0) return severityDiff;
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line - b.line;
  });
}

function summarizeFindings(findings) {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.severity] += 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
  );
}

module.exports = {
  SEVERITY_ORDER,
  normalizeSeverity,
  parseSlitherOutput,
  parseSemgrepOutput,
  parseClippyOutput,
  runAnchorSecurityLints,
  sortFindings,
  summarizeFindings,
};
