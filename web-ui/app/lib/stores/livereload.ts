// Live Reload store (optional nanostores integration with fallback)
// - liveReloadEnabled: whether live reload is active
// - liveReloadStatus: 'idle' | 'compiling' | 'deploying' | 'ready' | 'error'
// - lastDeployAddress: most recent deployed contract address
// - deployTo(address): simulate compile+deploy to local chain and update address

type LiveReloadStatus = 'idle' | 'compiling' | 'deploying' | 'ready' | 'error';

let _liveReloadEnabled = false;
let _liveReloadStatus: LiveReloadStatus = 'idle';
let _lastDeployAddress = '';

const _enabledSubs: Array<(v: boolean) => void> = [];
const _statusSubs: Array<(s: LiveReloadStatus) => void> = [];
const _addrSubs: Array<(a: string) => void> = [];

function _notifyEnabled(v: boolean) {
  for (const cb of _enabledSubs) cb(v);
}
function _notifyStatus(v: LiveReloadStatus) {
  for (const cb of _statusSubs) cb(v);
}
function _notifyAddr(v: string) {
  for (const cb of _addrSubs) cb(v);
}

let liveReloadEnabledAtom: any;
let liveReloadStatusAtom: any;
let lastDeployAddressAtom: any;

try {
  // Dynamic require to avoid hard dependency on nanostores at runtime
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nanostores = require('nanostores');
  if (nanostores && typeof nanostores.atom === 'function') {
    // Enabled flag
    liveReloadEnabledAtom = nanostores.atom(_liveReloadEnabled);
    if (typeof liveReloadEnabledAtom.set === 'function') {
      const origSet = liveReloadEnabledAtom.set.bind(liveReloadEnabledAtom);
      liveReloadEnabledAtom.set = (v: boolean) => {
        _liveReloadEnabled = v;
        origSet(v);
        _notifyEnabled(v);
      };
    }

    // Status
    liveReloadStatusAtom = nanostores.atom(_liveReloadStatus);
    if (typeof liveReloadStatusAtom.set === 'function') {
      const origSet = liveReloadStatusAtom.set.bind(liveReloadStatusAtom);
      liveReloadStatusAtom.set = (s: LiveReloadStatus) => {
        _liveReloadStatus = s;
        origSet(s);
        _notifyStatus(s);
      };
    }

    // Address
    lastDeployAddressAtom = nanostores.atom(_lastDeployAddress);
    if (typeof lastDeployAddressAtom.set === 'function') {
      const origSet = lastDeployAddressAtom.set.bind(lastDeployAddressAtom);
      lastDeployAddressAtom.set = (a: string) => {
        _lastDeployAddress = a;
        origSet(a);
        _notifyAddr(a);
      };
    }
  } else {
    // Fallback: simple in-process stores
    liveReloadEnabledAtom = {
      set: (v: boolean) => {
        _liveReloadEnabled = v;
        _notifyEnabled(v);
      },
      subscribe(cb: (v: boolean) => void) {
        _enabledSubs.push(cb);
        return () => {
          const i = _enabledSubs.indexOf(cb);
          if (i >= 0) _enabledSubs.splice(i, 1);
        };
      },
    };

    liveReloadStatusAtom = {
      set: (s: LiveReloadStatus) => {
        _liveReloadStatus = s;
        _notifyStatus(s);
      },
      subscribe(cb: (s: LiveReloadStatus) => void) {
        _statusSubs.push(cb);
        return () => {
          const i = _statusSubs.indexOf(cb);
          if (i >= 0) _statusSubs.splice(i, 1);
        };
      },
    };

    lastDeployAddressAtom = {
      set: (a: string) => {
        _lastDeployAddress = a;
        _notifyAddr(a);
      },
      subscribe(cb: (a: string) => void) {
        _addrSubs.push(cb);
        return () => {
          const i = _addrSubs.indexOf(cb);
          if (i >= 0) _addrSubs.splice(i, 1);
        };
      },
    };
  }
} catch {
  // If requiring nanostores fails, provide a local polyfill
  liveReloadEnabledAtom = {
    set: (v: boolean) => {
      _liveReloadEnabled = v;
      _notifyEnabled(v);
    },
    subscribe(cb: (v: boolean) => void) {
      _enabledSubs.push(cb);
      return () => {
        const i = _enabledSubs.indexOf(cb);
        if (i >= 0) _enabledSubs.splice(i, 1);
      };
    },
  };
  liveReloadStatusAtom = {
    set: (s: LiveReloadStatus) => {
      _liveReloadStatus = s;
      _notifyStatus(s);
    },
    subscribe(cb: (s: LiveReloadStatus) => void) {
      _statusSubs.push(cb);
      return () => {
        const i = _statusSubs.indexOf(cb);
        if (i >= 0) _statusSubs.splice(i, 1);
      };
    },
  };
  lastDeployAddressAtom = {
    set: (a: string) => {
      _lastDeployAddress = a;
      _notifyAddr(a);
    },
    subscribe(cb: (a: string) => void) {
      _addrSubs.push(cb);
      return () => {
        const i = _addrSubs.indexOf(cb);
        if (i >= 0) _addrSubs.splice(i, 1);
      };
    },
  };
}

export const liveReloadEnabled = liveReloadEnabledAtom as any;
export const liveReloadStatus = liveReloadStatusAtom as any;
export const lastDeployAddress = lastDeployAddressAtom as any;

// Convenience: trigger deploy to a local chain address (simulated)
export async function deployTo(address: string): Promise<void> {
  // If not enabled, still simulate for tests but do not perform real work
  if (typeof liveReloadStatus.set === 'function') liveReloadStatus.set('compiling');
  // Debounce-like delay to mimic compile time
  await new Promise((r) => setTimeout(r, 150));
  if (typeof liveReloadStatus.set === 'function') liveReloadStatus.set('deploying');
  // Simulate deployment time
  await new Promise((r) => setTimeout(r, 200));
  _lastDeployAddress = address;
  if (typeof lastDeployAddress.set === 'function') lastDeployAddress.set(address);
  if (typeof liveReloadStatus.set === 'function') liveReloadStatus.set('ready');
}

// Optional: start watching files for changes and trigger a re-deploy on changes.
// This is a best-effort integration that prefers bolt.diy if available, otherwise
// falls back to a lightweight polling-based watcher when Node fs is accessible.
export function startWatching(paths: string[] = ['./contracts', './src'], onChange?: () => void, debounceMs: number = 1000) {
  try {
    // Try bolt.diy watcher first (best-effort)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bolt = require('bolt.diy');
    if (bolt && typeof bolt.watchFiles === 'function') {
      // If bolt provides a watcher, delegate to it. We do not rely on a specific API here,
      // just call it if available and let bolt handle debouncing.
      try {
        bolt.watchFiles(paths, onChange as any);
        return;
      } catch {
        // fall through to fallback watcher
      }
    }
  } catch {
    // bolt.diy not available; continue to fallback watcher
  }

  // Lightweight fallback: Node.js fs-based polling (only in non-browser envs)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs');
    const path = require('path');
    const mtimes: Record<string, number> = {};
    paths.forEach((p) => {
      try {
        const stat = fs.statSync(p);
        mtimes[p] = stat.mtimeMs;
      } catch {
        mtimes[p] = 0;
      }
    });
    let timer: any = null;
    const tick = () => {
      let changed = false;
      paths.forEach((p) => {
        try {
          const stat = fs.statSync(p);
          if (stat.mtimeMs !== mtimes[p]) {
            mtimes[p] = stat.mtimeMs;
            changed = true;
          }
        } catch {
          // ignore
        }
      });
      if (changed) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          onChange && onChange();
        }, debounceMs);
      }
    };
    // Run a quick poll loop
    const interval = setInterval(tick, 1000);
    // Cleanup is intentionally omitted for brevity in this mock; it will live as long as the page.
    void interval;
  } catch {
    // fs not available in browser; nothing to do
  }
}
