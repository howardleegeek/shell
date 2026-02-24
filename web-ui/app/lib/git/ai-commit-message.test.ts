import { describe, it, expect, beforeEach } from 'vitest';
import { resetGit, addFile, modifyFile, status } from '../../git/gitMock';
import { aiCommitMessage } from './ai-commit-message';

describe('AI Commit Message Generator', () => {
  beforeEach(() => {
    resetGit();
  });

  it('generates a chore message when no changes', () => {
    const msg = aiCommitMessage();
    expect(msg).toBe('chore: update');
  });

  it('generates a feature message for added files', () => {
    addFile('src/a.ts', 'export const a = 1;');
    const msg = aiCommitMessage();
    expect(msg).toBe('feat(models): commit 1 file(s) - a.ts');
  });

  it('includes multiple files in the message', () => {
    addFile('src/a.ts', 'export const a = 1;');
    modifyFile('src/b.ts', 'export const b = 2;');
    const msg = aiCommitMessage();
    // order is sorted by path due to status() sorting
    expect(msg).toBe('feat(models): commit 2 file(s) - a.ts, b.ts');
  });
});
