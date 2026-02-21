// Web3 Project View
// Shows project info, chain detection, and action buttons

import { View, ViewContainer } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from 'inversify';
import { ShellCommands } from './shell-commands';

@injectable()
export class Web3ProjectView extends View {
    
    @inject(ShellCommands)
    private shellCommands: ShellCommands;
    
    protected chain: 'solana' | 'evm' | 'unknown' = 'unknown';
    protected network: string = 'devnet';
    protected walletConnected: boolean = false;
    
    @postConstruct()
    protected init(): void {
        this.detectChain();
    }
    
    async detectChain(): Promise<void> {
        // Check for Anchor.toml (Solana)
        // Check for foundry.toml / hardhat.config.js (EVM)
        this.chain = await this.shellCommands.detectProjectType();
        this.update();
    }
    
    protected update(): void {
        // Re-render the view
        this.title.label = `Web3 Project (${this.chain})`;
    }
    
    async runBuild(): Promise<void> {
        await this.shellCommands.runBuild();
    }
    
    async runTest(): Promise<void> {
        await this.shellCommands.runTest();
    }
    
    async runDeploy(): Promise<void> {
        await this.shellCommands.runDeploy();
    }
    
    async runAudit(): Promise<void> {
        await this.shellCommands.runAudit();
    }
    
    render(): React.ReactNode {
        return (
            <div className="web3-project-view">
                <div className="project-info">
                    <div className="chain-badge">
                        Chain: <span className={this.chain}>{this.chain.toUpperCase()}</span>
                    </div>
                    <div className="network-selector">
                        Network: 
                        <select value={this.network} onChange={e => this.network = e.target.value}>
                            <option value="devnet">Devnet</option>
                            <option value="testnet">Testnet</option>
                            <option value="mainnet">Mainnet</option>
                        </select>
                    </div>
                </div>
                
                <div className="action-buttons">
                    <button onClick={() => this.runBuild()}>Build</button>
                    <button onClick={() => this.runTest()}>Test</button>
                    <button onClick={() => this.runDeploy()}>Deploy</button>
                    <button onClick={() => this.runAudit()}>Audit</button>
                </div>
                
                <div className="wallet-status">
                    Wallet: {this.walletConnected ? 'Connected' : 'Not Connected'}
                </div>
            </div>
        );
    }
}
