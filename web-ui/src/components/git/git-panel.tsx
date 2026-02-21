import React from 'react';

export type GitStatus = {
  modified: string[];
  added: string[];
  deleted: string[];
};

type Props = {
  status: GitStatus;
  onStage?: (path: string) => void;
  onCommit?: () => void;
  onPush?: () => void;
};

export const GitPanel: React.FC<Props> = ({ status, onStage, onCommit, onPush }) => {
  const all = [...status.modified, ...status.added, ...status.deleted];
  return (
    <div data-testid="git-panel" style={{ border: '1px solid #ccc', padding: 8 }}>
      <h3>Git Panel</h3>
      <div>
        <strong>Changes</strong>
        <ul>
          {status.modified.map((f) => (
            <li key={`m-${f}`}>{f} (modified)</li>
          ))}
          {status.added.map((f) => (
            <li key={`a-${f}`}>{f} (added)</li>
          ))}
          {status.deleted.map((f) => (
            <li key={`d-${f}`}>{f} (deleted)</li>
          ))}
        </ul>
      </div>
      <div>
        <button onClick={() => all.forEach((f) => onStage?.(f))} disabled={all.length === 0}>
          Stage all
        </button>
        <button onClick={onCommit} disabled={!onCommit} style={{ marginLeft: 8 }}>
          Commit
        </button>
        <button onClick={onPush} disabled={!onPush} style={{ marginLeft: 8 }}>
          Push
        </button>
      </div>
    </div>
  );
};

export default GitPanel;
