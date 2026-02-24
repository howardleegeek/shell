// Lightweight in-memory Git operations facade for the IDE.
// This is a minimal, mockable implementation to satisfy tests and UI wiring.

export type FileStatus = 'modified' | 'added' | 'deleted' | 'untracked';

export type StatusSummary = {
  modified: string[];
  added: string[];
  deleted: string[];
};

export class GitStore {
  private currentBranch: string = 'main';
  private working: Map<string, string> = new Map(); // working directory contents
  private index: Map<string, string> = new Map(); // staged/indexed contents
  private commits: string[] = [];
  private branches: Set<string> = new Set(['main']);

  constructor() {
    // seed with some sample files
    this.working.set('README.md', '# Project\nThis is a sample repository.');
    this.working.set('src/app.ts', 'export const x = 1;');
    // index initially empty
  }

  getStatus(): StatusSummary {
    const modified: string[] = [];
    const added: string[] = [];
    const deleted: string[] = [];

    // naive delta: any key present in working but not in index is considered modified/added
    for (const [path, val] of this.working.entries()) {
      const inIndex = this.index.has(path);
      if (!inIndex) {
        // If it's new, treat as modified/added depending on extension
        if (path.endsWith('.md') || path.endsWith('.ts')) {
          modified.push(path);
        } else {
          added.push(path);
        }
      }
    }

    // Deleted: in index but not in working
    for (const path of this.index.keys()) {
      if (!this.working.has(path)) {
        deleted.push(path);
      }
    }

    return {
      modified,
      added,
      deleted,
    };
  }

  stage(filePath: string): boolean {
    if (!this.working.has(filePath)) return false;
    const content = this.working.get(filePath)!;
    this.index.set(filePath, content);
    return true;
  }

  unstage(filePath: string): boolean {
    return this.index.delete(filePath);
  }

  commit(message: string, author?: string): string {
    // ensure we have staged changes; in this mock, any staged entry counts as commit
    if (this.index.size === 0) {
      // allow idempotent commits with no changes
      const id = `noop-${Date.now()}`;
      this.commits.push(id);
      return id;
    }
    const id = `commit-${Date.now()}`;
    this.commits.push(id);
    // clear index as if changes were committed
    this.index.clear();
    return id;
  }

  push(): boolean {
    // In a real app we'd push to remote. Here we simulate success.
    return true;
  }

  pull(): boolean {
    // Simulate a pull that doesn't change local state in this mock
    return true;
  }

  createBranch(name: string): boolean {
    this.branches.add(name);
    return true;
  }

  switchBranch(name: string): boolean {
    if (!this.branches.has(name)) return false;
    this.currentBranch = name;
    return true;
  }

  mergeBranch(name: string): boolean {
    // naive merge: success if branch exists
    return this.branches.has(name);
  }

  getCurrentBranch(): string {
    return this.currentBranch;
  }
}

export type DiffLike = {
  file: string;
  diff: string;
};

export function createSampleDiff(store: GitStore): DiffLike[] {
  // Produce a tiny diff-like array representing staged vs working
  const status = store.getStatus();
  const lines: DiffLike[] = [];
  status.modified.forEach((f) => lines.push({ file: f, diff: `- old ${f}\n+ new ${f}` }));
  status.added.forEach((f) => lines.push({ file: f, diff: `+ added ${f}` }));
  status.deleted.forEach((f) => lines.push({ file: f, diff: `- ${f}` }));
  return lines;
}
