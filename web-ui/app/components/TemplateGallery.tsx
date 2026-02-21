import React, { useMemo, useState } from 'react'
import { TemplateCard, TemplateItem } from './TemplateCard'

interface Props {
  templates: TemplateItem[]
  onUse?: (t: TemplateItem) => void
}

export const TemplateGallery: React.FC<Props> = ({ templates, onUse }) => {
  const [tab, setTab] = useState<'SVM' | 'EVM'>('SVM')
  const [query, setQuery] = useState<string>('')

  // Prepare up to 8 SVM and 8 EVM templates, then show both for a total of 16 cards
  const allTemplates = useMemo(() => {
    const svm = templates.filter(t => (t.chain ?? 'SVM') === 'SVM').slice(0, 8)
    const evm = templates.filter(t => (t.chain ?? 'EVM') === 'EVM').slice(0, 8)
    return [...svm, ...evm]
  }, [templates])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return allTemplates.filter(t => (t.name + ' ' + t.description).toLowerCase().includes(q))
  }, [allTemplates, query])

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
    paddingTop: 12,
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid rgba(0,255,255,.6)',
    background: active ? '#0b0b12' : '#111',
    color: '#e6faff',
    cursor: 'pointer',
    marginRight: 8,
  })

  const searchStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid rgba(0,255,255,.6)',
    background: '#0b0b12',
    color: '#e6faff',
  }

  return (
    <div style={{ padding: 16, fontFamily: 'Arial, sans-serif', color: '#e6faff', background: '#0a0a0f', minHeight: '100vh' }}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Template Gallery</span>
          <span style={tabStyle(true)}>SVM</span>
          <span style={tabStyle(false)}>EVM</span>
        </div>
        <input
          placeholder="Search templates"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={searchStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button style={tab === 'SVM' ? { ...tabStyle(true), borderColor: '#0ff' } : tabStyle(false)} onClick={() => setTab('SVM')}>SVM</button>
        <button style={tab === 'EVM' ? { ...tabStyle(true), borderColor: '#0ff' } : tabStyle(false)} onClick={() => setTab('EVM')}>EVM</button>
      </div>

      <div style={gridStyle}>
        {filtered.map(t => (
          <TemplateCard key={t.id} t={t} onUse={onUse ?? ((t: any) => {})} />
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => { window.location.hash = '#/ai-chat'; }} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #0ff', background: '#0b0b12', color: '#e6faff' }}>
          Start from scratch →
        </button>
      </div>
    </div>
  )
}

export default TemplateGallery
