// Web3 Reports View Contribution

import { injectable } from 'inversify';
import { Command, ViewContainer } from '@theia/core/lib/browser';
import { Web3ReportsView } from './web3-reports-view';

@injectable()
export class Web3ReportsViewContribution {
    
    readonly id = 'web3-reports-view';
    
    registerCommands(registry: Command.Registry): void {
        registry.registerCommand(
            { id: 'web3.reports.view' },
            {
                execute: () => this.openView({ reveal: true })
            }
        );
    }
    
    registerViews(registry: ViewContainer.Registry): void {
        registry.registerView({
            id: this.id,
            component: Web3ReportsView,
            title: 'Shell Reports'
        });
    }
    
    async openView(options?: { reveal?: boolean }): Promise<void> {
        // Open the view
    }
}
