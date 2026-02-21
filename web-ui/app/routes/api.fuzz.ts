// Remix route for fuzz testing orchestration
import path from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';
// @ts-ignore - ambient types may be unavailable in this environment
const { spawn } = require('child_process');

// Import nanostores for state management
import { atom } from 'nanostores';
import { fuzzStatus, fuzzResults } from '../../lib/stores/fuzz';

// POST: start fuzz runs
export async function action(req: any) {
  let body = {}
  try {
    body = await req.json()
  } catch {}
  const runs = typeof (body as any)?.runs === 'number' ? (body as any).runs : 100

  try {
    // Update status to running
    fuzzStatus.set('running');
    
    // Path is relative to this route file; fuzz.js lives at repo/runner/src/fuzz.js
    const scriptPath = path.resolve(__dirname, '../../../../runner/src/fuzz.js');
    const child = spawn('node', [scriptPath, String(runs)], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd(),
      encoding: 'utf8'
    });

    // Capture stdout to parse progress
    let stdout = '';
    child.stdout?.on('data', (data: string) => {
      stdout += data;
    });

    // Wait for fuzz.js to finish, then read latest report
    await new Promise((resolve) => {
      child.on('close', () => resolve(null));
    });

    // Load latest fuzz report if present
    const dir = path.resolve(process.cwd(), 'reports');
    let latest = null;
    try {
      if (existsSync(dir)) {
        const files = readdirSync(dir).filter((f: string) => f.startsWith('fuzz.') && f.endsWith('.json'));
        if (files.length) {
          files.sort((a, b) => {
            const pa = require('fs').statSync(path.join(dir, a)).mtimeMs;
            const pb = require('fs').statSync(path.join(dir, b)).mtimeMs;
            return pb - pa;
          });
          const latestPath = path.join(dir, files[0]);
          latest = JSON.parse(readFileSync(latestPath, 'utf8'));
          
          // Update nanostores with results
          if (latest) {
            fuzzResults.set({
              totalRuns: latest.totalRuns || 0,
              completedRuns: latest.totalRuns || 0,
              failures: latest.failures || 0,
              counterexamples: latest.counterexamples?.map((ce: string, idx: number) => ({
                id: `cex-${idx}`,
                input: ce,
                expected: 'No counterexample', // Foundry doesn't provide expected/actual in output
                actual: ce
              })) || []
            });
            fuzzStatus.set(latest.ok ? 'done' : 'error');
          }
        }
      }
    } catch {
      latest = null;
      fuzzStatus.set('error');
    }

    return new Response(JSON.stringify({ started: true, latest }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    fuzzStatus.set('error');
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
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
