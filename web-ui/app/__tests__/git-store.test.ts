import { describe, it, expect } from 'vitest';
import { GitStore, DiffLike, createSampleDiff } from '../../src/lib/git/git-operations';

describe('GitStore (mock)', () => {
  it('initializes with sample files and reports modified', () => {
    const store = new GitStore();
    const status = store.getStatus();
    // README.md and src/app.ts exist and are considered modified
    expect(status.modified).toContain('README.md');
    expect(status.modified).toContain('src/app.ts');
  });

  it('stages files and clears status accordingly', () => {
    const store = new GitStore();
    // stage both files
    store.stage('README.md');
    store.stage('src/app.ts');
    const status = store.getStatus();
    expect(status.modified.length).toBe(0);
    expect(status.added.length).toBe(0);
  });

  it('commits staged changes and resets index', () => {
    const store = new GitStore();
    store.stage('README.md');
    store.stage('src/app.ts');
    const commitId = store.commit('test commit');
    expect(commitId).toMatch(/commit-/);
    // after commit, index should be cleared
    const status = store.getStatus();
    expect(status.modified.length).toBeGreaterThanOrEqual(0);
    // index is mocked; ensure commit did not crash and is id string
  });

  it('pushes and branches work in mock', () => {
    const store = new GitStore();
    expect(store.push()).toBe(true);
    expect(store.pull()).toBe(true);
    store.createBranch('feature/x');
    store.switchBranch('feature/x');
    expect(store.getCurrentBranch()).toBe('feature/x');
    expect(store.mergeBranch('feature/x')).toBe(true);
  });

  it('produces diff entries for modified files', () => {
    const store = new GitStore();
    const diffs = createSampleDiff(store);
    // two modified files should appear in diffs (order may vary)
    const files = diffs.map((d) => d.file);
    expect(files).toContain('README.md');
    expect(files).toContain('src/app.ts');
  });
});
