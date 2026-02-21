import type { ChainType } from '~/lib/stores/chain';

export type AuditSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export interface AuditFinding {
  id: string;
  title: string;
  severity: AuditSeverity;
  description: string;
  location: {
    file: string;
    line?: number;
    contract?: string;
    function?: string;
  };
  recommendation?: string;
  confidence?: string;
  markdown?: string;
}

export interface ParsedAuditResults {
  chainType: ChainType;
  runner: 'slither' | 'mythril' | 'solana-security';
  command: string;
  ok: boolean;
  findings: AuditFinding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  };
  duration?: string;
  rawOutput: string;
}

const SLITHER_COMMAND = 'slither .';
const SOLANA_SECURITY_COMMAND = 'cargo audit';

export function getAuditCommand(chainType: ChainType): string {
  return chainType === 'evm' ? SLITHER_COMMAND : SOLANA_SECURITY_COMMAND;
}

export function parseAuditResults(output: string, chainType: ChainType): ParsedAuditResults {
  const rawOutput = (output || '').replace(/\r\n/g, '\n');
  const parsed = chainType === 'evm' ? parseSlitherResults(rawOutput) : parseSolanaSecurityResults(rawOutput);

  return {
    chainType,
    runner: chainType === 'evm' ? 'slither' : 'solana-security',
    command: getAuditCommand(chainType),
    ok: parsed.summary.critical === 0 && parsed.summary.high === 0,
    findings: parsed.findings,
    summary: parsed.summary,
    duration: parsed.duration,
    rawOutput,
  };
}

function parseSlitherResults(output: string): { findings: AuditFinding[]; summary: ParsedAuditResults['summary']; duration?: string } {
  const findings: AuditFinding[] = [];
  const summary: ParsedAuditResults['summary'] = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
  };

  const severityPattern = /(?:Severity|severity):\s*(Critical|High|Medium|Low|Informational|Information)/gi;
  const findingPattern = /(?:^|\n)([-\s]*)(?:\d+[\.\)]\s*)?(.+?)(?:\n|$)/g;
  
  const contractPattern = /(?:Contract|contract|File|file):\s*([^\n]+)/gi;
  const functionPattern = /(?:Function|function):\s*([^\n]+)/gi;
  const linePattern = /(?:Line|line):\s*(\d+)/gi;

  const sections = output.split(/(?=Severity:\s*(?:Critical|High|Medium|Low|Informational))/i);

  for (const section of sections) {
    if (!section.trim()) continue;

    let severity: AuditSeverity = 'informational';
    const severityMatch = section.match(severityPattern);
    if (severityMatch) {
      const sev = severityMatch[0].replace(/Severity:\s*/i, '').toLowerCase();
      severity = sev === 'information' ? 'informational' : sev as AuditSeverity;
    }

    const titleMatch = section.match(/^(.+?)(?:\n|$)/);
    const title = titleMatch ? titleMatch[1].trim() : 'Unknown Finding';

    const contractMatch = section.match(contractPattern);
    const funcMatch = section.match(functionPattern);
    const lineMatch = section.match(linePattern);

    const contract = contractMatch ? contractMatch[0].replace(/(?:Contract|contract|File|file):\s*/i, '').trim() : '';
    const func = funcMatch ? funcMatch[0].replace(/(?:Function|function):\s*/i, '').trim() : '';
    const line = lineMatch ? parseInt(lineMatch[0].replace(/(?:Line|line):\s*/i, '').trim(), 10) : undefined;

    const descriptionMatch = section.match(/(?:Description|description):\s*([^\n]+(?:\n(?![A-Z][a-z]+:)[^\n]+)*)/i);
    const description = descriptionMatch ? descriptionMatch[1].trim() : section.slice(0, 500);

    const recommendationMatch = section.match(/(?:Recommendation|recommendation):\s*([^\n]+(?:\n(?![A-Z][a-z]+:)[^\n]+)*)/i);
    const recommendation = recommendationMatch ? recommendationMatch[1].trim() : undefined;

    if (title && title !== 'Unknown Finding') {
      findings.push({
        id: `slither-${findings.length + 1}`,
        title,
        severity,
        description,
        location: {
          file: contract,
          line,
          contract,
          function: func,
        },
        recommendation,
        confidence: 'high',
      });

      summary[severity]++;
    }
  }

  const jsonMatch = output.match(/\{[\s\S]*"success"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const json = JSON.parse(jsonMatch[0]);
      if (json.results && Array.isArray(json.results)) {
        for (const result of json.results) {
          const severity = mapSlitherSeverity(result.severity || result.impact);
          findings.push({
            id: result.id || `slither-${findings.length + 1}`,
            title: result.title || result.check || result.description?.split('\n')[0] || 'Unknown',
            severity,
            description: result.description || '',
            location: {
              file: result.source_mapping?.filename || result.file || '',
              line: result.source_mapping?.lines?.[0] || result.line,
              contract: result.contract || '',
              function: result.function || '',
            },
            recommendation: result.recommendation || result.fix,
            confidence: result.confidence,
          });
          summary[severity]++;
        }
      }
    } catch {
      // JSON parse failed, use regex parsed results
    }
  }

  const durationMatch = output.match(/(?:Duration|duration|Time|time):\s*([\d.]+\s*[a-z]+)/i);

  return {
    findings,
    summary,
    duration: durationMatch?.[1],
  };
}

function parseSolanaSecurityResults(output: string): { findings: AuditFinding[]; summary: ParsedAuditResults['summary']; duration?: string } {
  const findings: AuditFinding[] = [];
  const summary: ParsedAuditResults['summary'] = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
  };

  const advisoryPattern = /(?:^|\n)(?:ID:\s*)?((?:RUSTSEC|CVE|GHSA)-[A-Za-z0-9-]+)/gm;
  const severityPattern = /(?:Severity|severity):\s*(Critical|High|Medium|Low|Info|Informational)/gi;
  const titlePattern = /(?:Title|title):\s*([^\n]+)/gi;
  const filePattern = /(?:File|file|Path|path):\s*([^\n]+)/gi;

  const sections = output.split(/(?=(?:ID:|Advisory:|Vulnerability:))/i);

  for (const section of sections) {
    if (!section.trim()) continue;

    let severity: AuditSeverity = 'medium';
    const severityMatch = section.match(severityPattern);
    if (severityMatch) {
      const sev = severityMatch[0].replace(/Severity:\s*/i, '').toLowerCase();
      severity = sev === 'info' || sev === 'informational' ? 'informational' : sev as AuditSeverity;
    }

    const idMatch = section.match(advisoryPattern);
    const id = idMatch ? idMatch[0].trim() : `solana-security-${findings.length + 1}`;

    const titleMatch = section.match(titlePattern);
    const title = titleMatch ? titleMatch[0].replace(/Title:\s*/i, '').trim() : 'Security Finding';

    const fileMatch = section.match(filePattern);
    const file = fileMatch ? fileMatch[0].replace(/(?:File|file|Path|path):\s*/i, '').trim() : '';

    const lines = section.split('\n');
    const description = lines.slice(1, 5).join('\n').trim();

    if (title && title !== 'Security Finding') {
      findings.push({
        id,
        title,
        severity,
        description,
        location: {
          file,
        },
      });

      summary[severity]++;
    }
  }

  const cargoAuditPattern = /Status:\s*(\d+)\s+vulnerabilities?\s*found/gi;
  const cargoMatch = output.match(cargoAuditPattern);
  if (cargoMatch) {
    const vulnCountMatch = output.match(/(\d+)\s+vulnerabilities?\s*found/i);
    if (vulnCountMatch) {
      const total = parseInt(vulnCountMatch[1], 10);
      const unpatched = output.match(/(\d+)\s+unpatched/i);
      const unpatchedCount = unpatched ? parseInt(unpatched[1], 10) : total;
      
      if (total > 0 && findings.length === 0) {
        findings.push({
          id: 'cargo-audit-1',
          title: 'Vulnerabilities Found',
          severity: unpatchedCount > 0 ? 'high' : 'medium',
          description: `${total} vulnerabilities found (${unpatchedCount} unpatched)`,
          location: { file: 'Cargo.lock' },
        });
        summary[unpatchedCount > 0 ? 'high' : 'medium']++;
      }
    }
  }

  const durationMatch = output.match(/(?:finished in|duration:)\s*([\d.]+\s*[a-z]+)/i);

  return {
    findings,
    summary,
    duration: durationMatch?.[1],
  };
}

function mapSlitherSeverity(impact: string): AuditSeverity {
  const normalized = (impact || '').toLowerCase();
  switch (normalized) {
    case 'critical':
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
    case 'informational':
    case 'information':
    case 'optimization':
      return 'low';
    default:
      return 'medium';
  }
}

export function formatAuditReport(results: ParsedAuditResults): string {
  const lines: string[] = [
    `# Security Audit Report`,
    ``,
    `**Runner:** ${results.runner}`,
    `**Chain:** ${results.chainType}`,
    `**Status:** ${results.ok ? '✅ Passed' : '❌ Issues Found'}`,
    ``,
    `## Summary`,
    ``,
    `- Critical: ${results.summary.critical}`,
    `- High: ${results.summary.high}`,
    `- Medium: ${results.summary.medium}`,
    `- Low: ${results.summary.low}`,
    `- Informational: ${results.summary.informational}`,
    ``,
  ];

  if (results.findings.length > 0) {
    lines.push(`## Findings`, ``);

    const sortedFindings = [...results.findings].sort((a, b) => {
      const order: AuditSeverity[] = ['critical', 'high', 'medium', 'low', 'informational'];
      return order.indexOf(a.severity) - order.indexOf(b.severity);
    });

    for (const finding of sortedFindings) {
      lines.push(`### ${finding.title}`, ``);
      lines.push(`**Severity:** ${finding.severity.toUpperCase()}`);
      if (finding.location.file) {
        lines.push(`**Location:** ${finding.location.file}${finding.location.line ? `:${finding.location.line}` : ''}`);
      }
      lines.push(``, finding.description, ``);
      if (finding.recommendation) {
        lines.push(`**Recommendation:** ${finding.recommendation}`, ``);
      }
    }
  }

  return lines.join('\n');
}
