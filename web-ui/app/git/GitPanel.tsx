import React, { useEffect, useState } from 'react';
// Use the new git-operations API facade
import { getStatus, stage, unstage, commitWithAI } from '../lib/git/git-operations';

type FileItem = { path: string; status: string };

export const GitPanel: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);

  const refresh = () => {
    // getStatus returns array of { path, status }
    const s = getStatus() as FileItem[];
    setFiles(s || []);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onStage = (path: string) => {
    stage(path);
    refresh();
  };

  const onUnstage = (path: string) => {
    unstage(path);
    refresh();
  };

  const onCommit = () => {
    // AI-driven commit message
    const ok = commitWithAI();
    // In a real app we'd show feedback; here we simply refresh status
    refresh();
  };

  return (
    <div data-testid="git-panel" aria-label="Git Panel">
      <h3>Git Panel</h3>
      <ul>
        {files.map((f) => (
          <li key={f.path}>
            <span>{f.path}</span> - <em>{f.status}</em>
            <button onClick={() => onStage(f.path)} style={{ marginLeft: 8 }}>Stage</button>
            <button onClick={() => onUnstage(f.path)} style={{ marginLeft: 4 }}>Unstage</button>
          </li>
        ))}
      </ul>
      <button onClick={onCommit} disabled={files.length === 0}>Commit</button>
    </div>
  );
};

export default GitPanel;
