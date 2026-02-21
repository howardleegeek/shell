import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetGit,
  addFile,
  modifyFile,
  deleteFile,
  status,
  stageFile,
  unstageFile,
  commit,
  commits,
  diff,
} from './gitMock';

describe('In-memory Git mock', () => {
  beforeEach(() => {
    resetGit();
  });

  it('tracks added files and commits', () => {
    addFile('README.md', '# Project');
    // status should show the added file
    const st1 = status();
    expect(st1).toEqual([{ path: 'README.md', status: 'added' }]);

    // commit should succeed and clear status
    const ok = commit('Initial commit');
    expect(ok).toBe(true);
    const commitsList = commits();
    expect(commitsList.length).toBe(1);
    const st2 = status();
    expect(st2.length).toBe(0);
  });

  it('handles modification and diff', () => {
    addFile('src/index.ts', 'export const a=1;');
    commit('Add index');
    modifyFile('src/index.ts', 'export const a=2;');
    const st = status();
    expect(st).toEqual([{ path: 'src/index.ts', status: 'modified' }]);
    const d = diff('src/index.ts');
    expect(typeof d).toBe('string');
  });
});
