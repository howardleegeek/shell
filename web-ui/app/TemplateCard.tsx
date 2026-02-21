import React, { useState } from 'react'
import { useNavigate } from '@remix-run/react'

type TemplateInfo = {
  id: string
  name: string
  description: string
  icon: string
  promptTemplate: string
  category: 'SVM' | 'EVM'
  // Optional field used by tests/consumers to explicitly mark the channel
  // (SVM or EVM). Existing data may populate this as undefined; the code
  // handles that with a fallback elsewhere.
  chain?: string
}

type Props = {
  t: TemplateInfo
  onUse?: (t: TemplateInfo) => void
}

export const TemplateCard: React.FC<Props> = ({ t, onUse }) => {
  const navigate = useNavigate()
  const [hover, setHover] = useState(false)
  const handleUse = () => {
    if (onUse) {
      onUse(t)
      return
    }
    // Fallback: open AI chat with prefilled prompt
    const encoded = encodeURIComponent(t.promptTemplate)
    navigate(`/ai-chat?prompt=${encoded}`)
  }

  return (
    <div
      data-testid={`template-${t.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: '2px solid #2a2a68',
        borderRadius: 12,
        padding: 12,
        background: '#0f0f19',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 150,
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        // Cyberpunk glow on hover
        boxShadow: hover ? '0 0 14px rgba(0, 255, 255, 0.8)' : 'none',
        borderColor: hover ? '#3f3f8f' : '#2a2a68',
      }}
    >
      <div style={{ fontSize: 20 }}>{t.icon} {t.name}</div>
      <div style={{ color: '#cbd5e1', fontSize: 12, minHeight: 40 }}>{t.description}</div>
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleUse} style={useButtonStyle}>Use</button>
      </div>
    </div>
  )
}

const useButtonStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #3f3f8f',
  background: '#0b0b1a',
  color: '#7df2ff',
}

export default TemplateCard
