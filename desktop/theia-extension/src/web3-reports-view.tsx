// Web3 Reports View
// Shows test/deploy/audit reports in JSON format

import { View } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from 'inversify';
import { ShellCommands } from './shell-commands';

interface ReportFile {
    name: string;
    path: string;
    type: 'test' | 'deploy' | 'audit';
    ok: boolean;
    summary: string;
}

@injectable()
export class Web3ReportsView extends View {
    
    @inject(ShellCommands)
    private shellCommands: ShellCommands;
    
    protected reports: ReportFile[] = [];
    protected selectedReport: ReportFile | null = null;
    protected reportContent: object | null = null;
    
    @postConstruct()
    protected init(): void {
        this.title.label = 'Shell Reports';
        this.loadReports();
    }
    
    async loadReports(): Promise<void> {
        this.reports = await this.shellCommands.listReports();
        this.update();
    }
    
    async selectReport(report: ReportFile): Promise<void> {
        this.selectedReport = report;
        this.reportContent = await this.shellCommands.readReport(report.path);
        this.update();
    }
    
    render(): React.ReactNode {
        return (
            <div className="web3-reports-view">
                <div className="reports-list">
                    <h3>Reports</h3>
                    {this.reports.length === 0 ? (
                        <p className="empty">No reports yet</p>
                    ) : (
                        <ul>
                            {this.reports.map(report => (
                                <li 
                                    key={report.name}
                                    className={report.ok ? 'success' : 'failure'}
                                    onClick={() => this.selectReport(report)}
                                >
                                    <span className="status">{report.ok ? '✅' : '❌'}</span>
                                    <span className="name">{report.name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                
                <div className="report-detail">
                    {this.selectedReport ? (
                        <>
                            <h4>{this.selectedReport.name}</h4>
                            <pre>{JSON.stringify(this.reportContent, null, 2)}</pre>
                        </>
                    ) : (
                        <p className="empty">Select a report to view details</p>
                    )}
                </div>
            </div>
        );
    }
}
