import React, { useMemo, useState } from 'react'
import registry from '../../templates/registry.json'

export type TemplateItem = {
  id: string
  name: string
  description: string
  chain: string
  category: string
  icon: string
  promptTemplate: string
}

export const TemplateCard: React.FC<{ template: TemplateItem; onUse: () => void }> = ({ template, onUse }) => {
  const cardStyle: React.CSSProperties = {
    border: '1px solid #0ff',
    borderRadius: 8,
    padding: 12,
    background: '#0c0f14',
    color: '#e6faff',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  }
  const iconStyle: React.CSSProperties = { fontSize: 28, alignSelf: 'flex-start' }
  const titleStyle: React.CSSProperties = { fontWeight: 700, fontSize: 14 }
  const descStyle: React.CSSProperties = { fontSize: 12, color: '#cbd5e1' }
  const buttonStyle: React.CSSProperties = {
    marginTop: 6,
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #0ff',
    background: 'transparent',
    color: '#0ff',
    cursor: 'pointer',
  }

  return (
    <div style={cardStyle}>
      <div style={iconStyle}>{template.icon}</div>
      <div style={titleStyle}>{template.name}</div>
      <div style={descStyle}>{template.description}</div>
      <button style={buttonStyle} onClick={onUse}>Use</button>
    </div>
  )
}

export const TemplateGallery: React.FC = () => {
  const [tab, setTab] = useState<'SVM' | 'EVM'>('SVM')
  const [query, setQuery] = useState('')

  const items = registry as TemplateItem[]
  const filtered = items.filter((t) => t.chain === tab && t.name.toLowerCase().includes(query.toLowerCase()))

  const onUse = (tmpl: TemplateItem) => {
    // In a real app, this would navigate to AI chat with a prefilled prompt
    // For this mock, we'll just log to console.
    console.log('Use template', tmpl.id)
  }

  const containerStyle: React.CSSProperties = { padding: 16, fontFamily: 'system-ui, Arial' }
  const headerStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, marginBottom: 12 }
  const toolbarStyle: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }
  const tabButtonStyle: React.CSSProperties = { padding: '6px 12px', borderRadius: 6, border: '1px solid #0ff', background: 'transparent', color: '#0ff', cursor: 'pointer' }
  const activeTabStyle: React.CSSProperties = { ...tabButtonStyle, background: '#091018' }
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 16,
  }
  const inputStyle: React.CSSProperties = { padding: '6px 10px', borderRadius: 6, border: '1px solid #0ff', outline: 'none', color: '#0ff', background: '#041018' }
  const startRowStyle: React.CSSProperties = { marginTop: 18, display: 'flex', justifyContent: 'flex-end' }
  const startButtonStyle: React.CSSProperties = { padding: '8px 14px', borderRadius: 6, border: '1px solid #0ff', background: '#001522', color: '#0ff', cursor: 'pointer' }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>Template Gallery</div>
      <div style={toolbarStyle}>
        <button className="tab-svm" style={tab === 'SVM' ? activeTabStyle : tabButtonStyle} onClick={() => setTab('SVM')}>SVM</button>
        <button className="tab-evm" style={tab === 'EVM' ? activeTabStyle : tabButtonStyle} onClick={() => setTab('EVM')}>EVM</button>
        <input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} style={inputStyle} />
      </div>
      <div style={gridStyle}>
        {filtered.map((t) => (
          <TemplateCard key={t.id} template={t} onUse={() => onUse(t)} />
        ))}
      </div>
      <div style={startRowStyle}>
        <button style={startButtonStyle} onClick={() => console.log('Start from scratch')}>Start from scratch →</button>
      </div>
    </div>
  )
}

export default TemplateGallery
