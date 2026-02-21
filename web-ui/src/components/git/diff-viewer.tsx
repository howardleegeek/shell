import React from 'react';

type Props = {
  diffs: { file: string; diff: string }[];
};

export const DiffViewer: React.FC<Props> = ({ diffs }) => {
  return (
    <div data-testid="diff-viewer" style={{ border: '1px solid #ddd', padding: 8 }}>
      <h4>Diffs</h4>
      {diffs.length === 0 ? (
        <div>No diffs</div>
      ) : (
        <div>
          {diffs.map((d) => (
            <div key={d.file} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 'bold' }}>{d.file}</div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{d.diff}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiffViewer;
