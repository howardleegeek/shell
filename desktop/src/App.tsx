import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

type View = 'project' | 'reports';

interface Report {
  ok: boolean;
  summary: string;
  chain?: string;
  runner?: string;
  network?: string;
  address?: string;
  txHash?: string;
  finishedAt?: string;
  command?: string;
}

function App() {
  const [activeView, setActiveView] = useState<View>('project');
  const [serverRunning, setServerRunning] = useState(false);
  const [chain, setChain] = useState<string>('evm');
  const [network, setNetwork] = useState<string>('sepolia');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const status = await invoke<boolean>('get_server_status');
      setServerRunning(status);
    } catch (e) {
      console.error('Failed to check server status:', e);
    }
  };

  const toggleServer = async () => {
    try {
      if (serverRunning) {
        await invoke('stop_opencode_server');
        setServerRunning(false);
      } else {
        await invoke<string>('start_opencode_server', { port: 4096 });
        setServerRunning(true);
      }
    } catch (e) {
      console.error('Server error:', e);
    }
  };

  const runShellAction = async (action: string) => {
    setLoading(true);
    try {
      await invoke('run_web3_command', {
        tool: 'shell-run',
        args: [action, '--chain', chain, '--network', network],
        cwd: null
      });
      // Refresh reports after action
      if (activeView === 'reports') {
        loadReports();
      }
    } catch (e) {
      console.error('Action error:', e);
    }
    setLoading(false);
  };

  const loadReports = async () => {
    // In production, this would read from reports/*.json via Tauri backend
    // For demo, show sample data
    setReports([
      { 
        ok: true, 
        summary: 'Test passed (4 passing, 1 failing)', 
        chain: 'evm', 
        runner: 'forge', 
        finishedAt: new Date().toISOString(),
        command: 'forge test'
      },
    ]);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Shell</h1>
        <span className="subtitle">Web3 Dev Studio</span>
        <div className="view-tabs">
          <button 
            className={activeView === 'project' ? 'active' : ''}
            onClick={() => setActiveView('project')}
          >
            Project
          </button>
          <button 
            className={activeView === 'reports' ? 'active' : ''}
            onClick={() => { setActiveView('reports'); loadReports(); }}
          >
            Reports
          </button>
        </div>
      </header>
      
      <main className="main">
        {activeView === 'project' ? (
          <div className="project-view">
            <div className="config-section">
              <div className="config-row">
                <label>Chain:</label>
                <select value={chain} onChange={e => setChain(e.target.value)}>
                  <option value="evm">EVM</option>
                  <option value="solana">Solana</option>
                </select>
              </div>
              <div className="config-row">
                <label>Network:</label>
                <select value={network} onChange={e => setNetwork(e.target.value)}>
                  {chain === 'solana' ? (
                    <>
                      <option value="devnet">Devnet</option>
                      <option value="testnet">Testnet</option>
                      <option value="mainnet">Mainnet</option>
                    </>
                  ) : (
                    <>
                      <option value="anvil">Anvil (Local)</option>
                      <option value="sepolia">Sepolia</option>
                      <option value="goerli">Goerli</option>
                      <option value="mainnet">Mainnet</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            
            <div className="action-grid">
              <button onClick={() => runShellAction('build')} disabled={loading}>
                <span className="icon">🔨</span>
                Build
              </button>
              <button onClick={() => runShellAction('test')} disabled={loading}>
                <span className="icon">🧪</span>
                Test
              </button>
              <button onClick={() => runShellAction('deploy')} disabled={loading}>
                <span className="icon">🚀</span>
                Deploy
              </button>
              <button onClick={() => runShellAction('audit')} disabled={loading}>
                <span className="icon">🔒</span>
                Audit
              </button>
            </div>
            
            <div className="server-status">
              <span>Server:</span>
              <button 
                className={`status-btn ${serverRunning ? 'running' : ''}`}
                onClick={toggleServer}
              >
                {serverRunning ? 'Running' : 'Stopped'}
              </button>
            </div>
          </div>
        ) : (
          <div className="reports-view">
            <h2>Reports</h2>
            {reports.length === 0 ? (
              <p className="empty">No reports yet. Run an action first.</p>
            ) : (
              <div className="reports-list">
                {reports.map((report, i) => (
                  <div key={i} className={`report-card ${report.ok ? 'success' : 'failure'}`}>
                    <span className="status">{report.ok ? '✅' : '❌'}</span>
                    <div className="report-info">
                      <span className="summary">{report.summary}</span>
                      <span className="meta">
                        {report.chain}/{report.runner}/{report.network || 'default'}
                        {report.finishedAt && ` • ${new Date(report.finishedAt).toLocaleTimeString()}`}
                      </span>
                      {report.address && (
                        <div className="deploy-info">
                          <span className="label">Address: </span>
                          <code className="address">{report.address}</code>
                          <button 
                            className="copy-btn"
                            onClick={() => navigator.clipboard.writeText(report.address || '')}
                          >
                            📋
                          </button>
                        </div>
                      )}
                      {report.txHash && (
                        <div className="deploy-info">
                          <span className="label">Tx: </span>
                          <code className="tx">{report.txHash.substring(0, 18)}...</code>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
