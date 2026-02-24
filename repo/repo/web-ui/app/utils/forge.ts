// Lightweight formatter to pretty-print `forge test --gas-report` output
// This is a no-op formatter for environments that do not actually run
// Foundry/Forge in this playground UI. It simply converts a raw report to a
// more readable string with a small summary.
export function formatForgeGasReport(raw: string): string {
  if (!raw) return '';
  // Try to extract lines with Function: ... or Gas: patterns
  const lines = raw.split(/\r?\n/);
  const formatted = lines
    .filter((l) => l.trim().length > 0)
    .map((l) => l.trim())
    .join('\n');
  return formatted;
}

export default formatForgeGasReport;
