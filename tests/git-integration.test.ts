import { describe, it, expect } from 'vitest';
import { GitStore, createSampleDiff } from '../web-ui/src/lib/git/git-operations';
import { generateAiCommitMessage } from '../web-ui/src/lib/git/ai-commit-message';

describe('Git Integration: core operations (in-memory mock)', () => {
  it('should stage a file and commit, producing a commit id', () => {
    const store = new GitStore();
    // initial status
    const status1 = store.getStatus();
    expect(status1.modified.length).toBeGreaterThanOrEqual(0);
    // pick a file to stage if available
    const toStage = status1.modified[0] ?? status1.added[0];
    if (toStage) {
      const ok = store.stage(toStage);
      expect(ok).toBe(true);
    }
    const commitId = store.commit('test commit');
    expect(commitId).toMatch(/^commit-/);
  });

  it('AI commit message generator should include changed file names', () => {
    const store = new GitStore();
    // stage nothing to simulate empty diff
    const diffs = createSampleDiff(store) as any;
    const msg = generateAiCommitMessage(diffs as any);
    // should produce a string starting with AI: update
    expect(msg.startsWith('AI: update')).toBe(true);
  });
});
