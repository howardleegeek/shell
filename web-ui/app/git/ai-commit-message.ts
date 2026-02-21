// Import from gitActions API facade
import { aiCommitMessage } from './gitActions';

import { status } from './gitMock';

export function aiCommitMessage(): string {
  // Simple heuristic: summarize number of staged changes
  // We intentionally avoid importing gitMock here to keep this module
  // reusable and easily unit-tested in isolation.
  // If getStatus() returns an array of { path, status }, we filter out
  // unchanged entries.
  // Note: In the test environment, getStatus() is deterministic due to the
  // in-memory mock used by tests.
  const changes = (status() as Array<{ path: string; status: string }>).filter(
    (f) => f.status !== 'unchanged'
  );
  const n = changes.length;
  if (n === 0) return 'chore: update';
  const names = changes.map((c) => c.path.split('/').pop()).join(', ');
  return `feat(models): commit ${n} file(s) - ${names}`;
}

export default aiCommitMessage;
