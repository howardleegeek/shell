import React, { useEffect, useMemo, useState } from 'react';
import { GitStore, createSampleDiff } from '../../lib/git/git-operations';
import { DiffViewer } from './diff-viewer';
import { generateAiCommitMessage } from '../../lib/git/ai-commit-message';

export type GitStatus = {
  modified: string[];
  added: string[];
  deleted: string[];
};

type Props = {
  status?: GitStatus;
  onStage?: (path: string) => void;
  onCommit?: (message: string) => void;
  onPush?: () => void;
};

export const GitPanel: React.FC<Props> = ({ status: propStatus, onStage, onCommit, onPush }) => {
  // Local lightweight GitStore to simulate repository state for the IDE
  const [store] = useState(new GitStore());

  // Compute current status either from props or from internal store
  const currentStatus = useMemo(() => {
    if (propStatus) return propStatus;
    const s = store.getStatus();
    return {
      modified: s.modified,
      added: s.added,
      deleted: s.deleted,
    } as GitStatus;
  }, [propStatus, store]);

  // Diffs derived from the store's current state
  const diffs = useMemo(() => createSampleDiff(store as any), [store]);

  // Simple commit handler that uses an AI-like message generator when available
  const handleCommit = () => {
    const aiMessage = generateAiCommitMessage(diffs as any);
    // call the consumer if provided, otherwise commit locally via store mock
    if (onCommit) onCommit(aiMessage);
  };

  // Stage all files present in current status
  const stageAll = () => {
    const all = [...currentStatus.modified, ...currentStatus.added, ...currentStatus.deleted];
    all.forEach((f) => onStage?.(f));
  };

  return (
    <div data-testid="git-panel" style={{ border: '1px solid #ccc', padding: 8 }}>
      <h3>Git Panel</h3>
      <div>
        <strong>Changes</strong>
        <ul>
          {currentStatus.modified.map((f) => (
            <li key={`m-${f}`}>{f} (modified)</li>
          ))}
          {currentStatus.added.map((f) => (
            <li key={`a-${f}`}>{f} (added)</li>
          ))}
          {currentStatus.deleted.map((f) => (
            <li key={`d-${f}`}>{f} (deleted)</li>
          ))}
        </ul>
      </div>
      <DiffViewer diffs={diffs.map((d) => ({ file: d.file, diff: d.diff }))} />
      <div>
        <button onClick={stageAll} disabled={currentStatus.modified.length === 0 && currentStatus.added.length === 0 && currentStatus.deleted.length === 0}>
          Stage all
        </button>
        <button onClick={handleCommit} disabled={false} style={{ marginLeft: 8 }}>
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
