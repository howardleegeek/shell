import {
  status,
  stageFile,
  unstageFile,
  isStaged,
  diff,
  commit,
  commits,
  resetGit,
} from './gitMock';

// Expose a small API for the UI to orchestrate git-like interactions

export function getStatus() {
  return status();
}

export function stage(path: string) {
  stageFile(path);
}

export function unstage(path: string) {
  unstageFile(path);
}

export function isPathStaged(path: string): boolean {
  return isStaged(path);
}

export function getDiff(path: string) {
  return diff(path);
}

export function aiCommitMessage(): string {
  // Simple heuristic: summarize number of staged changes
  const changes = getStatus().filter((f: any) => f.status !== 'unchanged');
  const n = changes.length;
  if (n === 0) return 'chore: update';
  const names = changes.map((c: any) => c.path.split('/').pop()).join(', ');
  return `feat(models): commit ${n} file(s) - ${names}`;
}

export function commitWithAI(): boolean {
  const msg = aiCommitMessage();
  return commit(msg);
}

export function commitMessage(message: string): boolean {
  return commit(message);
}

export function getCommits() {
  return commits();
}

export function reset() {
  resetGit();
}
