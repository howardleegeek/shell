import React from 'react';

// Tauri Desktop shell embedding bolt.diy web-ui via iframe (Scheme C)
const App: React.FC = () => {
  // In development, load the web-ui from the dev server.
  // In production, load the prebuilt web-ui from the dist bundle.
  const isDev = (import.meta as any).env?.DEV ?? false;
  const iframeSrc = isDev ? 'http://localhost:5173' : './index.html';

  return (
    <div style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
      <iframe
        src={iframeSrc}
        title="Bolt DIY Web UI"
        style={{ width: '100%', height: '100%', border: 'none' }}
        // Allow necessary capabilities for the embedded web UI
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
};

export default App;
