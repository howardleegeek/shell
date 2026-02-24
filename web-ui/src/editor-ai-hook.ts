import { rateCode } from './ai-review'

// Attach a lightweight AI review to a given editor instance.
// The editor is expected to expose a few possible hooks:
// - getValue(): string
// - on(eventName, handler): void  (eventName: 'save')
// - showInlineComments(comments): void  (optional)
export function attachAiReviewToEditor(editor: any, filepath: string) {
  if (!editor) return

  const getContent = (): string => {
    try {
      if (typeof editor.getValue === 'function') {
        return editor.getValue()
      }
      if (typeof editor.value === 'string') {
        return editor.value
      }
      // Fallback: try a document-like API
      const doc = (editor as any).getDocument?.()
      if (doc && typeof doc.getValue === 'function') {
        return doc.getValue()
      }
    } catch {
      // ignore
    }
    return ''
  }

  const deliverComments = (comments: any[]) => {
    if (!comments || !Array.isArray(comments)) return
    if (typeof editor.showInlineComments === 'function') {
      editor.showInlineComments(
        comments.map((c) => ({
          line: c.line,
          message: c.message,
          severity: c.severity,
          ruleId: c.ruleId,
          suggestedFix: c.suggestedFix,
        }))
      )
    }
  }

  const runAndAttach = () => {
    const content = getContent()
    const comments = rateCode(content, filepath)
    deliverComments(comments)
    // Attach a lightweight score for potential UI usage
    // @ts-ignore
    editor.aiReview = { comments, score: (comments.length ? 'Review-ready' : 'No issues') }
  }

  // Run immediately on attach
  runAndAttach()

  // Re-run on editor save if supported
  if (typeof editor.on === 'function') {
    editor.on('save', () => {
      runAndAttach()
    })
  }
}
