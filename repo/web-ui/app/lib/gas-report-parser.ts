// Gas/Compute Report Parser (TypeScript shim)
// Ports of the JS helpers exposed by gasProfiler.js
export function formatNumber(n: any): string {
  if (n == null || Number.isNaN(n)) return "0";
  return Number(n).toLocaleString();
}

export function parseGasReport(text: string): any[] {
  const lines = (text || "").split(/\r?\n/);
  const result: any[] = [];
  for (const line of lines) {
    if (!line || line.trim() === "") continue;
    const m = line.match(/Function:\s*(.+?)\s+min:\s*(\d+)\s+avg:\s*(\d+)\s+max:\s*(\d+)\s+calls:\s*(\d+)/i);
    const m2 = line.match(/Function:\s*(.+?)\s+min:\s*(\d+)\s+avg:\s*(\d+)\s+max:\s*(\d+)\s+calls:\s*(\d+)/i);
    const mUse = m || m2;
    if (mUse) {
      result.push({
        name: mUse[1].trim(),
        min: Number(mUse[2]),
        avg: Number(mUse[3]),
        max: Number(mUse[4]),
        calls: Number(mUse[5]),
      });
    }
  }
  return result;
}

export function parseComputeReport(text: string): any[] {
  const lines = (text || "").split(/\r?\n/);
  const res: any[] = [];
  for (const line of lines) {
    if (!line) continue;
    const m = line.match(/Instruction:\s*(\S+)\s+compute:\s*(\d+)/i);
    if (m) {
      res.push({ instruction: m[1], compute: Number(m[2]) });
    }
  }
  return res;
}

export function colorForGas(avg: number): string {
  const v = Math.max(0, Math.min(1, avg / 100000));
  const r = Math.floor(255 * v);
  const g = Math.floor(255 * (1 - v));
  return `rgb(${r}, ${g}, 0)`;
}

export function generateAiSuggestions(functions: any[]) {
  if (!functions || functions.length === 0) return [];
  const high = functions.filter((f: any) => f.avg > 50000);
  const list: string[] = [];
  for (const f of high.slice(0, 3)) {
    list.push(`High gas detected in ${f.name}: avg ${formatNumber(f.avg)}. Consider refactoring or caching where appropriate.`);
  }
  if (list.length === 0) {
    list.push('No strong optimization signals detected. Consider a broader review.');
  }
  return list;
}
