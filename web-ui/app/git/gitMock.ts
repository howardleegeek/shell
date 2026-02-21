// Lightweight in-memory Git mock for testing the IDE Git panel.
// This is intentionally simple and without external dependencies.

type FileStatus = 'added' | 'modified' | 'deleted' | 'unchanged';

type GitFile = {
  path: string;
  content: string;
  status: FileStatus;
};

class InMemoryGit {
  private files: Map<string, GitFile> = new Map();
  private staged: Set<string> = new Set();
  private commits: Array<{ message: string; timestamp: number; files: string[] }> = [];

  addFile(path: string, content: string): void {
    this.files.set(path, { path, content, status: 'added' });
    this.staged.add(path);
  }

  modifyFile(path: string, content: string): void {
    const exists = this.files.has(path);
    if (!exists) {
      // Treat as a new file if it doesn't exist yet
      this.addFile(path, content);
      return;
    }
    const existing = this.files.get(path)!;
    // Update content and mark as modified
    this.files.set(path, { path, content, status: 'modified' });
    this.staged.add(path);
  }

  deleteFile(path: string): void {
    const exists = this.files.has(path);
    if (exists) {
      const existing = this.files.get(path)!;
      this.files.set(path, { path, content: existing.content, status: 'deleted' });
    } else {
      // If it doesn't exist, still track a deletion for consistency
      this.files.set(path, { path, content: '', status: 'deleted' });
    }
    this.staged.add(path);
  }

  // Public API for testing and UI wiring
  stage(path: string): void {
    if (!this.files.has(path)) {
      // If file isn't tracked yet, create a placeholder staged entry
      this.files.set(path, { path, content: '', status: 'added' });
    }
    this.staged.add(path);
  }

  unstage(path: string): void {
    this.staged.delete(path);
  }

  status(): Array<{ path: string; status: FileStatus }> {
    const res: Array<{ path: string; status: FileStatus }> = [];
    for (const [p, f] of this.files.entries()) {
      if (f.status !== 'unchanged') {
        res.push({ path: p, status: f.status });
      }
    }
    // sort for deterministic tests
    res.sort((a, b) => a.path.localeCompare(b.path));
    return res;
  }

  isStaged(path: string): boolean {
    return this.staged.has(path);
  }

  diff(path: string): string {
    const f = this.files.get(path);
    if (!f) return '';
    // Simple synthetic diff for testing purposes
    const old = '';
    return `diff -- ${path}\n--- a/${path}\n+++ b/${path}\n@@
  }

  commit(message: string): boolean {
    const toCommit = Array.from(this.staged);
    if (toCommit.length === 0) return false;
    this.commits.push({ message, timestamp: Date.now(), files: toCommit });
    // Mark committed files as unchanged
    for (const p of toCommit) {
      const f = this.files.get(p);
      if (f) f.status = 'unchanged';
    }
    this.staged.clear();
    return true;
  }

  getCommits(): Array<{ message: string; timestamp: number; files: string[] }> {
    return this.commits;
  }

  push(): boolean { return true; }
  pull(): boolean { return true; }

  reset(): void {
    this.staged.clear();
    // Reset all file statuses to unchanged
    for (const f of this.files.values()) {
      f.status = 'unchanged';
    }
  }
}

// Singleton instance to be used by UI/tests
export const inMemoryGit = new InMemoryGit();

export function addFile(path: string, content: string): void {
  inMemoryGit.addFile(path, content);
}

export function modifyFile(path: string, content: string): void {
  inMemoryGit.modifyFile(path, content);
}

export function deleteFile(path: string): void {
  inMemoryGit.deleteFile(path);
}

export function status(): Array<{ path: string; status: string }> {
  return inMemoryGit.status();
}

export function stageFile(path: string): void {
  inMemoryGit.stage(path);
}

export function unstageFile(path: string): void {
  inMemoryGit.unstage(path);
}

export function isStaged(path: string): boolean {
  return inMemoryGit.isStaged(path);
}

export function diff(path: string): string {
  return inMemoryGit.diff(path);
}

export function commit(message: string): boolean {
  return inMemoryGit.commit(message);
}

export function commits(): Array<{ message: string; timestamp: number; files: string[] }> {
  return inMemoryGit.getCommits();
}

export function resetGit(): void {
  inMemoryGit.reset();
}
