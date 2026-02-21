// Gas Profiler helpers (parsing and simple utilities)
// Exposed as CommonJS for lightweight tests in this repo.

"use strict";

function formatNumber(n) {
  if (n == null || Number.isNaN(n)) return "0";
  return Number(n).toLocaleString();
}

// Parse a simple textual gas report emitted by forge test --gas-report.
// Expected line format (example):
// Function: transfer(min)  min: 340  avg: 420  max: 580  calls: 10
// Function: approve(min)   min: 260  avg: 270  max: 300  calls: 5
function parseGasReport(text) {
  const lines = (text || "").split(/\r?\n/);
  const fnRe = /Function:\s*(.+?)\s*(?:min:\s*(\d+)|min:\s*(\d+))\s+avg:\s*(\d+)\s+max:\s*(\d+)\s+calls:\s*(\d+)/i;
  const result = [];
  for (const line of lines) {
    if (!line || line.trim() === "") continue;
    const m = line.match(/Function:\s*(.+?)\s+min:\s*(\d+)\s+avg:\s*(\d+)\s+max:\s*(\d+)\s+calls:\s*(\d+)/i);
    if (m) {
      const name = m[1].trim();
      const min = Number(m[2]);
      const avg = Number(m[3]);
      const max = Number(m[4]);
      const calls = Number(m[5]);
      result.push({ name, min, avg, max, calls });
      continue;
    }
    // Fallback more permissive line: Function: <name>  min: <n>  avg: <n>  max: <n>  calls: <n>
    const m2 = line.match(/Function:\s*(.+?)\s+min:\s*(\d+)\s+avg:\s*(\d+)\s+max:\s*(\d+)\s+calls:\s*(\d+)/i);
    if (m2) {
      const name = m2[1].trim();
      const min = Number(m2[2]);
      const avg = Number(m2[3]);
      const max = Number(m2[4]);
      const calls = Number(m2[5]);
      result.push({ name, min, avg, max, calls });
    }
  }
  // Compute delta against previous snapshot if available
  return result.map(r => {
    return { ...r };
  });
}

// Simple Compute Reporter parser (SVM compute units).
// Example lines:
// Instruction: ADD  compute: 123
// Instruction: SUB  compute: 45
function parseComputeReport(text) {
  const lines = (text || "").split(/\r?\n/);
  const res = [];
  for (const line of lines) {
    if (!line) continue;
    const m = line.match(/Instruction:\s*(\S+)\s+compute:\s*(\d+)/i);
    if (m) {
      res.push({ instruction: m[1], compute: Number(m[2]) });
    }
  }
  return res;
}

// Simple color for heatmap: green (low) -> red (high)
function colorForGas(avg) {
  const v = Math.max(0, Math.min(1, avg / 100000)); // assume 100k as high reference
  const r = Math.floor(255 * v);
  const g = Math.floor(255 * (1 - v));
  return `rgb(${r}, ${g}, 0)`;
}

// Very small AI-style suggestions based on high gas items
function generateAiSuggestions(functions) {
  if (!functions || functions.length === 0) return [];
  const high = functions.filter(f => f.avg > 50000);
  const list = [];
  for (const f of high.slice(0, 3)) {
    list.push(`High gas detected in ${f.name}: avg ${formatNumber(f.avg)}. Consider refactoring or caching where appropriate.`);
  }
  if (list.length === 0) {
    list.push('No strong optimization signals detected. Consider a broader review.');
  }
  return list;
}

module.exports = {
  parseGasReport,
  parseComputeReport,
  formatNumber,
  colorForGas,
  generateAiSuggestions,
};
