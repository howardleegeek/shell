import { InMemoryGit } from './gitMock'

// Lightweight action helpers that wrap the InMemoryGit API
export function stagePath(repo: InMemoryGit, path: string): void {
  repo.stageFile(path)
}

export function stageAll(repo: InMemoryGit): void {
  repo.stageAll()
}

export function commitRepo(repo: InMemoryGit, message?: string): { id: string; message: string; timestamp: number } | null {
  const msg = message ?? 'AI-generated commit'
  const commit = repo.commit(msg)
  return { id: commit.id, message: commit.message, timestamp: commit.timestamp }
}

export function getChanged(repo: InMemoryGit) {
  return repo.getChangedFiles()
}
