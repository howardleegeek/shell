import React from 'react'

// Lightweight AI doc generation helpers for Solidity and Rust (Anchor)
export type Language = 'solidity' | 'rust' | null

// Detect language by simple heuristics
export function detectLanguage(code: string): Language {
  if (!code) return null
  const lower = code.toLowerCase()
  // Solidity indicators
  if (lower.includes('pragma solidity') || lower.includes('contract ')) {
    return 'solidity'
  }
  // Rust/Anchor indicators
  if (lower.includes('use anchor_lang') || lower.includes('#[instruction]') || lower.includes('pub struct') || lower.includes('pub fn')) {
    return 'rust'
  }
  return null
}

type SolidityPlanItem = { line: number; comment: string }
type RustPlanItem = { line: number; comment: string }

// Generate NatSpec blocks for Solidity functions found in the code
export function planDocsForSolidity(code: string): SolidityPlanItem[] {
  const lines = code.split(/\r?\n/)
  const out: SolidityPlanItem[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*function\s+([\w$]+)\s*\(/.test(line)) {
      const block = [
        '/**',
        ' * @title Auto-generated doc',
        ' * @author AutoDoc',
        ' * @notice Auto-generated NatSpec',
        ' * @dev Auto-generated',
        ' */',
      ].join('\n')
      out.push({ line: i + 1, comment: block })
    }
  }
  return out
}

// Generate simple doc blocks for Rust/Anchor handlers (as comments above functions)
export function planDocsForRust(code: string): RustPlanItem[] {
  const lines = code.split(/\r?\n/)
  const out: RustPlanItem[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*pub\s+fn\s+([a-zA-Z_][\w]*)\s*\(/.test(line)) {
      const block = [
        '/// Auto-generated doc for handler',
        '/// (Rust Anchor instruction handler)'
      ].join('\n')
      out.push({ line: i + 1, comment: block })
    }
  }
  return out
}

type Props = {
  editorContent: string
  onInsertEdits: (edits: Array<{ line: number; text: string }>) => void
  taskId?: string
}

// Simple UI: a single button that asks host to insert generated docs
export const NatSpecGenerator: React.FC<Props> = ({ editorContent, onInsertEdits }) => {
  const [status, setStatus] = React.useState<string | null>(null)

  const generate = async () => {
    try {
      const lang = detectLanguage(editorContent)
      if (!lang) {
        setStatus('Unsupported language')
        return
      }
      // Build a language-specific AI request
      const systemPrompt = lang === 'solidity'
        ? `你是 Solidity 文档专家，精通 NatSpec 的格式与约定。为以下 Solidity 代码生成注释。遵循以下约束：1) 只生成注释，不修改代码；2) NatSpec 格式包含：@title、@author、@notice、@dev、@param、@return、@inheritdoc；3) 输出应采用 JSON 列表，形如 [{"line": 行号, "comment": "注释文本"}, ...]。`
        : `你是 Anchor Rust 文档专家，精通 Rust doc 注释。为以下 Rust/Anchor 代码生成注释。遵循以下约束：1) 只生成注释，不修改代码；2) 使用 /// 形式的注释，覆盖模块、每个 instruction handler、以及 account struct 的字段；3) 输出应采用 JSON 列表，形如 [{"line": 行号, "comment": "注释文本"}, ...]。`

      // Call the AI backend (assumes a /api/generate-docs endpoint exists in the project)
      setStatus('generating')
      const res = await fetch('/api/generate-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang, code: editorContent, systemPrompt }),
      })
      let edits: Array<{ line: number; text: string }> = []
      if (res.ok) {
        const data = await res.json()
        // Expected shape: { edits: [ { line: number, comment: string }, ... ] }
        if (data && Array.isArray(data.edits)) {
          edits = data.edits.map((e: any) => ({ line: Number(e.line) || 1, text: String(e.comment) }))
        } else {
          // Fallback to local planner if AI response is invalid
          if (lang === 'solidity') {
            const blocks = planDocsForSolidity(editorContent)
            edits = blocks.map(b => ({ line: b.line, text: b.comment }))
          } else {
            const blocks = planDocsForRust(editorContent)
            edits = blocks.map(b => ({ line: b.line, text: b.comment }))
          }
        }
      } else {
        // Fallback to local planner if AI backend is unavailable
        if (lang === 'solidity') {
          const blocks = planDocsForSolidity(editorContent)
          edits = blocks.map(b => ({ line: b.line, text: b.comment }))
        } else {
          const blocks = planDocsForRust(editorContent)
          edits = blocks.map(b => ({ line: b.line, text: b.comment }))
        }
      }
      setStatus('generated')
      onInsertEdits(edits)
    } catch (err) {
      setStatus('error')
      // eslint-disable-next-line no-console
      console.error('[NatSpecGenerator] error', err)
    }
  }

  return (
    <div className="nat-spec-generator" data-task-id={''}>
      <button onClick={generate} aria-label="Generate Docs">Generate Docs</button>
      {status && <span className="status">{status}</span>}
    </div>
  )
}

export default NatSpecGenerator
