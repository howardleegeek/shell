import React, { useEffect, useState } from 'react'
import InMemoryGit, { Commit } from './gitMock'

type GitPanelProps = {
  repo: InMemoryGit
}

const GitPanel: React.FC<GitPanelProps> = ({ repo }) => {
  const [changes, setChanges] = useState<Array<{ path: string; status: string }>>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [commitMsg, setCommitMsg] = useState<string>('')

  const refresh = () => {
    const list = repo.getChangedFiles()
    setChanges(list.map(i => ({ path: i.path, status: i.status }))
    )
  }

  useEffect(() => {
    refresh()
  }, [repo])

  const stage = (path: string) => {
    repo.stageFile(path)
    refresh()
  }

  const stageAll = () => {
    repo.stageAll()
    refresh()
  }

  const commit = () => {
    const m = commitMsg || 'AI-generated commit'
    repo.commit(m)
    setCommitMsg('')
    refresh()
  }

  const lastCommit: Commit | null = repo.getLastCommit()

  return (
    <div className="git-panel" style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Git Panel</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>Changes</div>
          {changes.length === 0 ? (
            <div style={{ opacity: 0.6 }}>No changes</div>
          ) : (
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              {changes.map(item => (
                <li key={item.path} style={{ marginBottom: 6 }}>
                  <span style={{ cursor: 'pointer' }} onClick={() => setSelected(item.path)}>
                    {item.path}
                  </span>
                  <span style={{ marginLeft: 8, color: '#666' }}>({item.status})</span>
                  <button style={{ marginLeft: 8 }} onClick={() => stage(item.path)}>Stage</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ width: 1, background: '#eee' }} />
        <div style={{ width: 320 }}>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>AI Commit</div>
          <input
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            placeholder={lastCommit ? `Last: ${lastCommit.message}` : 'Describe changes'}
            style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box' }}
          />
          <button onClick={commit} style={{ marginTop: 6 }}>Commit</button>
          <div style={{ marginTop: 12 }}>
            <button onClick={stageAll}>Stage All</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GitPanel
export { Commit }
