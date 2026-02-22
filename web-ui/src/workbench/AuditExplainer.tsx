import React from 'react'
import './AuditExplainer.css'

type Finding = {
  id: string
  type: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  description?: string
  filePath?: string
  codeSnippet?: string
}

type AuditReport = {
  findings: Finding[]
}

type AIResult = {
  explanation: string
  attackScenario: string
  fixCode: string
  references: string[]
}

type Props = {
  auditReport?: AuditReport | null
  // Callback invoked when the user wants to apply a patch
  onApplyPatch?: (payload: { targetFile?: string; patchCode?: string }) => void
}

const severityClass = (sev: Finding['severity']) => {
  switch (sev) {
    case 'Critical':
      return 'severity-Critical'
    case 'High':
      return 'severity-High'
    case 'Medium':
      return 'severity-Medium'
    case 'Low':
      return 'severity-Low'
  }
}

// Very small, self-contained AI simulation for tests.
// In real usage this would call an external AI service with a proper prompt.
const generateAIResponse = (finding: Finding): AIResult => {
  const base = finding.description || finding.type
  const explanation = `Explaination for ${finding.id}: ${base}. This finding indicates a potential vulnerability that needs review by a security expert.`
  const attackScenario = `Attacker could exploit this by crafting input that triggers the vulnerable path.`
  const fixCode = `diff --git a/${finding.filePath ?? 'unknown'} b/${finding.filePath ?? 'unknown'}\n--- a/${finding.filePath ?? 'unknown'}\n+++ b/${finding.filePath ?? 'unknown'}\n@@\n- vulnerableCode();\n+ secureAlternative();`
  const references = ['https://example.com/SWC-000', 'https://cve.mitre.org/']
  return { explanation, attackScenario, fixCode, references }
}

const AuditExplainer: React.FC<Props> = ({ auditReport, onApplyPatch }) => {
  const [aiResults, setAiResults] = React.useState<Record<string, AIResult>>({})
  const [loading, setLoading] = React.useState<string | null>(null)

  const handleExplain = (f: Finding) => {
    setLoading(f.id)
    // Simulate async API call
    setTimeout(() => {
      const res = generateAIResponse(f)
      setAiResults((prev) => ({ ...prev, [f.id]: res }))
      setLoading(null)
    }, 0)
  }

  const handleApplyPatch = (f: Finding, patchCode: string) => {
    if (onApplyPatch) {
      onApplyPatch({ targetFile: f.filePath, patchCode })
    }
  }

  const findings = auditReport?.findings ?? []

  return (
    <div className="audit-explainer" aria-label="Audit Explainer">
      {findings.length === 0 && <div className="empty">No audit findings available</div>}
      {findings.map((f) => {
        const ai = aiResults[f.id]
        const isLoading = loading === f.id
        return (
          <div key={f.id} className="finding-card" data-id={f.id}>
            <div className="fe-header">
              <span className={`severity-badge ${severityClass(f.severity)}`} aria-label={`severity-${f.severity}`} />
              <span className="finding-title">{f.type}</span>
              {f.description && (
                <span className="finding-desc">{f.description}</span>
              )}
              <button className="btn explain-btn" onClick={() => handleExplain(f)} disabled={!!isLoading}>
                Explain{isLoading ? '...' : ''}
              </button>
            </div>

            {ai && (
              <div className="ai-panel" role="region" aria-label={`ai-result-${f.id}`}>
                <p className="ai-section"><strong>Explanation:</strong> {ai.explanation}</p>
                <p className="ai-section"><strong>Attack scenario:</strong> {ai.attackScenario}</p>
                <pre className="ai-section fix-code" aria-label="ai-fix-code">{ai.fixCode}</pre>
                <p className="ai-section"><strong>References:</strong> {ai.references.join(', ')}</p>
                <button className="btn apply-btn" onClick={() => handleApplyPatch(f, ai.fixCode)}>
                  Apply Fix
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default AuditExplainer
