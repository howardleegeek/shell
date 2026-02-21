import React from 'react';

type DiffViewerProps = {
  beforeCode: string;
  afterCode: string;
  filename: string;
  language?: string;
};

// Lightweight diff viewer for IDE integration tests
const DiffViewer: React.FC<DiffViewerProps> = ({ beforeCode, afterCode, filename, language }) => {
  return (
    <div className="git-diff-viewer" data-filename={filename}>
      <h4 style={{ margin: '8px 0' }}>{filename}{language ? ` • ${language}` : ''}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Before</div>
          <pre style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4, height: '240px', overflow: 'auto' }}>
{beforeCode}
          </pre>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>After</div>
          <pre style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4, height: '240px', overflow: 'auto' }}>
{afterCode}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;
