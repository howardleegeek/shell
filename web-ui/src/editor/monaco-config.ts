// Minimal Monaco languages registration for Rust, Solidity, and TOML
// and a cyberpunk theme. This is designed to be lightweight and avoid
// external LSP servers as per constraints.

type Monaco = any

function registerMonacoLanguages(monaco: Monaco) {
  // Helper to safely register a language if not already present
  const hasLang = (id: string) => (monaco?.languages?.getLanguages?.() || []).some((l: any) => l?.id === id)

  // Rust
  if (!hasLang('rust')) {
    try {
      monaco.languages.register({ id: 'rust', extensions: ['.rs'], aliases: ['Rust'] })
      monaco.languages.setMonarchTokensProvider('rust', {
        tokenizer: {
          root: [
            // keywords (basic subset)
            [/[a-zA-Z_]\w*/, {
              cases: {
                '@keywords': 'keyword',
                '@default': 'identifier',
              },
            }],
            [/\/\*/, 'comment', '@comment'],
            [/\/\/.*$/, 'comment'],
            [/"([^"\\]|\\.)*"/, 'string'],
            [/\d+(?:\.\d+)?/, 'number'],
          ],
          comment: [/[\s\S]*?\*\//, 'comment', '@pop'],
        },
        keywords: ['fn','let','mut','pub','enum','struct','impl','trait','use','mod','return','if','else','match','loop','while','for','in'],
      })
    } catch (e) {
      // no-op if runtime environment cannot register
      // eslint-disable-next-line no-console
      console.warn('[monaco-config] could not register rust', e)
    }
  }

  // Solidity (custom minimal tokenizer)
  if (!hasLang('solidity')) {
    try {
      monaco.languages.register({ id: 'solidity', extensions: ['.sol'], aliases: ['Solidity'] })
      monaco.languages.setMonarchTokensProvider('solidity', {
        keywords: ['pragma','contract','function','mapping','uint256','address','modifier','event','emit','require','payable','view','pure','external','internal','public','private'],
        tokenizer: {
          root: [
            [/[A-Za-z_]\w*/, {
              cases: {
                '@keywords': 'keyword',
                '@default': 'identifier',
              },
            }],
            [/\/\*/, 'comment', '@comment'],
            [/\/\/.*$/, 'comment'],
            [/"([^"\\]|\\.)*"/, 'string'],
            [/\d+/, 'number'],
            [/[{()}\[\];,]/, 'delimiter'],
          ],
          comment: [/[\s\S]*?\*\//, 'comment', '@pop'],
        },
      })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[monaco-config] could not register solidity', e)
    }
  }

  // TOML
  if (!hasLang('toml')) {
    try {
      monaco.languages.register({ id: 'toml', extensions: ['.toml'], aliases: ['TOML'] })
      monaco.languages.setMonarchTokensProvider('toml', {
        tokenizer: {
          root: [
            [/^[A-Za-z_][A-Za-z0-9_]*\s*=.*/, 'string'],
            [/(?:^|\s)#.*$/, 'comment'],
            [/"([^"\\]|\\.)*"/, 'string'],
            [/\d+/, 'number'],
            [/=/, 'operator'],
          ],
        },
      })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[monaco-config] could not register toml', e)
    }
  }

  // Cyberpunk theme
  if (!monaco.editor?.getTheme?.('cyberpunk')) {
    monaco.editor.defineTheme('cyberpunk', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '#b84dff' }, // purple
        { token: 'string', foreground: '#00ff88' },  // green
        { token: 'comment', foreground: '#666666' }, // gray
        { token: 'type', foreground: '#4dc9f6' },    // blue
        { token: 'number', foreground: '#ffaa00' },  // orange
      ],
    })
  }
  // Apply theme by default if editor instance exists
  try {
    monaco.editor.setTheme('cyberpunk')
  } catch (e) {
    // ignore if editor not yet initialized
  }
}

export default registerMonacoLanguages
