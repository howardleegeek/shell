// Simple AI-like commit message generator based on a diff-like input.
// This is a deterministic mock to support UI flows in tests.

export function generateAiCommitMessage(diffs: { file: string; diff: string }[]): string {
  if (!diffs || diffs.length === 0) {
    return 'AI: update';
  }
  const changes = diffs.map((d) => d.file).slice(0, 3).join(', ');
  return `AI: update ${changes}`;
}
