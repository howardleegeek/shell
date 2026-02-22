// Lightweight AI inline completion stub for editor UI.
// This is intentionally small and dependency-free to fit the repo task scope.
// It simulates a ghost-text suggestion after a short delay.

export type GhostResult = {
  ghostText: string
  language?: string
}

/**
 * Produce a ghost text suggestion based on the current source and cursor.
 * This is a deterministic, test-friendly mock of an AI completion.
 * @param source - current editor content
 * @param cursor - cursor index in the source string (0-based)
 * @param options - optional hints like language and delay (ms)
 */
export async function ghostCompletion(
  source: string,
  cursor: number,
  options?: { language?: string; delayMs?: number }
): Promise<GhostResult> {
  const delay = typeof options?.delayMs === 'number' ? options.delayMs : 500
  const lang = options?.language

  // Basic context extraction: last word before cursor
  const before = source.slice(0, Math.max(0, cursor))
  const words = before.split(/\s+/)
  const lastWord = words[words.length - 1] || ''
  const contextSnippet = before.trim().split(/\s+/).slice(-3).join(' ')

  // Simple heuristic-based ghost text generation
  let ghost = ''
  if (lang === 'solidity') {
    // Solidity-friendly hints
    if (/\bcontract\s+\w*$/.test(before)) {
      ghost = '// OpenZeppelin skeleton: contract MyContract is ERC721 { }'
    } else if (/\bfunction\s*\w*$/.test(before)) {
      ghost = ' function newFunction() { /* implementation */ }'
    }
  } else if (lang === 'rust' || lang === 'anchor') {
    ghost = '// Anchor/Rust helper: add accounts and macro usage'
  }

  // Fallback generic suggestions
  if (!ghost) {
    if (lastWord) {
      ghost = `// AI suggestion based on '${lastWord}': ${lastWord}_suggestion`
    } else if (contextSnippet) {
      ghost = `// AI: ${contextSnippet}_suggestion`
    } else {
      ghost = '// AI: start typing to get suggestions'
    }
  }

  // Simulate delay for inline completion trigger after typing pause
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, delay)))
  return { ghostText: ghost, language: lang }
}

export default ghostCompletion
