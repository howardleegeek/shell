import { RemixBrowser } from '@remix-run/react';
import { startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';

// Initialize Monaco languages (Rust, Solidity, TOML) if Monaco is available
// This is a no-op in environments without Monaco Editor installed.
try {
  // Dynamically import to avoid bundling Monaco when not needed
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  import('./monaco/setup').then(({ setupMonacoLanguages }) => {
    if (typeof setupMonacoLanguages === 'function') {
      setupMonacoLanguages();
    }
  }).catch(() => {
    // ignore setup errors
  });
} catch {
  // ignore
}

startTransition(() => {
  hydrateRoot(document.getElementById('root')!, <RemixBrowser />);
});
