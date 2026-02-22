// Lightweight AI-style code review helpers (stand-in for real AI).
// Provides simple heuristics for common risky patterns and returns
// structured comments that can be surface in the editor UI.

export type AiReviewComment = {
  line?: number
  message: string
  severity: 'Info' | 'Low' | 'Medium' | 'High' | 'Critical'
  ruleId?: string
  suggestedFix?: string
}

type ReviewResult = {
  comments: AiReviewComment[]
  // optional overall score label (e.g., for a quick UI badge)
  score?: string
}

// Run a lightweight review over the given code snippet.
export function runAiReview(code: string, filepath?: string): ReviewResult {
  const comments: AiReviewComment[] = []

  // High-risk: eval usage
  if (typeof code === 'string' && code.includes('eval(')) {
    comments.push({
      line: 1,
      message: 'Use of eval() is dangerous and can lead to security issues',
      severity: 'High',
      ruleId: 'SEC-EVAL',
      suggestedFix: 'Avoid eval; prefer safe parsing or Function constructors with strict input validation.'
    })
  }

  // XSS/unsafe DOM manipulation hints
  if (typeof code === 'string' && (code.includes('innerHTML') || code.includes('dangerouslySetInnerHTML'))) {
    comments.push({
      line: 1,
      message: 'Direct DOM manipulation via innerHTML or dangerouslySetInnerHTML can introduce XSS risks',
      severity: 'High',
      ruleId: 'SEC-DOM-XSS',
      suggestedFix: 'Prefer safe DOM APIs and proper escaping for user-provided content.'
    })
  }

  // Cookie access hints
  if (typeof code === 'string' && code.includes('document.cookie')) {
    comments.push({
      line: 1,
      message: 'Accessing document.cookie may leak sensitive information; ensure proper scoping and sanitization',
      severity: 'Medium',
      ruleId: 'SEC-COOKIE',
      suggestedFix: 'Limit cookie access and add HttpOnly / Secure flags where appropriate.'
    })
  }

  // TS-specific: warn about using any in TypeScript files
  if (filepath?.endsWith('.ts')) {
    const anyRegex = /\bany\b/
    if (typeof code === 'string' && anyRegex.test(code)) {
      comments.push({
        line: 1,
        message: 'Usage of TypeScript any; prefer a more specific type to improve safety',
        severity: 'Medium',
        ruleId: 'TS-ANY',
        suggestedFix: 'Refine types to avoid loose any usage.'
      })
    }
  }

  // Simple scoring heuristic
  let score = 'None'
  const hasHigh = comments.some(c => c.severity === 'High' || c.severity === 'Critical')
  const hasMedium = comments.some(c => c.severity === 'Medium')
  if (hasHigh) score = 'High'
  else if (hasMedium) score = 'Medium'
  else if (comments.length > 0) score = 'Low'

  return { comments, score }
}

// Convenience wrapper used by editor integration to surface comments.
export function rateCode(code: string, filepath?: string): AiReviewComment[] {
  const { comments } = runAiReview(code, filepath)
  return comments
}
