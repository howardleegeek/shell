// Shell Web3 Theia Extension
// Provides Web3-specific views for Theia IDE

import { ContainerModule, interfaces } from 'inversify';
import { Web3ProjectView } from './web3-project-view';
import { Web3ReportsView } from './web3-reports-view';
import { Web3ProjectViewContribution } from './web3-project-view-contribution';
import { Web3ReportsViewContribution } from './web3-reports-view-contribution';

export const shellWeb3ExtensionModule = new ContainerModule((bind: interfaces.Bind) => {
    // Views
    bind(Web3ProjectView).toSelf();
    bind(Web3ReportsView).toSelf();
    
    // View Contributions (for opening views)
    bind(Web3ProjectViewContribution).toSelf();
    bind(Web3ReportsViewContribution).toSelf();
});

export { Web3ProjectView, Web3ReportsView };
