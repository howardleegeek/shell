// Lightweight Monaco language setup for bolt.diy web UI
// - Registers Rust, Solidity and TOML languages (basic tokenization)
// - Defines a cyberpunk theme for token colors
// - Uses dynamic imports to avoid hard dependency at build time
export async function setupMonacoLanguages() {
  try {
    // Dynamically import Monaco Editor API
    // Depending on bundler, the default export may vary
    const mod: any = await import('monaco-editor/esm/vs/editor/editor.api');
    const monaco: any = mod?.default ?? mod;

    if (!monaco || !monaco.languages) {
      return;
    }

    // Rust (try built-in first, then fallback to Monarch provider)
    try {
      await import('monaco-editor/esm/vs/basic-languages/rust/rust');
    } catch {
      // ignore if not available
    }
    try {
      monaco.languages.register({ id: 'rust' });
      if (typeof monaco.languages.setMonarchTokensProvider === 'function') {
        monaco.languages.setMonarchTokensProvider('rust', {
          tokenizer: {
            root: [
              [/\bfn\b|\blet\b|\bpub\b|\bif\b|\belse\b|\bmatch\b/, 'keyword'],
              [/"([^"\\]|\\.)*"/, 'string'],
              [/\/\/.*$/, 'comment'],
              [/\/\*[^*]*\*+([^/*][^*]*\*+)*\//, 'comment'],
              [/\b[0-9]+\b/, 'number'],
              [/\b[A-Za-z_]\w*\b/, 'identifier'],
            ],
          },
        } as any);
      }
    } catch {
      // ignore if registration fails
    }

    // Solidity (register and provide a lightweight tokenizer)
    try {
      await import('monaco-editor/esm/vs/basic-languages/solidity/solidity');
    } catch {
      // ignore
    }
    try {
      monaco.languages.register({ id: 'solidity' });
      if (typeof monaco.languages.setMonarchTokensProvider === 'function') {
        monaco.languages.setMonarchTokensProvider('solidity', {
          tokenizer: {
            root: [
              [/pragma\b/, 'keyword'],
              [/contract\b/, 'keyword'],
              [/function\b/, 'keyword'],
              [/mapping\b/, 'type'],
              [/\b(uint256|uint|address|bool|bytes|string)\b/, 'type'],
              [/\/\/.*$/, 'comment'],
              [/\/\*[^*]*\*+([^/*][^*]*\*+)*\//, 'comment'],
              [/".*?"/, 'string'],
              [/\b[0-9]+\b/, 'number'],
              [/\b[A-Za-z_][A-Za-z0-9_]*\b/, 'identifier'],
            ],
          },
        } as any);
      }
    } catch {
      // ignore
    }

    // TOML for Anchor.toml, Cargo.toml
    try {
      await import('monaco-editor/esm/vs/basic-languages/toml/toml');
    } catch {
      // ignore
    }
    try {
      monaco.languages.register({ id: 'toml' });
      if (typeof monaco.languages.setMonarchTokensProvider === 'function') {
        monaco.languages.setMonarchTokensProvider('toml', {
          tokenizer: {
            root: [
              [/^#.*$/, 'comment'],
              [/^\[.*\]$/, 'keyword'],
              [/\b[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*".*?"/, 'string'],
              [/=\s*\".*?\"/, 'string'],
              [/\b\d+\b/, 'number'],
            ],
          },
        } as any);
      }
    } catch {
      // ignore
    }

    // Cyberpunk theme (token colors)
    if (typeof monaco.editor.defineTheme === 'function') {
      monaco.editor.defineTheme('cyberpunk', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: '#b84dff' },
          { token: 'string', foreground: '#00ff88' },
          { token: 'comment', foreground: '#666666' },
          { token: 'type', foreground: '#4dc9f6' },
          { token: 'number', foreground: '#ffaa00' },
        ],
        colors: {},
      } as any);
      monaco.editor.setTheme('cyberpunk');
    }
  } catch (err) {
    // If Monaco is not available in the environment, fail silently.
    console.debug('Monaco setup skipped', err);
  }
}
