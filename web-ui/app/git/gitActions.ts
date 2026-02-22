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

// Expose in-memory git actions so the UI can orchestrate operations
import { inMemoryGit } from './gitMock';

// AI commit message logic moved to dedicated module for better testability
import { aiCommitMessage } from './ai-commit-message';

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

export function aiCommitMessageProxy(): string {
  // Delegate to the dedicated AI message module
  return aiCommitMessage();
}

export function commitWithAI(): boolean {
  const msg = aiCommitMessageProxy();
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

// Push a local commit to the remote (simulated in-memory push)
export function push(): boolean {
  return inMemoryGit.push();
}

// Pull remote changes into the local working copy (simulated)
export function pull(): boolean {
  return inMemoryGit.pull();
}
