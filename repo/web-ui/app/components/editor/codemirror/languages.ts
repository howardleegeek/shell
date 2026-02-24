import { autocompletion, type Completion } from '@codemirror/autocomplete';
import { type Extension } from '@codemirror/state';
import { Extension as _Ext } from '@codemirror/state';

// Simple OpenZeppelin Solidity autocomplete surface
// This is a lightweight, language-agnostic hint provider intended to
// enhance the Solidity editing experience inside CodeMirror without
// introducing a full Solidity parser or language server.

type OZItem = {
  label: string;
  type?: string;
};

const OZ_SUGGESTIONS: OZItem[] = [
  { label: 'Ownable', type: 'class' },
  { label: 'IERC20', type: 'interface' },
  { label: 'IERC20Metadata', type: 'interface' },
  { label: 'IERC721', type: 'interface' },
  { label: 'IERC721Metadata', type: 'interface' },
  { label: 'ERC20', type: 'class' },
  { label: 'ERC721', type: 'class' },
  { label: 'Pausable', type: 'class' },
  { label: 'ReentrancyGuard', type: 'class' },
  { label: 'SafeERC20', type: 'class' },
  { label: 'IERC1155', type: 'interface' },
];

// Compute completion results based on the current token prefix
const solidityCompletionSource = (ctx: { state: any; pos: number; matchBefore: (re: RegExp) => { text: string; from: number } | null; }): any => {
  // Try to find the current word before the cursor
  const word = ctx.matchBefore(/\w*$/);
  if (!word) return null;
  const prefix = word.text;
  if (!prefix) return null;

  const options = OZ_SUGGESTIONS.filter((s) => s.label.toLowerCase().startsWith(prefix.toLowerCase())).map((s) => ({ label: s.label, type: s.type }));
  if (!options.length) return null;
  return {
    from: word.from,
    to: ctx.pos,
    options,
  } as { from: number; to: number; options: Completion[] };
};

// A small, extension-friendly Autocomplete surface that plugs into CodeMirror's
// autocompletion system. We expose it as a function to match the repository's
// dynamic language loading style (see getLanguage below).
const solidityAutocomplete = autocompletion({ override: [solidityCompletionSource as any] });

// Exported language extension (kept minimal on purpose)
export const solidityLanguageExtension: Extension = [solidityAutocomplete];

// Public API used by getLanguage: decide whether to enable Solidity tooling
export function getLanguage(_filePath: string): Promise<Extension | null> {
  // Enable Solidity autocomplete for files ending with .sol
  if (_filePath?.toLowerCase().endsWith('.sol')) {
    return Promise.resolve(solidityLanguageExtension);
  }
  // No special language support for other files
  return Promise.resolve(null);
}
