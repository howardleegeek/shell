import React from 'react'

type TemplateInfo = {
  id: string
  name: string
  description: string
  icon: string
  promptTemplate: string
  category: 'SVM' | 'EVM'
}

type Props = {
  t: TemplateInfo
}

export const TemplateCard: React.FC<Props> = ({ t }) => {
  const handleUse = () => {
    // Hook this up to AI chat flow in the real app
    console.log('use-template', t.id, t.name)
  }

  return (
    <div
      style={{
        border: '2px solid #2a2a68',
        borderRadius: 12,
        padding: 12,
        background: '#0f0f19',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 150,
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
