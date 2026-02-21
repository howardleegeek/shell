// Web3 Project View Contribution

import { injectable } from 'inversify';
import { Command, ViewContainer } from '@theia/core/lib/browser';
import { Web3ProjectView } from './web3-project-view';

@injectable()
export class Web3ProjectViewContribution {
    
    readonly id = 'web3-project-view';
    
    registerCommands(registry: Command.Registry): void {
        registry.registerCommand(
            { id: 'web3.project.view' },
            {
                execute: () => this.openView({ reveal: true })
            }
        );
    }
    
    registerViews(registry: ViewContainer.Registry): void {
        registry.registerView({
            id: this.id,
            component: Web3ProjectView,
            title: 'Web3 Project'
        });
    }
    
    async openView(options?: { reveal?: boolean }): Promise<void> {
        // Open the view
    }
}
