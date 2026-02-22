// Lightweight in-memory Git mock for IDE integration tests
// Provides basic copy of a working tree, staging, and commits without external dependencies.

export type ChangeStatus = 'added' | 'modified' | 'deleted'

export interface Commit {
  id: string
  message: string
  timestamp: number
  tree: Map<string, string>
}

export class InMemoryGit {
  // Current working copy (files user edits)
  private files: Map<string, string> = new Map()
  // Last committed tree
  private lastCommitted: Map<string, string> = new Map()
  // Staged changes: path -> content, or null for deletions
  private staged: Map<string, string | null> = new Map()
  private commits: Commit[] = []

  constructor(initial?: Record<string, string>) {
    if (initial) {
      Object.entries(initial).forEach(([path, content]) => {
        this.files.set(path, content)
      })
    }
  }

  // Working copy mutations
  addFile(path: string, content: string): void {
    this.files.set(path, content)
  }
  modifyFile(path: string, content: string): void {
    // allow creating new file via modify as a convenience
    this.files.set(path, content)
  }
  deleteFile(path: string): void {
    this.files.delete(path)
  }

  // Staging operations
  stageFile(path: string): void {
    if (this.files.has(path)) {
      const c = this.files.get(path)!
      this.staged.set(path, c)
      return
    }
    if (this.lastCommitted.has(path)) {
      // staged deletion
      this.staged.set(path, null)
      return
    }
    throw new Error(`Path not found in working copy or last commit: ${path}`)
  }
  stageAll(): void {
    // Stage all current files
    this.files.forEach((content, path) => {
      this.staged.set(path, content)
    })
    // Also stage deletions for paths present in last commit but absent now
    this.lastCommitted.forEach((_v, path) => {
      if (!this.files.has(path)) {
        this.staged.set(path, null)
      }
    })
  }
  unstageFile(path: string): void {
    this.staged.delete(path)
  }

  // Query staged changes (low fidelity diff)
  getChangedFiles(): Array<{ path: string; status: ChangeStatus }> {
    const result: Array<{ path: string; status: ChangeStatus }> = []
    for (const [path, content] of this.staged.entries()) {
      if (content === null) {
        result.push({ path, status: 'deleted' })
      } else if (!this.lastCommitted.has(path)) {
        result.push({ path, status: 'added' })
      } else {
        const last = this.lastCommitted.get(path)
        if (last !== content) {
          result.push({ path, status: 'modified' })
        }
      }
    }
    return result
  }

  // Commit changes from staging into a new commit
  commit(message: string): Commit {
    const timestamp = Date.now()
    // Apply staged changes to lastCommitted
    for (const [path, content] of this.staged.entries()) {
      if (content === null) {
        this.lastCommitted.delete(path)
      } else {
        this.lastCommitted.set(path, content)
      }
    }
    const tree = new Map<string, string>(this.lastCommitted)
    const id = Math.random().toString(36).slice(2, 9)
    const commit: Commit = { id, message, timestamp, tree }
    this.commits.push(commit)
    this.staged.clear()
    return commit
  }

  // Helpers for tests
  getLastCommit(): Commit | null {
    if (this.commits.length === 0) return null
    return this.commits[this.commits.length - 1]
  }
  getCommits(): Commit[] {
    return [...this.commits]
  }
}

export default InMemoryGit
