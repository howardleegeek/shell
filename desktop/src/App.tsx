import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

function App() {
  const [serverRunning, setServerRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [command, setCommand] = useState('');

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
        setOutput(prev => [...prev, 'Server stopped']);
      } else {
        const result = await invoke<string>('start_opencode_server', { port: 4096 });
        setServerRunning(true);
        setOutput(prev => [...prev, result]);
      }
    } catch (e) {
      setOutput(prev => [...prev, `Error: ${e}`]);
    }
  };

  const runCommand = async () => {
    if (!command.trim()) return;
    
    const parts = command.split(' ');
    const tool = parts[0];
    const args = parts.slice(1);
    
    try {
      const result = await invoke<{
        success: boolean;
        stdout: string;
        stderr: string;
        exit_code: number;
      }>('run_web3_command', { tool, args, cwd: null });
      
      setOutput(prev => [
        ...prev,
        `$ ${command}`,
        result.stdout || result.stderr,
        `Exit code: ${result.exit_code}`,
        '---'
      ]);
    } catch (e) {
      setOutput(prev => [...prev, `Error: ${e}`]);
    }
    
    setCommand('');
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Shell</h1>
        <span className="subtitle">Web3 Dev Studio</span>
        <button 
          className={`server-btn ${serverRunning ? 'running' : ''}`}
          onClick={toggleServer}
        >
          {serverRunning ? '🟢 Server Running' : '🔴 Start Server'}
        </button>
      </header>
      
      <main className="main">
        <div className="sidebar">
          <h3>Quick Actions</h3>
          <button onClick={() => setCommand('forge test')}>Run Forge Tests</button>
          <button onClick={() => setCommand('forge build')}>Build Contracts</button>
          <button onClick={() => setCommand('anchor test')}>Run Anchor Tests</button>
          <button onClick={() => setCommand('slither .')}>Run Security Audit</button>
          
          <h3>Templates</h3>
          <button onClick={() => setCommand('git clone https://github.com/Shell-Templates/erc20')}>
            New ERC20
          </button>
          <button onClick={() => setCommand('git clone https://github.com/Shell-Templates/nft')}>
            New NFT
          </button>
        </div>
        
        <div className="content">
          <div className="terminal">
            <div className="terminal-output">
              {output.length === 0 ? (
                <span className="placeholder">Welcome to Shell - Web3 Dev Studio</span>
              ) : (
                output.map((line, i) => (
                  <div key={i} className="line">{line}</div>
                ))
              )}
            </div>
            <div className="terminal-input">
              <span>$</span>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runCommand()}
                placeholder="Enter command..."
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
