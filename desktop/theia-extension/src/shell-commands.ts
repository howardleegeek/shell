// Shell Commands - Bridge between Theia and Tauri Backend

import { injectable } from 'inversify';
import { invoke } from '@tauri-apps/api/tauri';

export interface ReportFile {
    name: string;
    path: string;
    type: 'test' | 'deploy' | 'audit';
    ok: boolean;
    summary: string;
}

@injectable()
export class ShellCommands {
    
    async detectProjectType(): Promise<'solana' | 'evm' | 'unknown'> {
        // Check for project files
        // This would call Tauri backend to check file system
        return 'evm'; // placeholder
    }
    
    async runBuild(): Promise<void> {
        await invoke('run_web3_command', {
            tool: 'forge',
            args: ['build'],
            cwd: null
        });
    }
    
    async runTest(): Promise<void> {
        await invoke('run_web3_command', {
            tool: 'forge',
            args: ['test'],
            cwd: null
        });
    }
    
    async runDeploy(): Promise<void> {
        // Deploy logic
    }
    
    async runAudit(): Promise<void> {
        await invoke('run_web3_command', {
            tool: 'slither',
            args: ['.'],
            cwd: null
        });
    }
    
    async listReports(): Promise<ReportFile[]> {
        // Would read reports/ directory
        return [];
    }
    
    async readReport(path: string): Promise<object> {
        // Would read JSON file
        return {};
    }
}
