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
  if (typeof liveReloadStatus.set === 'function') liveReloadStatus.set('deploying');
  // Debounce-like delay to mimic compile+deploy work
  await new Promise((r) => setTimeout(r, 50));
  _lastDeployAddress = address;
  if (typeof lastDeployAddress.set === 'function') lastDeployAddress.set(address);
  if (typeof liveReloadStatus.set === 'function') liveReloadStatus.set('ready');
}
