// Auto-repair v2 orchestrator (JS)
// - Reads test and audit reports from the adjacent Reports directory
// - Generates patch descriptors for failing tests or high/critical audits
// - Writes patch metadata into repo/auto-repair-v2/patches
// - Updates progress log for traceability
"use strict";
const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function collectTestReports(reportsDir) {
  const out = [];
  if (!fs.existsSync(reportsDir)) return out;
  const items = fs.readdirSync(reportsDir);
  for (const it of items) {
    if (it.startsWith('test.') && it.endsWith('.json')) {
      const p = path.join(reportsDir, it);
      const obj = readJson(p);
      if (obj) {
        // normalize shape
        out.push({ file: it, data: obj });
      }
    }
  }
  return out;
}

function collectAuditReports(reportsDir) {
  const out = [];
  if (!fs.existsSync(reportsDir)) return out;
  const items = fs.readdirSync(reportsDir);
  for (const it of items) {
    if (it.startsWith('audit.') && it.endsWith('.json')) {
      const p = path.join(reportsDir, it);
      const obj = readJson(p);
      if (obj) {
        out.push({ file: it, data: obj });
      }
    }
  }
  return out;
}

function writePatchMeta(patchesDir, kind, name, payload) {
  const fname = `${kind}-${name}.patch.json`.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fpath = path.join(patchesDir, fname);
  fs.writeFileSync(fpath, JSON.stringify(payload, null, 2), 'utf8');
  return fpath;
}

function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const reportsDir = path.join(repoRoot, 'reports');
  const patchesDir = path.join(__dirname, 'patches');
  ensureDir(patchesDir);

  const testReports = collectTestReports(reportsDir);
  const auditReports = collectAuditReports(reportsDir);
  const fixes = [];

  // Process failing tests
  for (const t of testReports) {
    const d = t.data || {};
    if (d.ok === false) {
      const name = d.name || t.file.replace(/[^a-zA-Z0-9._-]/g, '_');
      const payload = {
        type: 'test-fix',
        name: name,
        issues: d.details && d.details.errors ? d.details.errors : [],
        note: 'AI-generated patch placeholder for failing test',
        applied: false
      };
      const patchPath = writePatchMeta(patchesDir, 'test', name, payload);
      fixes.push({ kind: 'test', name, path: patchPath, payload });
    }
  }

  // Process high/critical audits
  for (const a of auditReports) {
    const d = a.data || {};
    const severity = (d.severity || '').toLowerCase();
    if (severity === 'critical' || severity === 'high') {
      const name = d.name || a.file.replace(/[^a-zA-Z0-9._-]/g, '_');
      const payload = {
        type: 'audit-fix',
        name: name,
        vuln: d.vuln || d.description || 'unknown',
        patch_suggestion: 'AI-generated security patch placeholder',
        applied: false
      };
      const patchPath = writePatchMeta(patchesDir, 'audit', name, payload);
      fixes.push({ kind: 'audit', name, path: patchPath, payload });
    }
  }

  // Persist a simple progress log for this run
  const progressPath = path.join(repoRoot, 'progress.txt');
  const summary = {
    timestamp: new Date().toISOString(),
    fixes: fixes.map(f => ({ kind: f.kind, name: f.name, file: f.path }))
  };
  fs.appendFileSync(progressPath, `\n${JSON.stringify(summary)}\n`, 'utf8');

  // Exit with success regardless of whether patches were found, since this is a dry-run orchestrator
  process.exit(0);
}

main();
