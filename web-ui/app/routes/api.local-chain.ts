import { json } from '@remix-run/cloudflare';
import { ActionFunctionArgs } from '@remix-run/cloudflare';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { spawn, execSync } from 'child_process';

const STATUS_PATH = join(process.cwd(), '.local-chains', 'status.json');

function ensureStatusFile() {
  const dir = join(process.cwd(), '.local-chains');
  if (!existsSync(dir)) {
    // eslint-disable-next-line no-sync
    require('fs').mkdirSync(dir);
  }
  if (!existsSync(STATUS_PATH)) {
    writeFileSync(STATUS_PATH, JSON.stringify({ svm: { state: 'stopped', pid: null }, evm: { state: 'stopped', pid: null } }, null, 2));
  }
}

function readStatus() {
  ensureStatusFile();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const data = readFileSync(STATUS_PATH, 'utf8');
  return JSON.parse(data);
}

function writeStatus(status: any) {
  ensureStatusFile();
  writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2));
}

function startSVM(): number | null {
  try {
    // Start solana-test-validator in detached mode so it persists after this process ends
    const p = spawn('solana-test-validator', {
      detached: true,
      stdio: 'ignore',
      shell: true,
    });
    p.unref();
    return p.pid;
  } catch {
    return null;
  }
}

function startEVM(): number | null {
  try {
    const p = spawn('anvil', {
      detached: true,
      stdio: 'ignore',
      shell: true,
    });
    p.unref();
    return p.pid;
  } catch {
    return null;
  }
}

function stopProcess(pid: number | null): boolean {
  if (!pid) return false;
  try {
    // Try graceful termination first
    process.kill(pid, 'SIGTERM');
  } catch {
    // Ignore if already terminated
  }
  return true;
}

export async function loader() {
  try {
    const status = readStatus();
    return json({ status });
  } catch (e) {
    return json({ status: { svm: { state: 'unknown' }, evm: { state: 'unknown' } } }, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const payload = await request.json();
    const action = payload?.action as string;
    const status = readStatus();

    if (action === 'start-svm') {
      if (status.svm.state === 'running') {
        return json({ ok: true, message: 'SVM already running', status });
      }
      const pid = startSVM();
      if (pid) {
        status.svm = { state: 'running', pid };
        // Basic health check: try a quick cluster-version command
        try {
          execSync('solana cluster-version --url localhost', { timeout: 2000 });
        } catch {
          // health check failed, still mark as running; UI can retry
        }
      } else {
        return json({ ok: false, message: 'Failed to start SVM', status }, { status: 500 });
      }
      writeStatus(status);
      return json({ ok: true, status });
    }

    if (action === 'start-evm') {
      if (status.evm.state === 'running') {
        return json({ ok: true, message: 'EVM already running', status });
      }
      const pid = startEVM();
      if (pid) {
        status.evm = { state: 'running', pid };
      } else {
        return json({ ok: false, message: 'Failed to start EVM', status }, { status: 500 });
      }
      writeStatus(status);
      return json({ ok: true, status });
    }

    if (action === 'stop-svm') {
      const pid = status.svm?.pid ?? null;
      if (stopProcess(pid)) {
        status.svm = { state: 'stopped', pid: null };
        writeStatus(status);
        return json({ ok: true, status });
      }
      return json({ ok: false, message: 'SVM not running', status }, { status: 400 });
    }

    if (action === 'stop-evm') {
      const pid = status.evm?.pid ?? null;
      if (stopProcess(pid)) {
        status.evm = { state: 'stopped', pid: null };
        writeStatus(status);
        return json({ ok: true, status });
      }
      return json({ ok: false, message: 'EVM not running', status }, { status: 400 });
    }

    return json({ ok: false, message: 'Unknown action' });
  } catch (err) {
    console.error('local-chain api error:', err);
    return json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
