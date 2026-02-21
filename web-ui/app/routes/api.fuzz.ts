// Lightweight Remix route stubs for fuzz orchestration
// This file is a minimal integration point and may be substituted by a real Remix app.
import path from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
// @ts-ignore - ambient types may be unavailable in this environment
const { spawn } = require('child_process');

// POST: start fuzz runs
export async function action(req: any) {
  let body = {};
  try {
    body = await req.json();
  } catch {}
  const runs = typeof body?.runs === 'number' ? body.runs : 100;
  // Spawn the fuzz runner; ignore errors in this stub
  try {
    // Path is relative to this route file
    const scriptPath = path.resolve(__dirname, '../../runner/src/fuzz.js');
    const child = spawn('node', [scriptPath, String(runs)], { stdio: 'ignore' });
    return new Response(JSON.stringify({ started: true, pid: child.pid }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// GET: latest fuzz report
export async function loader() {
  const dir = path.resolve(process.cwd(), 'reports');
  try {
    if (!existsSync(dir)) {
      return new Response(JSON.stringify({ latest: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const files = fsReaddirSync(dir).filter((f: string) => f.startsWith('fuzz.') && f.endsWith('.json'));
    if (!files.length) {
      return new Response(JSON.stringify({ latest: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    files.sort((a, b) => {
      const pa = fsStatSync(path.join(dir, a)).mtimeMs;
      const pb = fsStatSync(path.join(dir, b)).mtimeMs;
      return pb - pa;
    });
    const latest = path.join(dir, files[0]);
    const content = require('fs').readFileSync(latest, 'utf8');
    return new Response(content, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Small helper shims for TS in this environment
function fsReaddirSync(p: string) { return (require('fs').readdirSync(p)); }
function fsStatSync(p: string) { return (require('fs').statSync(p)); }
