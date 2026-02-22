import React, { useState, useMemo } from 'react';

type ReportType = 'build' | 'test' | 'audit' | 'deploy';
type Chain = 'SVM' | 'EVM';
type Status = 'success' | 'failure';

interface BaseReport {
  id: string;
  type: ReportType;
  chain: Chain;
  status: Status;
  timestamp: number;
}

interface BuildReport extends BaseReport {
  type: 'build';
  compilerVersion?: string;
  artifacts?: string[];
  output?: string;
  duration?: number;
}

interface TestReport extends BaseReport {
  type: 'test';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration?: number;
  testResults?: Array<{
    name: string;
    status: 'passed' | 'failed';
    duration?: number;
  }>;
}

interface AuditReport extends BaseReport {
  type: 'audit';
  critical: number;
  high: number;
  medium: number;
  low: number;
  vulnerabilities?: Array<{
    name: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description?: string;
  }>;
}

interface DeployReport extends BaseReport {
  type: 'deploy';
  contractAddress?: string;
  txHash?: string;
  network?: string;
  explorerUrl?: string;
  gasUsed?: string;
}

type Report = BuildReport | TestReport | AuditReport | DeployReport;

export interface ReportsDashboardProps {
  reports?: Report[];
  onReportClick?: (report: Report) => void;
}

const typeIcons: Record<ReportType, string> = {
  build: '🔨',
  test: '🧪',
  audit: '🔒',
  deploy: '🚀',
};

const formatTimestamp = (ts: number): string => {
  const now = Date.now();
  const diff = now - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days} days ago`;
};

const formatFullTimestamp = (ts: number): string => {
  return new Date(ts).toLocaleString();
};

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return '#ff0040';
    case 'high': return '#ff6b35';
    case 'medium': return '#ffc107';
    case 'low': return '#00d9ff';
    default: return '#9ca3af';
  }
};

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ 
  reports = [], 
  onReportClick 
}) => {
  const [filterType, setFilterType] = useState<ReportType | 'all'>('all');
  const [filterChain, setFilterChain] = useState<Chain | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredReports = useMemo(() => {
    return reports
      .filter(r => filterType === 'all' || r.type === filterType)
      .filter(r => filterChain === 'all' || r.chain === filterChain)
      .filter(r => filterStatus === 'all' || r.status === filterStatus)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [reports, filterType, filterChain, filterStatus]);

  const stats = useMemo(() => {
    const builds = reports.filter(r => r.type === 'build');
    const buildSuccess = builds.filter(r => r.status === 'success').length;
    
    const tests = reports.filter(r => r.type === 'test');
    const totalTests = tests.reduce((sum, t) => sum + t.totalTests, 0);
    const passedTests = tests.reduce((sum, t) => sum + t.passedTests, 0);
    
    const audits = reports.filter(r => r.type === 'audit');
    const criticalCount = audits.reduce((sum, a) => sum + a.critical, 0);
    
    const deploys = reports.filter(r => r.type === 'deploy').length;
    
    return {
      buildTotal: builds.length,
      buildSuccessRate: builds.length ? Math.round((buildSuccess / builds.length) * 100) : 0,
      testTotal: totalTests,
      testPassRate: totalTests ? Math.round((passedTests / totalTests) * 100) : 0,
      auditCritical: criticalCount,
      deployCount: deploys,
    };
  }, [reports]);

  const containerStyle: React.CSSProperties = {
    border: '1px solid #00ffcc',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    maxWidth: 900,
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%)',
    color: '#e0e0ff',
    boxShadow: '0 0 20px rgba(0, 255, 204, 0.15), inset 0 0 60px rgba(0, 255, 204, 0.03)',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 16,
    color: '#00ffcc',
    textShadow: '0 0 10px rgba(0, 255, 204, 0.5)',
    borderBottom: '1px solid rgba(0, 255, 204, 0.3)',
    paddingBottom: 8,
  };

  const statsBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 24,
    marginBottom: 16,
    padding: 12,
    background: 'rgba(0, 255, 204, 0.05)',
    borderRadius: 6,
    border: '1px solid rgba(0, 255, 204, 0.2)',
    flexWrap: 'wrap',
  };

  const statItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    color: '#00ffcc',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#8080a0',
    textTransform: 'uppercase',
    letterSpacing: 1,
  };

  const filterRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  };

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 4,
    border: active ? '1px solid #00ffcc' : '1px solid rgba(0, 255, 204, 0.3)',
    background: active ? 'rgba(0, 255, 204, 0.15)' : 'transparent',
    color: active ? '#00ffcc' : '#8080a0',
    cursor: 'pointer',
    fontSize: 12,
    transition: 'all 0.2s ease',
  });

  const cardStyle: React.CSSProperties = {
    border: '1px solid rgba(0, 255, 204, 0.3)',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    background: 'rgba(10, 10, 26, 0.8)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const expandedStyle: React.CSSProperties = {
    marginTop: 12,
    padding: 12,
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
    fontSize: 12,
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderExpandedDetails = (report: Report) => {
    switch (report.type) {
      case 'build': {
        const br = report as BuildReport;
        return (
          <div style={expandedStyle}>
            {br.compilerVersion && <div>Compiler: {br.compilerVersion}</div>}
            {br.duration && <div>Duration: {br.duration}ms</div>}
            {br.artifacts && br.artifacts.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, marginTop: 8 }}>Artifacts:</div>
                {br.artifacts.map((a, i) => <div key={i}>• {a}</div>)}
              </div>
            )}
            {br.output && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 600 }}>Output:</div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#00ff88' }}>{br.output}</pre>
              </div>
            )}
          </div>
        );
      }
      case 'test': {
        const tr = report as TestReport;
        return (
          <div style={expandedStyle}>
            <div>Duration: {tr.duration ? `${tr.duration}ms` : 'N/A'}</div>
            {tr.testResults && tr.testResults.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 600 }}>Test Results:</div>
                {tr.testResults.map((t, i) => (
                  <div key={i} style={{ color: t.status === 'passed' ? '#00ff88' : '#ff0040' }}>
                    {t.status === 'passed' ? '✓' : '✗'} {t.name} {t.duration ? `(${t.duration}ms)` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      case 'audit': {
        const ar = report as AuditReport;
        return (
          <div style={expandedStyle}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
              <span style={{ color: getSeverityColor('critical') }}>Critical: {ar.critical}</span>
              <span style={{ color: getSeverityColor('high') }}>High: {ar.high}</span>
              <span style={{ color: getSeverityColor('medium') }}>Medium: {ar.medium}</span>
              <span style={{ color: getSeverityColor('low') }}>Low: {ar.low}</span>
            </div>
            {ar.vulnerabilities && ar.vulnerabilities.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 600 }}>Vulnerabilities:</div>
                {ar.vulnerabilities.map((v, i) => (
                  <div key={i} style={{ marginTop: 4 }}>
                    <span style={{ color: getSeverityColor(v.severity) }}>[{v.severity.toUpperCase()}]</span> {v.name}
                    {v.description && <div style={{ color: '#8080a0', marginLeft: 16 }}>{v.description}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      case 'deploy': {
        const dr = report as DeployReport;
        return (
          <div style={expandedStyle}>
            {dr.contractAddress && (
              <div>
                <span style={{ color: '#8080a0' }}>Contract: </span>
                <span style={{ fontFamily: 'monospace' }}>{dr.contractAddress}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(dr.contractAddress || ''); }}
                  style={{ marginLeft: 8, padding: '2px 6px', fontSize: 10 }}
                >
                  Copy
                </button>
              </div>
            )}
            {dr.txHash && (
              <div style={{ marginTop: 4 }}>
                <span style={{ color: '#8080a0' }}>TX Hash: </span>
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{dr.txHash}</span>
              </div>
            )}
            {dr.network && <div style={{ marginTop: 4 }}>Network: {dr.network}</div>}
            {dr.gasUsed && <div style={{ marginTop: 4 }}>Gas Used: {dr.gasUsed}</div>}
            {dr.explorerUrl && (
              <div style={{ marginTop: 8 }}>
                <a 
                  href={dr.explorerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: '#00ffcc', textDecoration: 'none' }}
                >
                  [View on Explorer]
                </a>
              </div>
            )}
          </div>
        );
      }
    }
  };

  const renderCard = (report: Report) => {
    const isExpanded = expandedId === report.id;
    const statusIcon = report.status === 'success' ? '✅' : '❌';
    
    let summary = '';
    switch (report.type) {
      case 'build':
        summary = 'Build completed';
        break;
      case 'test': {
        const tr = report as TestReport;
        summary = `${tr.passedTests}/${tr.totalTests} passed`;
        break;
      }
      case 'audit': {
        const ar = report as AuditReport;
        summary = `${ar.critical + ar.high + ar.medium + ar.low} issues`;
        break;
      }
      case 'deploy':
        summary = 'Deployed';
        break;
    }

    return (
      <div 
        key={report.id} 
        style={cardStyle}
        onClick={() => toggleExpand(report.id)}
        role="button"
        aria-expanded={isExpanded}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>{typeIcons[report.type]}</span>
          <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#ff00ff' }}>
            {report.type}
          </span>
          <span style={{ fontSize: 11, color: '#00ff88', background: 'rgba(0, 255, 136, 0.1)', padding: '2px 6px', borderRadius: 3 }}>
            {report.chain}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8080a0' }}>
            {formatTimestamp(report.timestamp)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <span>{statusIcon}</span>
          <span style={{ fontSize: 12, color: report.status === 'success' ? '#00ff88' : '#ff0040' }}>
            {report.status === 'success' ? 'Success' : 'Failed'}
          </span>
          {summary && <span style={{ fontSize: 12, color: '#8080a0' }}>| {summary}</span>}
        </div>
        {isExpanded && renderExpandedDetails(report)}
      </div>
    );
  };

  return (
    <div style={containerStyle} aria-label="reports-dashboard">
      <div style={headerStyle}>📊 Reports Dashboard</div>
      
      <div style={statsBarStyle}>
        <div style={statItemStyle}>
          <span style={statValueStyle}>{stats.buildTotal} ({stats.buildSuccessRate}%)</span>
          <span style={statLabelStyle}>Builds</span>
        </div>
        <div style={statItemStyle}>
          <span style={statValueStyle}>{stats.testTotal} ({stats.testPassRate}%)</span>
          <span style={statLabelStyle}>Tests</span>
        </div>
        <div style={statItemStyle}>
          <span style={{ ...statValueStyle, color: stats.auditCritical > 0 ? '#ff0040' : '#00ffcc' }}>
            {stats.auditCritical} critical
          </span>
          <span style={statLabelStyle}>Audits</span>
        </div>
        <div style={statItemStyle}>
          <span style={statValueStyle}>{stats.deployCount}</span>
          <span style={statLabelStyle}>Deploys</span>
        </div>
      </div>

      <div style={filterRowStyle}>
        <span style={{ color: '#8080a0', fontSize: 12, alignSelf: 'center' }}>Type:</span>
        {(['all', 'build', 'test', 'audit', 'deploy'] as const).map(t => (
          <button 
            key={t} 
            style={filterBtnStyle(filterType === t)}
            onClick={() => setFilterType(t)}
          >
            {t === 'all' ? 'All' : `${typeIcons[t as ReportType]} ${t}`}
          </button>
        ))}
      </div>

      <div style={filterRowStyle}>
        <span style={{ color: '#8080a0', fontSize: 12, alignSelf: 'center' }}>Chain:</span>
        {(['all', 'SVM', 'EVM'] as const).map(c => (
          <button 
            key={c} 
            style={filterBtnStyle(filterChain === c)}
            onClick={() => setFilterChain(c)}
          >
            {c === 'all' ? 'All Chains' : c}
          </button>
        ))}
        <span style={{ marginLeft: 16, color: '#8080a0', fontSize: 12, alignSelf: 'center' }}>Status:</span>
        {(['all', 'success', 'failure'] as const).map(s => (
          <button 
            key={s} 
            style={filterBtnStyle(filterStatus === s)}
            onClick={() => setFilterStatus(s)}
          >
            {s === 'all' ? 'All' : s === 'success' ? '✅ Pass' : '❌ Fail'}
          </button>
        ))}
      </div>

      <div>
        {filteredReports.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8080a0', padding: 40 }}>
            No reports found
          </div>
        ) : (
          filteredReports.map(renderCard)
        )}
      </div>
    </div>
  );
};

export default ReportsDashboard;
