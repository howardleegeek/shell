import React from 'react';
import { ChainProvider } from './ChainContext';
import { TopBar } from './TopBar';

// Simple content area to demonstrate that the top bar controls state
export const App: React.FC = () => {
  return (
    <ChainProvider>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0d12' }}>
        <TopBar />
        <div
          style={{
            flex: 1,
            padding: 24,
            color: '#c9d1d9',
          }}
        >
          <p style={{ opacity: 0.8 }}>
            This panel demonstrates a top bar with SVM/EVM chain selector and dynamic network list.
          </p>
        </div>
      </div>
    </ChainProvider>
  );
};

export default App;
