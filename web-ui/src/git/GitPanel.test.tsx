import { describe, it, expect } from 'vitest'
import { InMemoryGit } from './gitMock'

describe('InMemoryGit basic flows', () => {
  it('adds a file, stages, and commits', () => {
    const git = new InMemoryGit()
    git.addFile('a.txt', 'hello')
    git.stageFile('a.txt')
    const commit = git.commit('add a.txt')
    expect(commit).toBeDefined()
    const last = git.getLastCommit()
    expect(last).not.toBeNull()
    expect(commit.id).toBe(last!.id)
    expect(last!.tree.get('a.txt')).toBe('hello')
  })

  it('modifies a file and commits', () => {
    const git = new InMemoryGit({ 'a.txt': 'hello' })
    // first commit
    git.stageFile('a.txt')
    git.commit('initial')
    // modify
    git.modifyFile('a.txt', 'hello world')
    git.stageFile('a.txt')
    const c = git.commit('update a.txt')
    expect(c).toBeDefined()
    const last = git.getLastCommit()
    expect(last?.tree.get('a.txt')).toBe('hello world')
  })
})
