import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export type ChainMode = 'svm' | 'evm';

interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  capabilities: string[];
}

interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
  chainModes: Record<string, { mcpServer: string; defaultNetwork: string }>;
}

class MCPServerManager {
  private config: MCPConfig | null = null;
  private runningProcesses: Map<string, ChildProcess> = new Map();
  private currentMode: ChainMode | null = null;
  private configPath: string;

  constructor() {
    this.configPath = path.join(__dirname, 'mcp-servers.json');
  }

  async loadConfig(): Promise<void> {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf-8');
      this.config = JSON.parse(configData);
    } catch (error) {
      console.error('[MCPServerManager] Failed to load config:', error);
      throw error;
    }
  }

  async startServer(serverName: string): Promise<void> {
    if (!this.config) {
      await this.loadConfig();
    }

    const serverConfig = this.config!.mcpServers[serverName];
    if (!serverConfig) {
      throw new Error(`Unknown MCP server: ${serverName}`);
    }

    if (this.runningProcesses.has(serverName)) {
      console.log(`[MCPServerManager] ${serverName} is already running`);
      return;
    }

    console.log(`[MCPServerManager] Starting ${serverName}...`);

    const env = { ...process.env, ...serverConfig.env };
    const proc = spawn(serverConfig.command, serverConfig.args, {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    proc.stdout?.on('data', (data) => {
      console.log(`[${serverName}] ${data.toString().trim()}`);
    });

    proc.stderr?.on('data', (data) => {
      console.error(`[${serverName}] ${data.toString().trim()}`);
    });

    proc.on('exit', (code) => {
      console.log(`[MCPServerManager] ${serverName} exited with code ${code}`);
      this.runningProcesses.delete(serverName);
    });

    this.runningProcesses.set(serverName, proc);
    console.log(`[MCPServerManager] ${serverName} started successfully`);
  }

  async stopServer(serverName: string): Promise<void> {
    const proc = this.runningProcesses.get(serverName);
    if (!proc) {
      console.log(`[MCPServerManager] ${serverName} is not running`);
      return;
    }

    proc.kill();
    this.runningProcesses.delete(serverName);
    console.log(`[MCPServerManager] Stopped ${serverName}`);
  }

  async switchChainMode(mode: ChainMode): Promise<void> {
    if (!this.config) {
      await this.loadConfig();
    }

    const modeConfig = this.config!.chainModes[mode];
    if (!modeConfig) {
      throw new Error(`Unknown chain mode: ${mode}`);
    }

    console.log(`[MCPServerManager] Switching to ${mode} mode`);

    if (this.currentMode) {
      const currentServer = this.config!.chainModes[this.currentMode].mcpServer;
      await this.stopServer(currentServer);
    }

    this.currentMode = mode;
    await this.startServer(modeConfig.mcpServer);
  }

  getCapabilities(mode: ChainMode): string[] {
    if (!this.config) {
      return [];
    }

    const modeConfig = this.config.chainModes[mode];
    if (!modeConfig) {
      return [];
    }

    const serverConfig = this.config.mcpServers[modeConfig.mcpServer];
    return serverConfig?.capabilities || [];
  }

  getServerUrl(serverName: string): string {
    return `http://localhost:3000/${serverName}`;
  }

  async stopAll(): Promise<void> {
    for (const [name, proc] of this.runningProcesses) {
      proc.kill();
      console.log(`[MCPServerManager] Stopped ${name}`);
    }
    this.runningProcesses.clear();
  }
}

export const mcpManager = new MCPServerManager();
export default mcpManager;
